import { Router } from "express";
import { pool } from "../db";
import { Room } from "../models";
import {
  RoomCreateDTO,
  RoomDetailsResponseDTO,
  RoomQueryDTO,
  UserJoinRoomDTO,
  UserLeaveRoomDTO,
} from "../dtos";
import { v4 as uuidv4 } from "uuid";

export const roomsRouter = Router();

roomsRouter.get("/", async (_, res) => {
  const result = await pool.query<Room & { users_count: number }>(
    `select rooms.name, rooms.id, count(users.id) as users_count from rooms left join users on rooms.id = users.in_room group by rooms.id`
  );

  const rows = result.rows;

  res.send(rows);
});

roomsRouter.get("/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  const result = await pool.query<RoomQueryDTO>(
    `select users.name as username, users.id as user_id, rooms.name, rooms.id from rooms left join users on rooms.id = users.in_room where rooms.id = '${roomId}'`
  );
  const room = result.rows[0];

  if (!room) {
    res.status(400).send({ message: `Комнаты с id ${roomId} не найдено` });
    return;
  }

  const dto: RoomDetailsResponseDTO = {
    id: room.id,
    name: room.name,
    users: result.rows
      .filter((r) => r.user_id)
      .map((r) => ({
        userId: r.user_id,
        username: r.username,
      })),
  };

  res.send(dto);
});

roomsRouter.post("/", async (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  const { name } = req.body as RoomCreateDTO;

  if (!name) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  const id = uuidv4();

  await pool.query(`insert into rooms (id, name) values ('${id}', '${name}')`);

  res.sendStatus(200);
});

roomsRouter.post("/join/:roomId", async (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  const roomId = req.params.roomId;
  const { name } = req.body as UserJoinRoomDTO;

  if (!name) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  const userId = uuidv4();
  await pool.query(
    `insert into users (id, name, in_room) values ('${userId}', '${name}', '${roomId}')`
  );

  res.json({ userId, name });
});

roomsRouter.put("/leave", async (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  const { id } = req.body as UserLeaveRoomDTO;

  if (!id) {
    res.status(400).send({ message: "Ошибка валидации" });
    return;
  }

  await pool.query(`delete from users where id = '${id}'`);

  res.sendStatus(200);
});
