import { User } from "./UserManger.js";

let GLOBAL_ROOM_ID = 1;

interface Room {
    user1: User;
    user2: User;
}

export class RoomManager {
    private rooms: Map<string, Room>;
    private userRooms: Map<string, string>;

    constructor() {
        this.rooms = new Map<string, Room>();
        this.userRooms = new Map<string, string>();
    }

    createRoom(user1: User, user2: User) {
        const roomId = this.generate().toString();
        console.log("Room ID:", roomId);
        this.rooms.set(roomId.toString(), {
            user1,
            user2,
        });

        this.userRooms.set(user1.socket.id, roomId);
        this.userRooms.set(user2.socket.id, roomId);

        user1.socket.emit("send-offer", {
            roomId,
        });

        user2.socket.emit("send-offer", {
            roomId,
        });
    }

    leaveRoom(socketId: string) {
        const roomId = this.userRooms.get(socketId);
        if (!roomId) return;

        const room = this.rooms.get(roomId);
        if (!room) return;

        const otherUser = room.user1.socket.id === socketId ? room.user2 : room.user1;
        otherUser.socket.emit("peer-left");

        this.rooms.delete(roomId);
        this.userRooms.delete(room.user1.socket.id);
        this.userRooms.delete(room.user2.socket.id);
    }

    onOffer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);

        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

        receivingUser?.socket.emit("offer", {
            sdp,
            roomId,
        });
    }

    onAnswer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);

        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

        receivingUser?.socket.emit("answer", {
            sdp,
            roomId,
        });
    }

    onIceCandidates(roomId: string, senderSocketId: string, candidate: any, type: "sender" | "receiver") {
        const room = this.rooms.get(roomId);

        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

        receivingUser.socket.emit("add-ice-candidate", { candidate, type });
    }

    onUserInfo(roomId: string, username: string, interests: string[], location: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);

        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;

        receivingUser?.socket.emit("user-info", {
            username,
            interests,
            location,
        });
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }
}
