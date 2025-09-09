"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Awareness } from "y-protocols/awareness";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "lucide-react";

export function ActiveUsers({
  awareness,
  currentUserId,
}: {
  awareness: Awareness;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const states = Array.from(awareness.getStates().values()) as any[];
      const sessionUsers = states
        .filter((s) => s?.user)
        .map((s) => ({
          id: s.user.id,
          name: s.user.name,
          color: s.user.color,
        }));
      setUsers(sessionUsers);
    };
    awareness.on("update", update);
    update();
    return () => awareness.off("update", update);
  }, [awareness]);

  const grouped = users.reduce((acc: Record<string, any>, user) => {
    if (!acc[user.id]) acc[user.id] = { ...user, sessions: 1 };
    else acc[user.id].sessions += 1;
    return acc;
  }, {});
  const uniqueUsers = Object.values(grouped);

  return (
    <>
      <TooltipProvider>
        <div
          className="flex -space-x-2 cursor-pointer overflow-x-auto max-w-[120px] sm:max-w-none"
          onClick={() => setOpen(true)}
        >
          {uniqueUsers.map((u: any) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                    <AvatarFallback
                      style={{ backgroundColor: u.color }}
                      className="text-xs font-semibold text-white"
                    >
                      {u.name[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {u.sessions > 1 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full border border-white">
                      ×{u.sessions}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{`${u.name}${
                u.sessions > 1 ? ` (${u.sessions} sessions)` : ""
              }`}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Modal for details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                            <User className="w-4 h-4" /> Active Users ({users.length} sessions)
            </DialogTitle>
          </DialogHeader>

          <div className="divide-y mt-2">
            {uniqueUsers.map((u: any) => (
              <div key={u.id} className="flex items-center py-2 gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback
                    style={{ backgroundColor: u.color }}
                    className="text-xs font-semibold text-white"
                  >
                    {u.name[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-green-600">(You)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.sessions} session{u.sessions > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}