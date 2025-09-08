"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Users, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Doc, User } from "@/types";
import { apiService } from "@/services/api";

interface Props {
  user: User;
  docs: Doc[];
  setDocs: React.Dispatch<React.SetStateAction<Doc[]>>;
}

export default function DocumentsList({ user, docs, setDocs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const router = useRouter();

  const handleNewDocument = async () => {
    try {
      const newDoc = await apiService.createDocument("Untitled Document", user.id);
      setDocs((prev) => [newDoc, ...prev]);
      toast.success("New document created");
      router.push(`/docs/${newDoc.id}`);
    } catch {
      toast.error("Failed to create document");
    }
  };

  const handleSaveTitle = async (docId: string) => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      const updated = await apiService.updateTitle(docId, editTitle.trim());
      setDocs((docs) => docs.map((d) => (d.id === docId ? updated : d)));
      setEditingDocId(null);
      toast.success("Title updated");
    } catch {
      toast.error("Failed to update title");
    }
  };

  const filteredDocs = docs?.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||[]
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        <Button
          onClick={handleNewDocument}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Documents Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition">
            <CardHeader>
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <Badge variant="secondary" className="text-xs">
                  Last edited {new Date(doc.updatedAt).toLocaleString()}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">{doc.activeCount || 0}</span>
                </div>
              </div>

              {/* Title */}
              {editingDocId === doc.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveTitle(doc.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <CardTitle
                    onClick={() => router.push(`/docs/${doc.id}`)}
                    className="truncate cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {doc.title}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDocId(doc.id);
                      setEditTitle(doc.title);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Author */}
              <CardDescription className="mt-1">
                by {doc.author?.username || "Unknown"}
              </CardDescription>
            </CardHeader>

            <CardContent
              onClick={() => router.push(`/docs/${doc.id}`)}
              className="cursor-pointer"
            ></CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">No documents found</h3>
          <p>
            {searchQuery
              ? "Try adjusting your search."
              : "Create your first document now."}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleNewDocument}
              className="bg-blue-600 hover:bg-blue-700 mt-6"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Document
            </Button>
          )}
        </div>
      )}
    </main>
  );
}