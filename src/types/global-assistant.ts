export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: 
    | "text" 
    | "proposal" 
    | "verification" 
    | "next_actions" 
    | "result" 
    | "loading" 
    | "list" 
    | "time_form"
    | "estimate_form"
    | "daily_report_form"
    | "customer_search"
    | "customer_form"
    | "project_form"
    | "qr_code"
    | "file_list"
    | "economy_overview";
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
    | "time_entry"
    | "work_order"
    | "ata";
  
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
  listType?: "project" | "customer" | "estimate" | "invoice" | "inspection" | "work_order" | "ata";
  
  // For time_form
  projects?: Array<{ id: string; name: string }>;
  defaultDate?: string;
  
  // For estimate_form and project_form
  customers?: Array<{ id: string; name: string }>;
  
  // For customer_search
  allCustomers?: Array<{ 
    id: string; 
    name: string; 
    city?: string; 
    email?: string;
  }>;
  
  // For qr_code
  token?: string;
  url?: string;
  project_id?: string;
  
  // For file_list
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size?: number;
    category?: string;
    date: string;
  }>;
  
  // For economy_overview
  project_name?: string;
  budget?: number;
  estimate_total?: number;
  estimate_labor?: number;
  estimate_material?: number;
  total_hours?: number;
  ata_approved?: number;
  ata_pending?: number;
  ata_count?: number;
  invoiced_amount?: number;
  paid_amount?: number;
  invoice_count?: number;
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
  selectedWorkOrderId?: string;
  selectedAtaId?: string;
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
