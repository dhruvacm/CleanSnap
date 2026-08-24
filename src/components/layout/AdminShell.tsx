import {
  BarChart3,
  FileText,
  Leaf,
  LogOut,
  Map,
  ShieldCheck,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function AdminShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: "Overview",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
  label: "Citizens",
  path: "/admin/users",
  icon: Users,
},
    {
      label: "Reports",
      path: "/admin/reports",
      icon: FileText,
    },
    {
      label: "Map",
      path: "/admin/map",
      icon: Map,
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },
  ];

  async function logout() {
    await signOut();
    navigate("/auth");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link
            to="/admin"
            className="flex items-center gap-2 font-extrabold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-hero">
              <Leaf
                size={18}
                className="text-primary-foreground"
              />
            </span>

            <span>CleanSnap</span>

            <span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ShieldCheck size={15} />
              Citizen App
            </Button>

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

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop Sidebar */}
        <aside className="hidden min-h-[calc(100vh-4rem)] w-60 shrink-0 border-r py-6 md:block">
          <nav className="space-y-1 px-3">
            <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 pb-10 pt-6 md:px-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Admin Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-2 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}