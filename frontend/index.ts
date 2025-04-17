import { Socket, io } from "socket.io-client";

import handlers from "./event-handlers";
import gameHandlers from "./games";
import messageHandlers from "./messages";

// Provides us with type information on the io object
declare global {
  interface Window {
    socket: Socket;
  }
}

window.socket = io();
console.log("inside socket.............");

handlers.forEach((handler) => handler());
gameHandlers.forEach((handler) => handler(window.socket));
messageHandlers.forEach((handler) => handler(window.socket));
