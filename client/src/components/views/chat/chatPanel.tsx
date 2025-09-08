"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { YSocketIOProvider } from "@/lib/ySocket";
import type { Chat } from "@/types";

interface ChatPanelProps {
  provider: YSocketIOProvider;
  user: { id: string; username: string; color: string };
  initialChats?: Chat[];
}

export function ChatPanel({ provider, user, initialChats = [] }: ChatPanelProps) {
  const [messages, setMessages] = useState<Chat[]>(initialChats);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Listen for new chat messages from socket provider
  useEffect(() => {
    const off = provider.onChatMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => off();
  }, [provider]);

  // Auto-scroll to last message
  useEffect(() => {
    if (messages.length > 0) {
      document.getElementById("last-message")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    provider.sendChatMessage(newMessage, {
      id: user.id,
      username: user.username,
      color: user.color,
    });
    setNewMessage("");
    provider.setTyping(false);
  };

  // Typing awareness
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    provider.setTyping(value.trim().length > 0);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => provider.setTyping(false), 1200);
  };

  useEffect(() => {
    if (!provider?.awareness) return;
    const computeTypingUsers = () => {
      const states = Array.from(provider.awareness.getStates().values()) as any[];
      const users = states
        .filter((s) => s?.typing && s?.user?.id !== user.id)
        .map((s) => s.user?.username ?? s.user?.name ?? "Unknown");
      setTypingUsers(users);
    };
    provider.awareness.on("update", computeTypingUsers);
    computeTypingUsers();
    return () => provider.awareness.off("update", computeTypingUsers);
  }, [provider, user.id]);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium text-lg">Chat</h3>
        <span className="text-xs text-muted-foreground">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => {
          const isMe = m.user.id === user.id;
          const pending = m.id?.startsWith("temp-");

          return (
            <div
              key={m.id || `${m.user.id}-${i}`}
              id={i === messages.length - 1 ? "last-message" : undefined}
              className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback style={{ backgroundColor: m.user?.color }}>
                    {m.user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  isMe
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                  {!isMe && <span className="font-medium">{m.user.username}</span>}
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {pending && <span className="italic">sending...</span>}
                </div>
                <p>{m.message}</p>
              </div>

              {isMe && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback style={{ backgroundColor: user.color }}>
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}

        {/* No messages fallback */}
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-10">
            No messages yet. Start the conversation!
          </p>
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-2 text-xs text-muted-foreground italic">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length === 1 ? "is typing..." : "are typing..."}
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="flex-1"
        />
        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}