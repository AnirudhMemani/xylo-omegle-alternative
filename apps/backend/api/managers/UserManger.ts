import { Socket } from "socket.io";
import { AddIceCandidate, Answer, Offer, UserInfo } from "../types/MessageTypes.js";
import { RoomManager } from "./RoomManager.js";

export interface User {
    socket: Socket;
    name: string;
    interests?: string[];
    location?: string;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(socket: Socket) {
        this.users.push({
            name: "anonymous",
            socket,
        });
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        this.users = this.users.filter((x) => x.socket.id !== socketId);
        this.queue = this.queue.filter((x) => x !== socketId);
    }

    clearQueue() {
        if (this.queue.length < 2) {
            return;
        }

        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        const user1 = this.users.find((x) => x.socket.id === id1);
        const user2 = this.users.find((x) => x.socket.id === id2);

        if (!user1 || !user2) {
            return;
        }

        console.log("creating room");

        this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("join-room", ({ username, interests, location }) => {
            console.log(`User ${username} joining room with interests: ${interests}`);

            const userIndex = this.users.findIndex((u) => u.socket.id === socket.id);
            if (userIndex !== -1) {
                this.users[userIndex].name = username;
                this.users[userIndex].interests = interests;
                this.users[userIndex].location = location;
            }

            if (!this.queue.includes(socket.id)) {
                this.queue.push(socket.id);
            }

            socket.emit("lobby");
            this.clearQueue();
        });

        socket.on("offer", ({ sdp, roomId }: Offer) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }: Answer) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({ candidate, roomId, type }: AddIceCandidate) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });

        socket.on("user-info", ({ roomId, username, interests, location }: UserInfo) => {
            this.roomManager.onUserInfo(roomId, username, interests, location, socket.id);
        });

        socket.on("chat-message", ({ message }) => {
            const roomId = this.roomManager.getUserRoom(socket.id);
            if (roomId) {
                this.roomManager.relayMessage(roomId, message, socket.id);
            }
        });

        socket.on("skip-user", () => {
            this.roomManager.leaveRoom(socket.id);

            if (!this.queue.includes(socket.id)) {
                this.queue.push(socket.id);
                socket.emit("lobby");
                this.clearQueue();
            }
        });

        socket.on("stop-searching", () => {
            this.roomManager.leaveRoom(socket.id);

            this.queue = this.queue.filter((id) => id !== socket.id);

            socket.emit("search-stopped");
        });
    }
}
