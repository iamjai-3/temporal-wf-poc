export const DEFAULT_LEAVE_BALANCE = 10;
export const APPROVAL_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const WORKFLOW_ID_PREFIX = "leave";
export const REQUEST_ID_PREFIX = "req";

export const TEMPORAL_CONFIG = {
  DEFAULT_ADDRESS: "localhost:7233",
  DEFAULT_NAMESPACE: "default",
  DEFAULT_TASK_QUEUE: "LEAVE_TASK_QUEUE",
} as const;

export const API_CONFIG = {
  DEFAULT_PORT: 3000,
} as const;

