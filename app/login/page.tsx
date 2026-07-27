'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PackageSearch, Eye, EyeOff, Loader2, User, Lock, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Username atau Password salah');
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full bg-transparent border-0 border-b-2 text-sm text-white py-3 px-1 outline-none transition-all duration-300 placeholder-slate-600';
  const inputIdle = 'border-slate-700/50 hover:border-slate-600';
  const inputFocus = 'border-blue-500';
  const inputError = error ? 'border-rose-500/50' : '';

  return (
    <div className="relative">
      {/* Glassmorphism Card */}
      <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.06)] p-10 overflow-hidden">
        {/* Inner glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <PackageSearch className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cult <span className="text-slate-400 font-light">Flow</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-1.5 tracking-wide uppercase">
            Sistem Operasional Terpadu
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="relative mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center animate-fade-in backdrop-blur-sm">
            <div className="absolute inset-0 bg-rose-500/5 rounded-xl" />
            <span className="relative">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="relative">
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === 'username' ? 'text-blue-500' : 'text-slate-600'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="username"
              className={`${inputBase} pl-7 ${inputIdle} ${focusedField === 'username' ? inputFocus : ''} ${inputError}`}
              placeholder="Username atau email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === 'password' ? 'text-blue-500' : 'text-slate-600'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="current-password"
              className={`${inputBase} pl-7 pr-10 ${inputIdle} ${focusedField === 'password' ? inputFocus : ''} ${inputError}`}
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="group relative w-full py-3 mt-4 rounded-xl text-sm font-medium text-white overflow-hidden transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* Button gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Button glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(59,130,246,0.4)] rounded-xl" />

            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk ke Portal
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/[0.05]">
          <p className="text-center text-[10px] text-slate-600 leading-relaxed">
            Hubungi Administrator jika mengalami kendala akses
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060a12] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background layers */}
      <div className="absolute inset-0">
        {/* Gradient mesh */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.05] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-cyan-600/[0.03] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <Suspense
          fallback={
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 flex items-center justify-center h-[420px]">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Bottom branding */}
        <p className="text-center text-[9px] text-slate-700 mt-6 tracking-widest uppercase">
          Cult Flow &copy; 2024
        </p>
      </div>
    </div>
  );
}
