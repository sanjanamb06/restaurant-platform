import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

/**
 * Initialise Socket.IO on the provided HTTP server.
 * Call this once from server.ts immediately after app.listen().
 */
export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", ({ restaurantId }: { restaurantId: string }) => {
      if (restaurantId) {
        void socket.join(`restaurant:${restaurantId}`);
      }
    });
  });

  return io;
}

/**
 * Returns the shared Socket.IO server instance.
 * Throws if initSocket() has not been called yet.
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialised — call initSocket() first");
  }
  return io;
}
