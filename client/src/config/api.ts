export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const API_ROUTES = {
  auth: {
    login: "/user/login",
  },
  documents: {
    create: "/docs/create",
    list: "/docs/list",
    byId: (id: string) => `/docs/${id}`,
  },
  chat: {
    byDocId: (id: string) => `/chat/${id}`,
  },
};