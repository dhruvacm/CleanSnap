import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminUsers from "@/pages/admin/AdminUsers";
import AppShell from "@/components/layout/AppShell";
import AdminShell from "@/components/layout/AdminShell";

import Landing from "@/pages/public/Landing";
import Auth from "@/pages/public/Auth";

import Dashboard from "@/pages/citizen/Dashboard";
import Report from "@/pages/citizen/Report";
import MyReports from "@/pages/citizen/MyReports";
import ReportDetails from "@/pages/citizen/ReportDetails";
import CommunityMap from "@/pages/citizen/CommunityMap";
import Leaderboard from "@/pages/citizen/Leaderboard";
import Rewards from "@/pages/citizen/Rewards";
import Profile from "@/pages/citizen/Profile";
import Notifications from "@/pages/citizen/Notifications";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminReports from "@/pages/admin/AdminReports";
import AdminMap from "@/pages/admin/AdminMap";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";

import NotFound from "@/pages/NotFound";

function Protected({
  children,
}: {
  children: ReactNode;
}) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        Loading…
      </div>
    );
  }

  return session ? (
    <>{children}</>
  ) : (
    <Navigate to="/auth" replace />
  );
}

function AdminOnly({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const [role, setRole] = useState<string | null>(
    null,
  );

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      if (!user) {
        if (mounted) {
          setRole(null);
          setChecking(false);
        }

        return;
      }

      try {
        const { getProfile } = await import(
          "@/services/profiles"
        );

        const profile = await getProfile(user.id);

        if (mounted) {
          setRole(profile.role || "citizen");
        }
      } catch (error) {
        console.error(
          "Admin role check failed:",
          error,
        );

        if (mounted) {
          setRole("citizen");
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    if (!authLoading) {
      checkRole();
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        Checking access…
      </div>
    );
  }

  if (
    role === "admin" ||
    role === "municipality"
  ) {
    return <>{children}</>;
  }

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/auth"
        element={<Auth />}
      />

      {/* =========================
          CITIZEN APPLICATION
          ========================= */}
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/report"
          element={<Report />}
        />

        <Route
          path="/my-reports"
          element={<MyReports />}
        />

        <Route
          path="/reports/:id"
          element={<ReportDetails />}
        />

        <Route
          path="/map"
          element={<CommunityMap />}
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="/rewards"
          element={<Rewards />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />
<Route
  path="/admin/users"
  element={
    <AdminOnly>
      <AdminUsers />
    </AdminOnly>
  }
/>
        <Route
          path="/notifications"
          element={<Notifications />}
        />
      </Route>

      {/* =========================
          ADMIN APPLICATION
          ========================= */}
      <Route
        element={
          <Protected>
            <AdminOnly>
              <AdminShell />
            </AdminOnly>
          </Protected>
        }
      >
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/reports"
          element={<AdminReports />}
        />

        <Route
          path="/admin/map"
          element={<AdminMap />}
        />

        <Route
          path="/admin/analytics"
          element={<AdminAnalytics />}
        />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}