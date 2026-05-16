import { Templates, Playground, TemplateFile } from '@prisma/client';

export interface PlaygroundWithRelations extends Playground {
  templateFiles?: TemplateFile[];
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
