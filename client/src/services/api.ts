import client from "@/lib/api";
import { API_ROUTES } from "@/config/api";
import type { User, Doc, Chat } from "@/types";
import { handleApiResponse } from "@/lib/apiHandler";

export const apiService = {
  // ---- AUTH ----
  login: (username: string) =>
    handleApiResponse<User>(
      client.post(API_ROUTES.auth.login, { username })
    ),

  // ---- DOCUMENTS ----
  getDocuments: (userId: string) =>
    handleApiResponse<Doc[]>(
      client.get(`${API_ROUTES.documents.list}?userId=${userId}`)
    ),

  createDocument: (title: string, authorId: string) =>
    handleApiResponse<Doc>(
      client.post(API_ROUTES.documents.create, { title, authorId })
    ),

  updateTitle: (id: string, title: string) =>
    handleApiResponse<Doc>(
      client.put(API_ROUTES.documents.byId(id), { title })
    ),

  getDocument: (id: string, userId: string) =>
    handleApiResponse<Doc>(
      client.get(`${API_ROUTES.documents.byId(id)}?userId=${userId}`)
    ),

  // ---- CHAT ----
  getChatMessages: (docId: string, before?: string) =>
    handleApiResponse<Chat[]>(
      client.get(API_ROUTES.chat.byDocId(docId), {
        params: before ? { before } : {},
      })
    ),
};