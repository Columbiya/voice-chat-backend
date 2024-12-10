export interface Room {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  in_room: string;
}
