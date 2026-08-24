import {
  Home,
  Camera,
  Map,
  Trophy,
  Award,
  User,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  ["/dashboard", Home, "Home"],
  ["/map", Map, "Map"],
  ["/report", Camera, "Report"],
  ["/leaderboard", Trophy, "Board"],
  ["/rewards", Award, "Rewards"],
  ["/profile", User, "Profile"],
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70">

      <div className="mx-auto max-w-2xl px-2 pb-[env(safe-area-inset-bottom)]">

        <div className="relative flex h-[68px] items-center justify-between">

          {items.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex min-w-[48px] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-[10px] font-bold transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active background */}
                  <span
                    className={`absolute inset-x-2 inset-y-1 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10"
                        : "bg-transparent group-hover:bg-secondary/70"
                    }`}
                  />

                  {/* Icon */}
                  <span
                    className={`relative grid h-8 w-10 place-items-center rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : ""
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </span>

                  {/* Label */}
                  <span className="relative leading-none">
                    {label}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}

        </div>

      </div>
    </nav>
  );
}