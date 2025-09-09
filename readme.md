# Collab ✍️🔗  
*A real-time collaborative document editor with chat & presence — powered by Y.js, Next.js, and Socket.IO.*

![Collab Banner](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757361106/Screenshot_2025-09-09_012128_gcizem.png)  

[![Next.js](https://img.shields.io/badge/Next.js-13-black?style=flat&logo=next.js)](https://nextjs.org/)  
[![Socket.IO](https://img.shields.io/badge/Socket.io-Realtime-blue?logo=socket.io)](https://socket.io/)  
[![PostgreSQL](https://img.shields.io/badge/Postgres-Database-336791?logo=postgresql)](https://www.postgresql.org/)  
[![Redis](https://img.shields.io/badge/Redis-Presence-red?logo=redis)](https://redis.io/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 📖 Overview

**CollabWrite** is a full-stack, real-time collaborative document editor inspired by Google Docs / Notion:  
- Multiple users editing the same document simultaneously.  
- Live cursors, presence indicators, and user awareness.  
- Integrated real-time **chat sidebar**.  
- Server-authoritative CRDT model with persistence to PostgreSQL.

### 🌐 **Live Demo**: [Demo URL](https://collab-client.onrender.com/)  
- **Note:** This application is deployed on Render. After periods of inactivity, the first request may take a little longer to load as the server restarts.

### 📸 **Screenshots & Demo**

Here’s a preview of **Collab** in action:  

| Login / User | Document List |
|--------------|---------------|
| ![Login](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_010940_vyckxb.png) | ![Docs List](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_011318_apxau0.png) |

| Document Grid View | Chat Sidebar |
|--------------------|-------------|
| ![Docs Grid](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_011133_rvrlmm.png) | ![Editor](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_011405_eou8kr.png) |

| Editor View | Presence & Awareness |
|----------------------|--------------|
| ![Presence](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_011302_z9rbjh.png) | ![Chat](https://res.cloudinary.com/dg68nuxzw/image/upload/v1757360864/Screenshot_2025-09-09_011527_iwea2t.png) |

### 🎥 **Demo Video** (Coming Soon): [Watch Here](#)

---

## ✨ Features

- 📜 **Collaborative Editing** – Rich text editing with TipTap + ProseMirror + Y.js.  
- 💬 **Realtime Chat Sidebar** – Decoupled chat synced via socket events, persisted in DB.  
- 👥 **Active Users Tracking** – Presence with duplicate-session detection (e.g. "×3 tabs").  
- 📂 **Document Management** – Create, rename, search, and list docs.  
- 🎨 **UI/UX** – Modern UI with TailwindCSS, tooltips, dialogs, avatars, modals.  
- 💾 **Persistence** – Doc edits saved as Y.Doc state in PostgreSQL, throttled for performance.  
- ⚡ **Realtime Architecture** – Socket.IO channels for doc, awareness, chat.  
- 🔒 **User System** – Lightweight login + session stored in localStorage.  
- 🍞 **Feedback** – Toast notifications with [Sonner](https://sonner.emilkowal.ski/).

---

## 🛠 Tech Stack

### **Client** (in `/client`)
- [Next.js](https://nextjs.org/) 13+ (App Router)
- [React](https://react.dev/)
- [Y.js](https://github.com/yjs/yjs) + [y-prosemirror](https://github.com/yjs/y-prosemirror)
- [TipTap](https://tiptap.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Sonner](https://sonner.emilkowal.ski/) (toasts)
- [Lucide Icons](https://lucide.dev/)

### **Server** (in `/server`)
- [Node.js](https://nodejs.org/)
- [Socket.IO](https://socket.io/)
- [Y.js](https://github.com/yjs/yjs) (server-authoritative docs)
- [Redis](https://redis.io/) (for ephemeral presence tracking)
- [PostgreSQL](https://www.postgresql.org/) (persistence)
- [Prisma](https://www.prisma.io/) (or your ORM used in `services`)

---

## 📂 Project Structure

```bash
repo-root/
├── client/                # Next.js frontend
│   ├── app/               # Pages/routes
│   ├── components/ui      # Reusable UI
│   ├── components/views   # Editor, Chat, ActiveUsers, etc.
│   ├── lib/               # Provider utils (ySocket, socketClient, throttle)
│   └── ...
│
├── server/                # Node.js Socket.IO backend
│   ├── sockets/           # registerSockets.ts
│   ├── services/          # docs, chat db services
│   ├── config/redis.ts    # redis publisher/subscriber client
│   └── ...
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 🔧 Prerequisites
- Node.js **18+**
- PostgreSQL (running locally with a `DATABASE_URL`)
- Redis
- pnpm / npm or yarn

---

### ▶️ Running locally

1. **Clone Repo**
```bash
git clone https://github.com/your-handle/collabwrite.git
cd collabwrite
```

2. **Backend Setup**
```bash
cd server
cp .env.example .env   # configure DATABASE_URL, REDIS_URL
npm install
npm run dev
```

3. **Frontend Setup**
```bash
cd client
cp .env.example .env   # configure NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL
npm install
npm run dev
```

Visit ➡️ http://localhost:3000

---

## 🌐 Environment Variables

### Server (`/server/.env`)
```
NODE_ENV
DATABASE_URL=postgresql://user:pass@localhost:5432/collabwrite
REDIS_URL=redis://localhost:6379
REDIS_USER=default
REDIS_PASS= pass
PORT=4000
```

### Client (`/client/.env`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 📡 API Routes

### `POST /login`
- Login / register user (simple username-based).

### `GET /docs/list?userId=${userId}`
- Get documents for a user.

### `POST /docs/create`
- Create new document.

### `PUT /docs/:docId`
- Update document.


### `GET /docs/:docId?userId=${userId}`
- Get specific doc (metadata, DB state, chat history).  

### `GET /chat/:docId`
- Get chat messages.  

---

## 🔗 Socket.IO Events

**Client → Server**
- `doc:join` → join doc room.  
- `doc:update` → send Y.Doc update patch.  
- `awareness:update` → send awareness info.  
- `chat:send` → send chat message.  

**Server → Client**
- `doc:update` → broadcast doc patch.  
- `awareness:update` → broadcast awareness.  
- `chat:new` → broadcast chat message.  

---

## 💾 Persistence Flow

- **Docs** → Server holds authoritative `Y.Doc` per room.  
  - Throttled save (2s debounce) → encode state → store in PostgreSQL.  
- **Chat** → DB table, persisted per message, broadcast immediately.  
- **Presence** → Redis ephemeral `doc:{docId}:active` sets, cleared on restart.  

---

## 🚀 Roadmap
- Infinite scroll / lazy loading for chat.  
- Richer editor extensions (comments, highlights).  
- Real authentication (OAuth / JWT).  
- Multi-server scaling (sync Y.Docs across nodes).  

---

## 🤝 Contributing
PRs welcome! Please:
- Run `npm run lint` & `npm run format` before submitting.  
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commits.  

---

## 📜 License
MIT © [VP Singh]  

---
