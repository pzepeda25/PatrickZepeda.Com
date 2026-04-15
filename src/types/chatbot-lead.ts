/** Payload sent from the browser (server adds id, createdAt, source, messageSummary, status). */
export interface ChatbotLeadPayload {
  pageUrl: string;
  name: string;
  email: string;
  businessType: string;
  projectType: string;
  goal: string;
  websiteStatus: string;
  timeline: string;
  budget: string;
  message: string;
}

export interface ChatbotLeadSuccessResponse {
  ok: true;
  id: string;
  blobKey: string;
  provider: string;
}

export interface ChatbotLeadErrorResponse {
  ok: false;
  error: string;
  details?: string[];
}
