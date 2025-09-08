"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { Doc } from "@/types";
import { useUser } from "@/hooks/useUser";
import DocumentsList from "./docList";

export default function DocumentsClient() {
  const { user, loading } = useUser(true);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      apiService.getDocuments(user.id)
        .then(setDocuments)
        .catch(() => toast.error("Failed to load documents"));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.info("Logged out successfully");
    router.push("/login");
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center space-x-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-semibold">Collab</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{user.username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* DOCUMENTS LIST */}
      <DocumentsList user={user} docs={documents} setDocs={setDocuments} />
    </div>
  );
}