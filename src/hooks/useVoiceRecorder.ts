import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseVoiceRecorderOptions {
  onTranscriptUpdate?: (transcript: string) => void;
  onTranscriptComplete?: (transcript: string) => void;
  agentName?: string;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  interimTranscript: string;
  finalTranscript: string;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  isSupported: boolean;
  isIOSDevice: boolean;
}

// Minimum recording duration (ms) and blob size (bytes) to prevent hallucinations
const MIN_RECORDING_DURATION_MS = 800;
const MIN_BLOB_SIZE_BYTES = 5000;

// Detect iOS/Safari - they have limited Web Speech API support
const detectIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  
  // Check for iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  
  // Check for Safari on Mac (also has issues with continuous mode)
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isMacSafari = isSafari && /Macintosh/.test(userAgent);
  
  // iPadOS 13+ reports as Macintosh, so we need to check for touch support too
  const isIPadOS = /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1;
  
  return isIOS || isIPadOS || isMacSafari;
};

const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
};

const isMediaRecorderSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "MediaRecorder" in window && "getUserMedia" in navigator.mediaDevices;
};

export function useVoiceRecorder({
  onTranscriptUpdate,
  onTranscriptComplete,
  agentName,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  // Refs for cleanup
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef(false);
  
  // Anti-hallucination refs
  const shouldTranscribeRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);

  const isIOSDevice = detectIOS();
  const webSpeechSupported = isSpeechRecognitionSupported();
  const mediaRecorderSupported = isMediaRecorderSupported();
  
  // On iOS, use MediaRecorder. On desktop, use Web Speech API
  const useMediaRecorderFallback = isIOSDevice || !webSpeechSupported;
  const isSupported = useMediaRecorderFallback ? mediaRecorderSupported : webSpeechSupported;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Safe base64 encoding for large audio files
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const chunks: string[] = [];
    const chunkSize = 8192;
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode(...chunk));
    }
    
    return btoa(chunks.join(""));
  };

  // Start recording with MediaRecorder (iOS fallback)
  const startMediaRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;
      
      // Prioritize MP4 for iOS Safari (best compatibility)
      let mimeType = "audio/webm";
      if (isIOSDevice && MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }
      
      console.log("[VoiceRecorder] Starting MediaRecorder, mimeType:", mimeType, "isIOS:", isIOSDevice);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Reset transcript state for clean start
      setInterimTranscript("");
      setFinalTranscript("");
      finalTranscriptRef.current = "";
      
      // Mark that we SHOULD transcribe when stop is called
      shouldTranscribeRef.current = true;
      recordingStartTimeRef.current = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Check if we should transcribe (not cancelled)
        if (!shouldTranscribeRef.current) {
          console.log("[VoiceRecorder] Transcription skipped - recording was cancelled");
          audioChunksRef.current = [];
          return;
        }
        
        // Calculate recording duration
        const recordingDurationMs = Date.now() - recordingStartTimeRef.current;
        const chunkCount = audioChunksRef.current.length;
        
        console.log("[VoiceRecorder] Recording stopped, duration:", recordingDurationMs, "ms, chunks:", chunkCount);
        
        if (chunkCount === 0) {
          console.log("[VoiceRecorder] No audio chunks recorded");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        console.log("[VoiceRecorder] Audio blob size:", audioBlob.size, "bytes, mimeType:", mimeType);
        
        // Sanity check: Reject too-short recordings to prevent hallucinations
        if (recordingDurationMs < MIN_RECORDING_DURATION_MS) {
          console.log("[VoiceRecorder] Recording too short, skipping transcription");
          return;
        }
        
        // Sanity check: Reject tiny blobs (likely silent/corrupt)
        if (audioBlob.size < MIN_BLOB_SIZE_BYTES) {
          console.log("[VoiceRecorder] Audio blob too small, likely silent or corrupt");
          return;
        }
        
        await transcribeAudio(audioBlob, mimeType, recordingDurationMs);
      };
      
      mediaRecorder.start(1000); // Collect data every second
      isRecordingRef.current = true;
      setIsRecording(true);
      
      console.log("[VoiceRecorder] Recording started", agentName ? `for ${agentName}` : "");
      
    } catch (error: any) {
      console.error("[VoiceRecorder] MediaRecorder error:", error);
    }
  }, [agentName, isIOSDevice]);

  // Transcribe audio using edge function
  const transcribeAudio = useCallback(async (audioBlob: Blob, mimeType: string, durationMs?: number) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64 using safe chunked encoding
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = arrayBufferToBase64(arrayBuffer);
      
      console.log("[VoiceRecorder] Sending audio for transcription, base64 length:", base64Audio.length, "duration:", durationMs, "ms");
      
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { 
          audio: base64Audio, 
          mimeType,
          durationMs: durationMs || 0,
        },
      });
      
      if (error) {
        console.error("[VoiceRecorder] Transcription error:", error);
        return;
      }
      
      if (data?.error) {
        console.error("[VoiceRecorder] Transcription API error:", data.error);
        return;
      }
      
      const transcribedText = data?.text?.trim() || "";
      
      if (!transcribedText || transcribedText === "[ohörbart]") {
        console.log("[VoiceRecorder] No text transcribed");
        return;
      }
      
      finalTranscriptRef.current = transcribedText;
      setFinalTranscript(transcribedText);
      onTranscriptUpdate?.(transcribedText);
      onTranscriptComplete?.(transcribedText);
      
      console.log("[VoiceRecorder] Transcription complete");
    } catch (error) {
      console.error("[VoiceRecorder] Transcription failed:", error);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptUpdate, onTranscriptComplete]);

  // Start recording with Web Speech API (desktop)
  const startWebSpeechRecording = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final.trim();
        setFinalTranscript(finalTranscriptRef.current);
        onTranscriptUpdate?.(finalTranscriptRef.current);
      }
      
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event: Event & { error?: string }) => {
      console.error("[VoiceRecorder] Speech recognition error:", event.error);
      isRecordingRef.current = false;
      setIsRecording(false);
      setInterimTranscript("");
    };
    
    recognition.onend = () => {
      // Restart if still recording (continuous mode workaround)
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or stopped
        }
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    isRecordingRef.current = true;
    setIsRecording(true);
    
    console.log("[VoiceRecorder] Web Speech recording started", agentName ? `for ${agentName}` : "");
  }, [agentName, onTranscriptUpdate]);

  // Main start function
  const startRecording = useCallback(() => {
    if (!isSupported) {
      console.error("[VoiceRecorder] Voice recording not supported");
      return;
    }
    
    if (useMediaRecorderFallback) {
      startMediaRecording();
    } else {
      startWebSpeechRecording();
    }
  }, [isSupported, useMediaRecorderFallback, startMediaRecording, startWebSpeechRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setInterimTranscript("");
    
    if (useMediaRecorderFallback && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      
      // For Web Speech, call complete callback with final transcript
      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        onTranscriptComplete?.(transcript);
      }
    }
  }, [useMediaRecorderFallback, onTranscriptComplete]);

  // Cancel recording - IMPORTANT: Sets flag to prevent transcription
  const cancelRecording = useCallback(() => {
    console.log("[VoiceRecorder] Cancel recording called");
    
    // Prevent transcription from running on stop
    shouldTranscribeRef.current = false;
    
    isRecordingRef.current = false;
    setIsRecording(false);
    setInterimTranscript("");
    setFinalTranscript("");
    finalTranscriptRef.current = "";
    
    if (useMediaRecorderFallback) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    } else if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    console.log("[VoiceRecorder] Recording cancelled");
  }, [useMediaRecorderFallback]);

  return {
    isRecording,
    isTranscribing,
    interimTranscript,
    finalTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
    isIOSDevice,
  };
}
