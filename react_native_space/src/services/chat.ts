import api from './api';
import type { ChatInfo, ChatMessageItem } from '../types';

export async function getChatInfo(chatId: string): Promise<ChatInfo> {
  const res = await api.get(`/chats/${encodeURIComponent(chatId)}`);
  return res?.data;
}

export async function getChatMessages(chatId: string, params?: {
  limit?: number;
  before?: string;
}): Promise<{ items: ChatMessageItem[]; hasMore: boolean }> {
  const res = await api.get(`/chats/${encodeURIComponent(chatId)}/messages`, { params });
  return { items: res?.data?.items ?? [], hasMore: res?.data?.hasMore ?? false };
}

export async function sendChatMessage(
  chatId: string,
  messageText: string,
  messageType = 'text',
  imageUrl?: string,
  replyToId?: string,
): Promise<ChatMessageItem> {
  const body: Record<string, string> = { messageText, messageType };
  if (imageUrl) body.imageUrl = imageUrl;
  if (replyToId) body.replyToId = replyToId;
  const res = await api.post(`/chats/${encodeURIComponent(chatId)}/messages`, body);
  return res?.data;
}
