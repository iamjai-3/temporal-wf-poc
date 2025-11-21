import { Connection, Client } from "@temporalio/client";
import { getTemporalConfig } from "./config/temporal";

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (client) {
    return client;
  }

  const config = getTemporalConfig();
  const connectionOptions: any = {
    address: config.address,
    namespace: config.namespace,
  };

  // If API key is provided, use it for Temporal Cloud
  if (config.apiKey) {
    connectionOptions.tls = {
      // Temporal Cloud requires TLS
    };
    connectionOptions.apiKey = config.apiKey;
  }

  const connection = await Connection.connect(connectionOptions);
  client = new Client({ connection, namespace: config.namespace });

  return client;
}

