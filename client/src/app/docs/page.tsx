import { apiService } from "@/services/api";
import DocumentsClient from "./docsClient";
import type { Doc } from "@/types";

export const metadata = {
  title: "Your Documents | CollabWrite",
  description: "Collaborate in real-time with your team on documents.",
};

// Server Component: fetch documents directly from backend
export default async function DocumentsPage() {

  return <DocumentsClient />;
}