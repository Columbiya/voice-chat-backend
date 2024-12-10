import express from "express";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types";
import { pool, rooms } from "./db";
import { v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import { rootRouter } from "./routers";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(rootRouter);

const server = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
  },
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.currentRoomId ?? "");

    if (!room) return;

    if (room.size === 1) {
      rooms.delete(socket.data.currentRoomId ?? "");
      pool.query(`delete from rooms where id = '${socket.data.currentRoomId}'`);
    } else {
      room.delete(socket);
    }

    pool.query(`delete from users where id = '${socket.data.userId}'`);
  });

  socket.on("auth", async (username) => {
    const userId = uuidv4();

    socket.data.userId = userId;
    socket.data.username = username;
    socket.data.currentRoomId = undefined;

    try {
      await pool.query(
        `insert into users (id, name) values ('${userId}', '${username}')`
      );
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("joinRoom", async (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      socket.data.currentRoomId = roomId;

      room?.forEach((s) =>
        s.emit("personJoinedRoom", socket.data.userId, socket.data.username)
      );
      room?.add(socket);
    } else {
      rooms.set(roomId, new Set([socket]));
    }

    pool.query(
      `update users set in_room = '${roomId}' where id = '${socket.data.userId}'`
    );
  });

  socket.on("sendOffer", (roomId, userId, sdp, type) => {
    const room = rooms.get(roomId);

    if (!room) return;

    for (const s of room) {
      if (s.data.userId === userId) {
        s.emit(
          "personSendingRtcOffer",
          s.data.currentRoomId ?? "",
          socket.data.userId,
          sdp,
          type
        );
        return;
      }
    }
  });

  socket.on("sendIceCandidates", (roomId, iceCandidate) => {
    const room = rooms.get(roomId);

    if (!room) return;

    for (const s of room) {
      s.emit("personSendingIceCandidates", socket.data.userId, iceCandidate);
    }
  });

  socket.on("sendAnswer", (roomId, userId, sdp, type) => {
    const room = rooms.get(roomId);

    if (!room) return;

    for (const socket of room) {
      if (socket.data.userId === userId) {
        socket.emit(
          "personSendingRtcAnswer",
          socket.data.currentRoomId ?? "",
          socket.data.userId,
          sdp,
          type
        );
        return;
      }
    }
  });

  socket.on("leaveRoom", async () => {
    const room = rooms.get(socket.data.currentRoomId ?? "");

    if (!room) return;

    room?.forEach((s) => s.emit("personLeftRoom", socket.data.userId));

    if (room.size === 1) {
      rooms.delete(socket.data.currentRoomId ?? "");
      pool.query(`delete from rooms where id = '${socket.data.currentRoomId}'`);
    } else {
      room.delete(socket);
    }

    pool.query(
      `update users set in_room = null where id = '${socket.data.userId}'`
    );

    socket.data.currentRoomId = undefined;
  });

  socket.on("muted", () => {
    const currentRoom = rooms.get(socket.data.currentRoomId ?? "");

    currentRoom?.forEach((socketConn) => {
      if (currentRoom.has(socketConn) && socketConn !== socket) {
        socketConn.emit("personMutedTheirMic", socket.data.userId);
      }
    });
  });

  socket.on("unmuted", () => {
    const currentRoom = rooms.get(socket.data.currentRoomId ?? "");

    currentRoom?.forEach((socketConn) => {
      if (currentRoom.has(socketConn) && socketConn !== socket) {
        socketConn.emit("personUnmutedTheirMic", socket.data.userId);
      }
    });
  });
});
