import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message, VerificationMatch, NextAction } from "@/types/global-assistant";
import { ProposalCard } from "./ProposalCard";
import { VerificationCard } from "./VerificationCard";
import { NextActionsCard } from "./NextActionsCard";
import { ResultCard } from "./ResultCard";
import { ListCard } from "./ListCard";
import { TimeFormCard } from "./TimeFormCard";
import { cn } from "@/lib/utils";

interface TimeFormData {
  projectId: string;
  hours: number;
  date: string;
  description: string;
}

interface MessageListProps {
  messages: Message[];
  onProposalConfirm: (messageId: string) => void;
  onProposalCancel: (messageId: string) => void;
  onProposalModify: (messageId: string) => void;
  onVerificationSelect: (messageId: string, match: VerificationMatch) => void;
  onVerificationSearchOther: (messageId: string) => void;
  onVerificationCreateNew: (messageId: string) => void;
  onNextAction: (action: NextAction) => void;
  onTimeFormSubmit?: (data: TimeFormData) => void;
  onTimeFormCancel?: () => void;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  onProposalConfirm,
  onProposalCancel,
  onProposalModify,
  onVerificationSelect,
  onVerificationSearchOther,
  onVerificationCreateNew,
  onNextAction,
  onTimeFormSubmit,
  onTimeFormCancel,
  isLoading,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            )}
          >
            {message.role === "user" ? (
              // User message bubble
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : (
              // Assistant message
              <div className="w-full max-w-[95%] space-y-3">
                {/* Loading state */}
                {message.type === "loading" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Tänker...</span>
                  </div>
                )}

                {/* Text message */}
                {message.type === "text" && message.content && (
                  <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}

                {/* Proposal card */}
                {message.type === "proposal" && message.data && (
                  <ProposalCard
                    data={message.data}
                    onConfirm={() => onProposalConfirm(message.id)}
                    onCancel={() => onProposalCancel(message.id)}
                    onModify={() => onProposalModify(message.id)}
                    disabled={isLoading}
                  />
                )}

                {/* Verification card */}
                {message.type === "verification" && message.data && (
                  <VerificationCard
                    content={message.content}
                    data={message.data}
                    onSelect={(match) => onVerificationSelect(message.id, match)}
                    onSearchOther={() => onVerificationSearchOther(message.id)}
                    onCreateNew={() => onVerificationCreateNew(message.id)}
                    disabled={isLoading}
                  />
                )}

                {/* Result card */}
                {message.type === "result" && message.data && (
                  <ResultCard data={message.data} onNextAction={onNextAction} />
                )}

                {/* List card */}
                {message.type === "list" && message.data && (
                  <ListCard content={message.content} data={message.data} />
                )}

                {/* Next actions */}
                {message.type === "next_actions" && message.data?.actions && (
                  <NextActionsCard
                    actions={message.data.actions}
                    onSelect={onNextAction}
                  />
                )}

                {/* Time form */}
                {message.type === "time_form" && message.data?.projects && onTimeFormSubmit && onTimeFormCancel && (
                  <TimeFormCard
                    projects={message.data.projects}
                    defaultDate={message.data.defaultDate}
                    onSubmit={onTimeFormSubmit}
                    onCancel={onTimeFormCancel}
                    disabled={isLoading}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
