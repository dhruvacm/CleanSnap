import {
  Bell,
  Leaf,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import { useEffect, useRef, useState } from "react";
import { getProfile } from "@/services/profiles";
import { supabase } from "@/integrations/supabase/client";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] =
    useState<any>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
const [hasUnread, setHasUnread] = useState(false);
  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  /* Load profile */
  useEffect(() => {
    if (!user) return;

    getProfile(user.id)
      .then(setProfile)
      .catch(() => {});
  }, [user]);

  /* Load notifications */
  useEffect(() => {
    if (!user) return;

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);
const notificationData = data || [];

setNotifications(notificationData);

setHasUnread(
  notificationData.some(
    (notification) => !notification.read_at
  )
);setNotifications(data || []);
    }

    loadNotifications();
  }, [user]);

  /* Close notification panel whenever route changes */
  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname]);

  /* Close when clicking outside */
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setNotificationOpen(false);
      }
    }

    if (notificationOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [notificationOpen]);

  async function logout() {
    setNotificationOpen(false);

    await signOut();

    navigate("/auth");
  }

 async function openNotifications() {
  const nextState = !notificationOpen;

  setNotificationOpen(nextState);

  if (nextState) {
    await markNotificationsRead();
  }
}

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-extrabold"
            onClick={() =>
              setNotificationOpen(false)
            }
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-hero">
              <Leaf
                size={18}
                className="text-primary-foreground"
              />
            </span>

            CleanSnap
          </Link>

          <div className="flex items-center gap-2">

            {/* Admin */}
            {(
              profile?.role === "admin" ||
              profile?.role === "municipality"
            ) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNotificationOpen(false);
                  navigate("/admin");
                }}
                className="gap-1"
              >
                <ShieldCheck size={15} />
                Admin
              </Button>
            )}

            {/* Notification */}
            <div
              ref={notificationRef}
              className="relative"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={openNotifications}
                aria-label="Notifications"
              >
                <Bell size={18} />

                {hasUnread && (
  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
)}
              </Button>

              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border bg-background shadow-xl">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="font-bold">
                        Notifications
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Recent updates
                      </p>
                    </div>

                    <Bell
                      size={17}
                      className="text-primary"
                    />
                  </div>

                  {/* Notifications */}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell
                          className="mx-auto text-muted-foreground"
                          size={22}
                        />

                        <p className="mt-2 text-sm text-muted-foreground">
                          No notifications yet.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className="flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-secondary"
                            onClick={() => {
                              setNotificationOpen(
                                false,
                              );

                              navigate(
                                "/notifications",
                              );
                            }}
                          >
                            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                              <CheckCircle2
                                size={16}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {notification.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {notification.message}
                              </p>

                              {notification.created_at && (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </button>
                        ),
                      )
                    )}
                  </div>

                  {/* View all */}
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => {
                        setNotificationOpen(
                          false,
                        );

                        navigate(
                          "/notifications",
                        );
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
  async function markNotificationsRead() {
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (!error) {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: new Date().toISOString(),
      })),
    );

    setHasUnread(false);
  }
}
}