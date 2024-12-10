import type { Socket } from "./types";
import { Pool } from "pg";

type RoomId = string;
type SocketConn = Socket;

export const rooms = new Map<RoomId, Set<SocketConn>>();

export const pool = new Pool({
  user: "postgres",
  password: "",
  host: "localhost",
  port: 5432,
  database: "voice_chat",
});
