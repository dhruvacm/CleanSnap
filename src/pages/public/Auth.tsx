import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Leaf,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/services/profiles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const {
    session,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [login, setLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [busy, setBusy] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  /*
   * Redirect an already authenticated user
   * according to their profile role.
   */
  useEffect(() => {
    if (!session?.user) return;

    let mounted = true;

    async function redirectByRole() {
      try {
        setCheckingRole(true);

        const profile = await getProfile(
          session.user.id,
        );

        if (!mounted) return;

        if (
          profile.role === "admin" ||
          profile.role === "municipality"
        ) {
          navigate("/admin", {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }
      } catch (error) {
        console.error(
          "Could not determine user role:",
          error,
        );

        if (mounted) {
          navigate("/dashboard", {
            replace: true,
          });
        }
      } finally {
        if (mounted) {
          setCheckingRole(false);
        }
      }
    }

    redirectByRole();

    return () => {
      mounted = false;
    };
  }, [session, navigate]);

  /*
   * Show loading while Supabase restores
   * the existing authentication session.
   */
  if (authLoading || checkingRole) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">
            {checkingRole
              ? "Checking account..."
              : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  /*
   * If a session exists, the effect above
   * will redirect based on role.
   */
  if (session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  async function submit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setBusy(true);

    try {
      if (login) {
        const {
          error,
        } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        /*
         * Do not navigate here.
         *
         * Supabase updates the AuthContext session,
         * which triggers the role check above.
         */
        toast.success("Welcome back");
      } else {
        const {
          error,
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });

        if (error) {
          throw error;
        }

        toast.success(
          "Account created. Check your email if verification is enabled.",
        );

        /*
         * Keep the user on the auth page after signup.
         * They can verify their email and then sign in.
         */
        setLogin(true);
        setPassword("");
      }
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Authentication failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-hero">
            <Leaf
              className="text-primary-foreground"
              size={20}
            />
          </span>

          CleanSnap
        </div>

        <div className="glass-card-elevated p-6 sm:p-8">
          <h1 className="text-2xl font-black">
            {login
              ? "Welcome back"
              : "Join CleanSnap"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {login
              ? "Continue making your community cleaner."
              : "Create your citizen account in seconds."}
          </p>

          <form
            onSubmit={submit}
            className="mt-6 space-y-4"
          >
            {!login && (
              <div>
                <Label>Name</Label>

                <div className="relative mt-1">
                  <User
                    className="absolute left-3 top-2.5 text-muted-foreground"
                    size={16}
                  />

                  <Input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Email</Label>

              <div className="relative mt-1">
                <Mail
                  className="absolute left-3 top-2.5 text-muted-foreground"
                  size={16}
                />

                <Input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Password</Label>

              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-2.5 text-muted-foreground"
                  size={16}
                />

                <Input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full gradient-hero border-0"
            >
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : login ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <button
            onClick={() =>
              setLogin(!login)
            }
            className="mt-5 w-full text-center text-sm text-primary hover:underline"
          >
            {login
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}