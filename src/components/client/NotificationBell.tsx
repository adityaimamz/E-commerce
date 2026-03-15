"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 1 minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications((prev) => 
          prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center outline-none cursor-pointer hover:text-gray-800 transition-colors">
          <Bell className="w-4 h-4 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto z-[100] bg-white p-2">
        <DropdownMenuLabel className="font-semibold text-gray-800 pb-2">Notifikasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Belum ada notifikasi
          </div>
        ) : (
          <div className="flex flex-col gap-1 mt-2">
            {notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif.id} 
                className="focus:bg-gray-50 rounded-md flex flex-col items-start p-3 cursor-pointer outline-none relative"
                onSelect={(e) => {
                  if (!notif.isRead) markAsRead(notif.id);
                  if (notif.link) {
                    setIsOpen(false);
                  }
                }}
                asChild
              >
                {notif.link ? (
                  <Link href={notif.link} className="w-full">
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-sm font-medium ${notif.isRead ? "text-gray-600" : "text-blue-600"}`}>{notif.title}</span>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                    </div>
                    <p className={`text-xs mt-1 ${notif.isRead ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>{notif.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">
                      {new Date(notif.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </Link>
                ) : (
                  <div className="w-full">
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-sm font-medium ${notif.isRead ? "text-gray-600" : "text-blue-600"}`}>{notif.title}</span>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                    </div>
                    <p className={`text-xs mt-1 ${notif.isRead ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>{notif.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">
                      {new Date(notif.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
