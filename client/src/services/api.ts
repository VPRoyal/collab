import client from "@/lib/api";
import { API_ROUTES } from "@/config/api";
import type {User, Doc,Chat } from "@/types"

export const apiService = {
  // ---- AUTH ----
  login: async (username: string) => {
    const res = await client.post<User>(API_ROUTES.auth.login, { username });
    return res.data;
  },

  // ---- DOCUMENTS ----
  getDocuments: async (userId:string) => {
    const res = await client.get<Doc[]>(`${API_ROUTES.documents.list}?userId=${userId}`);
    return res.data;
  },

  createDocument: async (title: string, authorId: string) => {
    const res = await client.post<Doc>(API_ROUTES.documents.create, {
      title,
      authorId,
    });
    return res.data;
  },

  updateTitle: async (id: string, title: string) => {
    const res = await client.put<Doc>(API_ROUTES.documents.byId(id), {
      title,
    });
    return res.data;
  },

  getDocument: async (id: string, userId:string) => {
    const res = await client.get<Doc>(`${API_ROUTES.documents.byId(id)}?userId=${userId}`);
    const docData = res.data;
    if(!docData?.id) throw new Error("Unable to fetch Doc")
    return docData;
  },

  // ---- CHAT ----
  getChatMessages: async (docId: string, before?:string) => {
    const res = await client.get<Chat[]>(API_ROUTES.chat.byDocId(docId));
    return res.data;
  },
};