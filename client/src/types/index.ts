export interface Doc {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  createdAt: string;
  authorId: string;
  author: { id: string; username: string };
  chat: Chat[]
  activeCount?: number;
}

export interface User {
  id: string;
  username: string;
  lastActive?: Date;
}

export interface Chat {
  id?: string;
  message: string;
  createdAt: string;
  user: { id: string; username: string, color?:string };
}
