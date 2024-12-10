import { Room, User } from "./models";
import { SocketData } from "./types";

export type RoomCreateDTO = Omit<Room, "id">;
export type UserJoinRoomDTO = Omit<User, "in_room" | "id">;
export type UserLeaveRoomDTO = Pick<User, "id">;

export type RoomQueryDTO = Room & { username: string; user_id: string };

export type RoomDetailsResponseDTO = Room & {
  users: Pick<SocketData, "userId" | "username">[];
};
