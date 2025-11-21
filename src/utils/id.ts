import { REQUEST_ID_PREFIX, WORKFLOW_ID_PREFIX } from "../config/constants";

export function generateRequestId(): string {
  return `${REQUEST_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function generateWorkflowId(userId: string): string {
  return `${WORKFLOW_ID_PREFIX}-${userId}-${Date.now()}`;
}

