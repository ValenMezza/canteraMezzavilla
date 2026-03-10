"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-xs font-extrabold text-text-dim tracking-[4px]">
            SISTEMAS
          </div>
          <div className="text-3xl font-extrabold text-accent tracking-[3px] -mt-1">
            MEZZAVILLA
          </div>
          <div className="w-10 h-[3px] bg-accent rounded mx-auto mt-3" />
          <p className="text-text-muted text-xs mt-3">
            Sistema de Gestión de Áridos
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-7">
          <h2 className="text-base font-semibold text-text-main mb-5">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg border border-border rounded-md px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-accent transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-md px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg font-semibold rounded-md py-2.5 text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-[10px] mt-6">
          © {new Date().getFullYear()} Sistemas Mezzavilla
        </p>
      </div>
    </div>
  );
}
