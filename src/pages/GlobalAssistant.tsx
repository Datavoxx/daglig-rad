import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, History, ArrowLeft, RefreshCw } from "lucide-react";
import { useConversationFeedback } from "@/contexts/ConversationFeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/global-assistant/ChatInput";
import { MessageList } from "@/components/global-assistant/MessageList";
import { QuickSuggestions } from "@/components/global-assistant/QuickSuggestions";
import { ChatHistorySidebar } from "@/components/global-assistant/ChatHistorySidebar";
import type { Message, VerificationMatch, NextAction, ConversationContext, Conversation } from "@/types/global-assistant";
import type { Json } from "@/integrations/supabase/types";


export default function GlobalAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLastConversation } = useConversationFeedback();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [context, setContext] = useState<ConversationContext>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initialMessageProcessed = useRef(false);
  
  // Use refs to track current values for cleanup
  const conversationIdRef = useRef<string | null>(null);
  const messagesLengthRef = useRef<number>(0);
  
  // Keep refs in sync
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
    messagesLengthRef.current = messages.length;
  }, [currentConversationId, messages.length]);
  
  // Trigger feedback popup when leaving the page
  useEffect(() => {
    return () => {
      // Only trigger if there was a real conversation (more than 1 message = user + assistant)
      if (conversationIdRef.current && messagesLengthRef.current > 1) {
        setLastConversation(conversationIdRef.current);
      }
    };
  }, [setLastConversation]);

  const handleNewChat = () => {
    setMessages([]);
    setContext({});
    setCurrentConversationId(null);
  };

  const handleLoadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setContext(conversation.context);
    setCurrentConversationId(conversation.id);
    setHistoryOpen(false);
  };

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUserId(userData.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userData.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        } else {
          setUserName(userData.user.email?.split("@")[0] || "");
        }
      }
    };
    fetchUser();
  }, []);

  // Handle initial message from dashboard navigation
  useEffect(() => {
    const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;
    if (initialMessage && messages.length === 0 && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true;
      // Clear navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
      sendMessage(initialMessage);
    }
  }, [location.state, messages.length]);

  // Load conversation from URL parameter (e.g., from feedback popup link)
  useEffect(() => {
    const loadConversationFromUrl = async () => {
      const urlParams = new URLSearchParams(location.search);
      const conversationIdFromUrl = urlParams.get("conversationId");
      
      if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
        const { data } = await supabase
          .from("assistant_conversations")
          .select("*")
          .eq("id", conversationIdFromUrl)
          .single();
        
        if (data) {
          setMessages(data.messages as unknown as Message[]);
          setContext((data.context as ConversationContext) || {});
          setCurrentConversationId(data.id);
        }
      }
    };
    
    loadConversationFromUrl();
  }, [location.search]);

  // Save conversation to database
  const saveConversation = useCallback(async (
    newMessages: Message[],
    newContext: ConversationContext,
    conversationId: string | null
  ) => {
    if (!userId || newMessages.length === 0) return conversationId;

    // Filter out loading messages for storage
    const messagesToSave = newMessages.filter((m) => m.type !== "loading");
    if (messagesToSave.length === 0) return conversationId;

    // Generate title from first user message
    const firstUserMessage = messagesToSave.find((m) => m.role === "user");
    const title = firstUserMessage?.content.slice(0, 50) || "Ny konversation";

    if (conversationId) {
      // Update existing conversation
      await supabase
        .from("assistant_conversations")
        .update({
          messages: messagesToSave as unknown as Json,
          context: newContext as unknown as Json,
          title,
        })
        .eq("id", conversationId);
      return conversationId;
    } else {
      // Create new conversation
      const { data } = await supabase
        .from("assistant_conversations")
        .insert({
          user_id: userId,
          messages: messagesToSave as unknown as Json,
          context: newContext as unknown as Json,
          title,
        })
        .select("id")
        .single();
      return data?.id || null;
    }
  }, [userId]);

  const sendMessage = async (content: string, contextOverride?: Partial<ConversationContext>) => {
    const effectiveContext = contextOverride 
      ? { ...context, ...contextOverride } 
      : context;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      type: "text",
    };
    
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      type: "loading",
    };

    const newMessagesWithLoading = [...messages, userMessage, loadingMessage];
    setMessages(newMessagesWithLoading);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("global-assistant", {
        body: {
          message: content,
          history: messages.filter((m) => m.type !== "loading"),
          context: effectiveContext,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content || "",
        type: data.type || "text",
        data: data.data,
      };

      const finalMessages = [...messages, userMessage, assistantMessage];
      setMessages(finalMessages);

      // Update context if provided
      const finalContext = data.context 
        ? { ...effectiveContext, ...data.context }
        : effectiveContext;
      
      if (data.context) {
        setContext(finalContext);
      }

      // Save to database
      const newConversationId = await saveConversation(finalMessages, finalContext, currentConversationId);
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId);
      }
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMessage.id);
        return [
          ...withoutLoading,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Något gick fel. Försök igen.",
            type: "text",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposalConfirm = async () => {
    await sendMessage("Ja, kör på!");
  };

  const handleProposalCancel = async () => {
    await sendMessage("Avbryt");
  };

  const handleProposalModify = async () => {
    // User can type what they want to change
  };

  const handleVerificationSelect = async (messageId: string, match: VerificationMatch) => {
    const message = messages.find((m) => m.id === messageId);
    let newContext: Partial<ConversationContext> = {};
    
    if (message?.data?.entityType === "customer") {
      newContext = { selectedCustomerId: match.id };
    } else if (message?.data?.entityType === "project") {
      newContext = { selectedProjectId: match.id };
    } else if (message?.data?.entityType === "estimate") {
      newContext = { selectedEstimateId: match.id };
    } else if (message?.data?.entityType === "invoice") {
      newContext = { selectedInvoiceId: match.id };
    } else if (message?.data?.entityType === "inspection") {
      newContext = { selectedInspectionId: match.id };
    }
    
    setContext((prev) => ({ ...prev, ...newContext }));
    await sendMessage(`Visa information om ${match.title}`, newContext);
  };

  const handleVerificationSearchOther = async () => {
    await sendMessage("Sök efter en annan");
  };

  const handleVerificationCreateNew = async () => {
    await sendMessage("Skapa en ny istället");
  };

  const handleNextAction = async (action: NextAction) => {
    await sendMessage(action.prompt);
  };

  const handleTimeFormSubmit = async (formData: {
    projectId: string;
    hours: number;
    date: string;
    description: string;
  }) => {
    const descPart = formData.description 
      ? `. Beskrivning: ${formData.description}` 
      : "";
    await sendMessage(
      `Registrera ${formData.hours} timmar på projektet med ID ${formData.projectId} för ${formData.date}${descPart}`,
      { selectedProjectId: formData.projectId }
    );
  };

  const handleTimeFormCancel = async () => {
    await sendMessage("Avbryt tidsregistrering");
  };

  const handleEstimateFormSubmit = async (formData: {
    customerId: string;
    title: string;
    address: string;
  }) => {
    const addrPart = formData.address ? ` på adress ${formData.address}` : "";
    await sendMessage(
      `Skapa offert "${formData.title}"${addrPart} för kund med ID ${formData.customerId}`,
      { selectedCustomerId: formData.customerId }
    );
  };

  const handleEstimateFormCancel = async () => {
    await sendMessage("Avbryt offertskapande");
  };

  const handleDailyReportFormSubmit = async (formData: {
    projectId: string;
    headcount: number;
    hoursPerPerson: number;
    roles: string[];
    totalHours: number;
    workItems: string[];
    deviations: Array<{ type: string; description: string; hours: number | null }>;
    ata: Array<{ reason: string; consequence: string; estimatedHours: number | null }>;
    materialsDelivered: string;
    materialsMissing: string;
    notes: string;
  }) => {
    // Build structured message for AI
    const workSummary = formData.workItems.join(", ");
    let msg = `Skapa dagrapport för projekt med ID ${formData.projectId}. Arbete: ${workSummary}. Personal: ${formData.headcount}. Timmar: ${formData.totalHours}`;

    if (formData.roles.length > 0) {
      msg += `. Roller: ${formData.roles.join(", ")}`;
    }
    if (formData.deviations.length > 0) {
      msg += `. Avvikelser: ${formData.deviations.length} st`;
    }
    if (formData.ata.length > 0) {
      msg += `. ÄTA: ${formData.ata.length} st`;
    }
    if (formData.notes) {
      msg += `. Anteckningar: ${formData.notes}`;
    }

    await sendMessage(msg, {
      selectedProjectId: formData.projectId,
      pendingData: formData as unknown as Record<string, unknown>,
    });
  };

  const handleDailyReportFormCancel = async () => {
    await sendMessage("Avbryt dagrapport");
  };

  const handleCustomerSearchSelect = async (customer: { id: string; name: string }) => {
    await sendMessage(
      `Visa information om ${customer.name}`,
      { selectedCustomerId: customer.id }
    );
  };

  const handleCustomerSearchCreateNew = async () => {
    await sendMessage("Skapa en ny kund");
  };

  const handleCustomerFormSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  }) => {
    const parts = [`Skapa kund "${formData.name}"`];
    if (formData.email) parts.push(`email: ${formData.email}`);
    if (formData.phone) parts.push(`telefon: ${formData.phone}`);
    if (formData.address) parts.push(`adress: ${formData.address}`);
    if (formData.city) parts.push(`stad: ${formData.city}`);
    await sendMessage(parts.join(", "));
  };

  const handleCustomerFormCancel = async () => {
    await sendMessage("Avbryt kundskapande");
  };

  const handleProjectFormSubmit = async (formData: { estimateId: string }) => {
    await sendMessage(
      `Skapa projekt från offert med ID ${formData.estimateId}`,
      { selectedEstimateId: formData.estimateId }
    );
  };

  const handleProjectFormCancel = async () => {
    await sendMessage("Avbryt projektskapande");
  };

  const handleCheckInFormSubmit = async (projectId: string) => {
    await sendMessage(
      `Checka in på projekt med ID ${projectId}`,
      { selectedProjectId: projectId }
    );
  };

  const handleCheckInFormCancel = async () => {
    await sendMessage("Avbryt incheckning");
  };

  const handleWorkOrderFormSubmit = async (formData: {
    projectId: string;
    title: string;
    description: string;
    assignedTo?: string;
    dueDate?: string;
  }) => {
    let msg = `Skapa arbetsorder "${formData.title}" på projekt med ID ${formData.projectId}`;
    if (formData.description) msg += `. Beskrivning: ${formData.description}`;
    if (formData.assignedTo) msg += `. Tilldela till: ${formData.assignedTo}`;
    if (formData.dueDate) msg += `. Förfallodatum: ${formData.dueDate}`;
    
    await sendMessage(msg, { selectedProjectId: formData.projectId });
  };

  const handleWorkOrderFormCancel = async () => {
    await sendMessage("Avbryt arbetsorderskapande");
  };

  const handlePlanningFormSubmit = async (formData: {
    projectId: string;
    startDate: string;
    phases: Array<{ name: string; weeks: number }>;
  }) => {
    const phasesSummary = formData.phases.map((p) => `${p.name} (${p.weeks} veckor)`).join(", ");
    await sendMessage(
      `Skapa planering för projekt med ID ${formData.projectId}. Startdatum: ${formData.startDate}. Faser: ${phasesSummary}`,
      { selectedProjectId: formData.projectId }
    );
  };

  const handlePlanningFormCancel = async () => {
    await sendMessage("Avbryt planeringsskapande");
  };

  const handleUpdateProjectAction = async (projectId: string, category: string) => {
    if (category === "ata") {
      // Show ATA form card
      const project = (messages.find(m => m.type === "update_project_form")?.data?.projects as Array<{id: string; name: string}> || []).find(p => p.id === projectId);
      const ataFormMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        type: "ata_form",
        data: { preselectedProjectId: projectId, project_name: project?.name },
      };
      setMessages(prev => [...prev, ataFormMessage]);
      return;
    }
    if (category === "files") {
      const project = (messages.find(m => m.type === "update_project_form")?.data?.projects as Array<{id: string; name: string}> || []).find(p => p.id === projectId);
      const fileFormMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        type: "file_upload_form",
        data: { preselectedProjectId: projectId, project_name: project?.name },
      };
      setMessages(prev => [...prev, fileFormMessage]);
      return;
    }
    if (category === "planning") {
      const projects = (messages.find(m => m.type === "update_project_form")?.data?.projects as Array<{id: string; name: string; address?: string}>) || [];
      const planningFormMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        type: "planning_form",
        data: { projects, preselectedProjectId: projectId },
      };
      setMessages(prev => [...prev, planningFormMessage]);
      return;
    }
    const prompts: Record<string, string> = {
      work_order: `Skapa arbetsorder på projekt med ID ${projectId}`,
      diary: `Skapa dagrapport för projekt med ID ${projectId}`,
    };
    await sendMessage(prompts[category] || `Uppdatera projekt med ID ${projectId}`, { selectedProjectId: projectId });
  };

  const handleUpdateProjectCancel = async () => {
    await sendMessage("Avbryt projektuppdatering");
  };

  const handleAtaFormSubmit = async (formData: {
    projectId: string;
    description: string;
    reason: string;
    estimatedCost: number | null;
    estimatedHours: number | null;
  }) => {
    let msg = `Skapa ÄTA på projekt med ID ${formData.projectId}. Beskrivning: ${formData.description}`;
    if (formData.reason) msg += `. Orsak: ${formData.reason}`;
    if (formData.estimatedCost) msg += `. Uppskattad kostnad: ${formData.estimatedCost} kr`;
    if (formData.estimatedHours) msg += `. Uppskattade timmar: ${formData.estimatedHours}`;
    await sendMessage(msg, { selectedProjectId: formData.projectId });
  };

  const handleAtaFormCancel = async () => {
    await sendMessage("Avbryt ÄTA-skapande");
  };

  const handleFileUploadSubmit = async (data: { projectId: string; fileName: string; storagePath: string }) => {
    await sendMessage(`Fil "${data.fileName}" har laddats upp till projektet`, { selectedProjectId: data.projectId });
  };

  const handleFileUploadCancel = async () => {
    await sendMessage("Avbryt filuppladdning");
  };

  const handleBudgetOverview = async () => {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, address")
      .order("created_at", { ascending: false });

    if (!projects || projects.length === 0) {
      await sendMessage("Visa budget översikt för ett projekt");
      return;
    }

    const budgetFormMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      type: "budget_form",
      data: { projects },
    };
    setMessages((prev) => [...prev, budgetFormMessage]);
  };

  const handleBudgetFormSubmit = async (projectId: string, projectName: string) => {
    await sendMessage(`Visa budget översikt för ${projectName}`, { selectedProjectId: projectId });
  };

  const handleBudgetFormCancel = async () => {
    await sendMessage("Avbryt budget översikt");
  };

  const handleEstimateItemsFormSubmit = async (formData: {
    estimateId: string;
    introduction: string;
    timeline: string;
    items: Array<{
      article: string;
      description: string;
      quantity: number | null;
      unit: string;
      unit_price: number;
    }>;
    addons: Array<{
      name: string;
      price: number;
    }>;
  }) => {
    const itemsCount = formData.items.length;
    const addonsCount = formData.addons.length;
    
    // Build message with detailed row summary (fallback for AI if pendingData is missed)
    let msg = `Lägg till ${itemsCount} offertposter på offert med ID ${formData.estimateId}`;
    if (formData.introduction) {
      msg += `. Projektbeskrivning: "${formData.introduction}"`;
    }
    if (formData.timeline) {
      msg += `. Tidsplan: "${formData.timeline}"`;
    }
    
    // Include short summary of each row for visibility in chat and AI fallback
    if (formData.items.length > 0) {
      const rowSummaries = formData.items.map((item, i) => {
        const qty = item.quantity ?? 1;
        return `Rad ${i + 1}: ${item.article}, ${item.unit}, ${qty} x ${item.unit_price} kr, "${item.description || "-"}"`;
      });
      msg += `. Rader: ${rowSummaries.join("; ")}`;
    }
    
    if (addonsCount > 0) {
      const addonSummaries = formData.addons.map(a => `${a.name}: ${a.price} kr`);
      msg += `. Tillval: ${addonSummaries.join(", ")}`;
    }
    
    // Pass structured data for the backend to process directly
    await sendMessage(msg, { 
      selectedEstimateId: formData.estimateId,
      pendingData: formData as unknown as Record<string, unknown>,
    });
  };

  const handleEstimateItemsFormCancel = async () => {
    await sendMessage("Avbryt tillägg av offertposter");
  };

  const handleEstimateItemsFormOpen = (estimateId: string) => {
    navigate(`/estimates?estimateId=${estimateId}`);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col">
      {/* History Sidebar */}
      <ChatHistorySidebar
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectConversation={handleLoadConversation}
        currentConversationId={currentConversationId}
      />

      {/* Header - always visible */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {hasMessages && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
              title="Tillbaka"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            className="h-8 w-8"
            title="Visa historik"
          >
            <History className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Byggio AI</span>
        </div>
        {hasMessages && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="h-8 w-8"
              title="Uppdatera"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="h-8 w-8"
              title="Ny chatt"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Empty state - centered welcome */}
      {!hasMessages && (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            Vad kan jag hjälpa dig med{userName ? `, ${userName}` : ""}?
          </h1>
          <p className="mb-8 text-center text-muted-foreground max-w-md">
            Jag kan hjälpa dig skapa offerter, hitta projekt, söka kunder och mycket mer.
          </p>
          <div className="w-full max-w-2xl space-y-4">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
            <QuickSuggestions onSelect={sendMessage} onBudgetOverview={handleBudgetOverview} />
          </div>
        </div>
      )}

      {/* Conversation view */}
      {hasMessages && (
        <>
          <MessageList
            messages={messages}
            conversationId={currentConversationId}
            onProposalConfirm={handleProposalConfirm}
            onProposalCancel={handleProposalCancel}
            onProposalModify={handleProposalModify}
            onVerificationSelect={handleVerificationSelect}
            onVerificationSearchOther={handleVerificationSearchOther}
            onVerificationCreateNew={handleVerificationCreateNew}
            onNextAction={handleNextAction}
            onTimeFormSubmit={handleTimeFormSubmit}
            onTimeFormCancel={handleTimeFormCancel}
            onEstimateFormSubmit={handleEstimateFormSubmit}
            onEstimateFormCancel={handleEstimateFormCancel}
            onDailyReportFormSubmit={handleDailyReportFormSubmit}
            onDailyReportFormCancel={handleDailyReportFormCancel}
            onCustomerSearchSelect={handleCustomerSearchSelect}
            onCustomerSearchCreateNew={handleCustomerSearchCreateNew}
            onCustomerFormSubmit={handleCustomerFormSubmit}
            onCustomerFormCancel={handleCustomerFormCancel}
            onProjectFormSubmit={handleProjectFormSubmit}
            onProjectFormCancel={handleProjectFormCancel}
            onCheckInFormSubmit={handleCheckInFormSubmit}
            onCheckInFormCancel={handleCheckInFormCancel}
            onWorkOrderFormSubmit={handleWorkOrderFormSubmit}
            onWorkOrderFormCancel={handleWorkOrderFormCancel}
            onEstimateItemsFormSubmit={handleEstimateItemsFormSubmit}
            onEstimateItemsFormCancel={handleEstimateItemsFormCancel}
            onEstimateItemsFormOpen={handleEstimateItemsFormOpen}
            onPlanningFormSubmit={handlePlanningFormSubmit}
            onPlanningFormCancel={handlePlanningFormCancel}
            onUpdateProjectAction={handleUpdateProjectAction}
            onUpdateProjectCancel={handleUpdateProjectCancel}
            onAtaFormSubmit={handleAtaFormSubmit}
            onAtaFormCancel={handleAtaFormCancel}
            onFileUploadSubmit={handleFileUploadSubmit}
            onFileUploadCancel={handleFileUploadCancel}
            onBudgetFormSubmit={handleBudgetFormSubmit}
            onBudgetFormCancel={handleBudgetFormCancel}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
          <div className="border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={sendMessage}
                disabled={isLoading}
                placeholder="Skriv ett meddelande..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
