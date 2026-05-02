import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Activity, Eye, EyeOff, Zap, Shield, Globe } from "lucide-react";
import loginBg from "@/assets/login-bg.png";

const FEATURES = [
  { icon: Zap, label: "Sesiones en tiempo real" },
  { icon: Shield, label: "Acceso seguro JWT" },
  { icon: Globe, label: "Multi-servicio" },
];

function AnimatedParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? "#e5a00d" : i % 3 === 1 ? "#aa5cc3" : "#3b82f6",
            opacity: 0.6,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FloatingOrb({ color, size, x, y, delay }: any) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, backgroundColor: color }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.08, 0.18, 0.08],
        x: [0, 20, 0],
        y: [0, -15, 0],
      }}
      transition={{ duration: 6 + delay, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("admin@streamsync.io");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user as any);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.message ?? "Credenciales invalidas");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] flex overflow-hidden">
      {/* Left Panel — Cinematic Background */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050810]/20 via-transparent to-[#050810]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810]/80 via-transparent to-transparent" />

        {/* Floating orbs */}
        <FloatingOrb color="#3b82f6" size={400} x="10%" y="20%" delay={0} />
        <FloatingOrb color="#aa5cc3" size={300} x="50%" y="50%" delay={2} />
        <FloatingOrb color="#e5a00d" size={200} x="70%" y="70%" delay={4} />

        <AnimatedParticles />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/30 border border-primary/40 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-widest">STREAMSYNC</p>
              <p className="text-[10px] text-white/40 tracking-[0.3em]">PANEL DE CONTROL</p>
            </div>
          </motion.div>

          {/* Main copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            >
              <p className="text-xs font-semibold tracking-[0.4em] text-primary/80 uppercase mb-4">
                Plataforma de Streaming Premium
              </p>
              <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                Control total<br />
                <span className="bg-gradient-to-r from-amber-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  en un solo panel
                </span>
              </h1>
              <p className="text-white/50 mt-5 text-sm leading-relaxed max-w-sm">
                Administra Plex, Jellyfin y Emby desde una interfaz unificada. Gestiona clientes, servidores y sesiones en tiempo real.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col gap-3"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                    <f.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-white/60">{f.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Service badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-3"
            >
              {[
                { label: "Plex", color: "#e5a00d", bg: "rgba(229,160,13,0.15)", border: "rgba(229,160,13,0.3)" },
                { label: "Jellyfin", color: "#aa5cc3", bg: "rgba(170,92,195,0.15)", border: "rgba(170,92,195,0.3)" },
                { label: "Emby", color: "#52b54b", bg: "rgba(82,181,75,0.15)", border: "rgba(82,181,75,0.3)" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold"
                  style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs text-white/20"
          >
            © 2026 StreamSync. Todos los derechos reservados.
          </motion.p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative bg-[#050810]">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[380px] relative"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-white tracking-widest text-sm">STREAMSYNC</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-8 h-0.5 bg-primary rounded-full mb-5 origin-left"
            />
            <h2 className="text-3xl font-black text-white mb-1.5 tracking-tight">Iniciar Sesion</h2>
            <p className="text-sm text-white/40">Accede a tu panel de administracion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="relative">
              <motion.label
                animate={{ color: focused === "email" ? "#3b82f6" : "rgba(255,255,255,0.4)" }}
                className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              >
                Correo Electronico
              </motion.label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-300"
                  required
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-left"
                  animate={{ scaleX: focused === "email" ? 1 : 0, opacity: focused === "email" ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="relative">
              <motion.label
                animate={{ color: focused === "password" ? "#3b82f6" : "rgba(255,255,255,0.4)" }}
                className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
              >
                Contrasena
              </motion.label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-300 pr-12"
                  required
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-left"
                  animate={{ scaleX: focused === "password" ? 1 : 0, opacity: focused === "password" ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative w-full py-4 rounded-xl text-sm font-bold text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #6d28d9 100%)",
                boxShadow: "0 0 30px rgba(59,130,246,0.3), 0 4px 15px rgba(0,0,0,0.4)",
              }}
            >
              {/* Animated shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative z-10">
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Iniciando sesion...
                  </span>
                ) : (
                  "Acceder al Panel"
                )}
              </span>
            </motion.button>
          </form>

          {/* Demo hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="flex-1 h-px bg-white/5" />
            <p className="text-[11px] text-white/20 whitespace-nowrap">
              admin@streamsync.io / admin123
            </p>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
