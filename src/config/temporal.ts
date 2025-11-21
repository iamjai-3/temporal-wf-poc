import * as dotenv from "dotenv";
import { TEMPORAL_CONFIG } from "./constants";

dotenv.config();

export interface TemporalConfig {
  address: string;
  namespace: string;
  apiKey?: string;
  taskQueue: string;
}

export function getTemporalConfig(): TemporalConfig {
  return {
    address: process.env.TEMPORAL_ADDRESS ?? TEMPORAL_CONFIG.DEFAULT_ADDRESS,
    namespace: process.env.TEMPORAL_NAMESPACE ?? TEMPORAL_CONFIG.DEFAULT_NAMESPACE,
    apiKey: process.env.TEMPORAL_API_KEY,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? TEMPORAL_CONFIG.DEFAULT_TASK_QUEUE,
  };
}

