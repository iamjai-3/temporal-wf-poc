import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { getTemporalConfig } from "./config/temporal";

(async () => {
  try {
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

    const connection = await NativeConnection.connect(connectionOptions);

    const worker = await Worker.create({
      connection,
      namespace: config.namespace,
      taskQueue: config.taskQueue,
      workflowsPath: require.resolve("./workflows/leave-application"),
      activities,
    });

    console.log(`🚀 Worker started on task queue: ${config.taskQueue}`);
    console.log(`📍 Connected to: ${config.address} (namespace: ${config.namespace})`);

    await worker.run();
    console.log("Worker stopped");
  } catch (err) {
    console.error("Worker failed:", err);
    process.exit(1);
  }
})();
