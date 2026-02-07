export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "proposal" | "verification" | "next_actions" | "result" | "loading" | "list";
  data?: MessageData;
}

export interface MessageData {
  // For proposal
  action?: string;
  details?: string[];
  warnings?: string[];
  
  // For verification
  matches?: VerificationMatch[];
  entityType?: 
    | "customer" 
    | "project" 
    | "estimate"
    | "invoice"
    | "inspection"
    | "daily_report"
    | "time_entry";
  
  // For next_actions
  actions?: NextAction[];
  
  // For result
  success?: boolean;
  resultMessage?: string;
  link?: {
    label: string;
    href: string;
  };
  nextActions?: NextAction[];
  
  // For list
  listItems?: ListItem[];
  listType?: "project" | "customer" | "estimate" | "invoice" | "inspection";
}

export interface VerificationMatch {
  id: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, string>;
}

export interface NextAction {
  label: string;
  icon: string;
  prompt: string;
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: "green" | "yellow" | "blue" | "gray";
  details?: { label: string; value: string }[];
  link?: string;
}

export interface ConversationContext {
  selectedCustomerId?: string;
  selectedProjectId?: string;
  selectedEstimateId?: string;
  selectedInvoiceId?: string;
  selectedInspectionId?: string;
  selectedTimeEntryId?: string;
  pendingAction?: string;
  pendingData?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  context: ConversationContext;
  created_at: string;
  updated_at: string;
}
