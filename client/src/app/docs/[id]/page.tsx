"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import randomColor from "randomcolor";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { TextEditor } from "@/components/views/editor/textEditor";
import { ChatPanel } from "@/components/views/chat/chatPanel";
import { ActiveUsers } from "@/components/views/presence/activeUsers";
import { apiService } from "@/services/api";
import { YSocketIOProvider } from "@/lib/ySocket";
import * as Y from "yjs";
import type { Doc } from "@/types";

export default function DocumentEditorPage() {
  const [user, setUser] = useState<any>(null);
  const [provider, setProvider] = useState<YSocketIOProvider | null>(null);
  const [ydoc] = useState(() => new Y.Doc());
  const [showChat, setShowChat] = useState(true);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    let prov: YSocketIOProvider | null = null;
    const init = async () => {
      console.log("Init run");
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(storedUser).user;
      setUser(parsed);

      const docData = await apiService.getDocument(
        params.id as string,
        parsed.id
      );
      setDoc(docData);

      const color = randomColor({ luminosity: "dark" });
      prov = new YSocketIOProvider(
        params.id as string,
        ydoc,
        {
          id: parsed.id,
          name: parsed.username,
          color,
        },
      );
      prov.onStatusChange((status) => setIsConnected(status));
      setProvider(prov);
    };
    init();
    return () => prov?.destroy();
  }, [params.id]);

  if (!user || !provider || !doc) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/docs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{doc.title}</h1>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(doc.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant="secondary"
            className={`flex items-center ${
              isConnected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {isConnected ? "Live" : "Not Live"}
          </Badge>

          <ActiveUsers awareness={provider.awareness} currentUserId={user.id} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat((prev) => !prev)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <TextEditor docId={params.id as string} provider={provider} />
        </div>

        {/* Chat */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showChat ? "w-96" : "w-0"
          } border-l bg-card overflow-hidden flex-shrink-0`}
        >
          <ChatPanel
            provider={provider}
            user={user}
            initialChats={doc.chat}
          />
        </div>
      </div>
    </div>
  );
}
