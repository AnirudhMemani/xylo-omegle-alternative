"use client";

import { SERVER_URL } from "@/lib/env";
import { io, Socket } from "socket.io-client";

export const socket: Socket = io(SERVER_URL);
