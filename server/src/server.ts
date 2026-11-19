import { createServer } from "node:http";
import app from "./app";
import { env, prisma } from "./config/env";
import { initSocket } from "./socket";

const httpServer = createServer(app);

// Attach Socket.IO to the same HTTP server as Express.
// Clients connect to ws://localhost:5000 — no separate port needed.
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
  console.log(`Socket.IO active on the same port`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
