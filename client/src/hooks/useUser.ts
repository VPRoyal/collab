"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

export const useUser=(redirect = true)=> {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        if (redirect) router.replace("/login");
        setLoading(false);
        return;
      }
      const parsed = JSON.parse(storedUser).user as User;
      setUser(parsed);
    } catch {
      if (redirect) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router, redirect]);

  return { user, loading, setUser };
}