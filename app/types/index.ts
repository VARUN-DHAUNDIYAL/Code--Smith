import { Templates, User, Playground, TemplateFile } from '@prisma/client';

export interface PlaygroundWithRelations extends Playground {
  templateFiles?: TemplateFile[];
  user?: User;
}

export interface UserWithRelations extends User {
  playgrounds?: Playground[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export type { Templates };
