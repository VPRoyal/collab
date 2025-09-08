"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUsername("");
  }, []);

  const handleJoinCollaboration = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const user = await apiService.login(username.trim());

      localStorage.setItem("user", JSON.stringify(user));
      toast.success(`Welcome ${username}!`);

      router.push("/docs");
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-semibold">Welcome to CollabWrite</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your username to start collaborating
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" ? handleJoinCollaboration() : null
              }
              disabled={loading}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleJoinCollaboration}
            disabled={!username.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Joining..." : "Join Collaboration"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            This is a demo of real-time collaborative editing.
            <br />
            Multiple users can edit documents simultaneously.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}