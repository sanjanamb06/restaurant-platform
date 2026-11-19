import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/** Singleton Socket.IO client — NOT auto-connected.
 *  Call socket.connect() when the Orders page mounts,
 *  socket.disconnect() when it unmounts. */
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket;
