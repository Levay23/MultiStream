import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  glowColor?: string;
  subtitle?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, color = "#3b82f6", glowColor, subtitle, delay = 0 }: StatCardProps) {
  const glow = glowColor ?? color;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative rounded-xl p-5 overflow-hidden group cursor-default"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 50% 50%, ${glow}08 0%, transparent 70%)` }}
      />
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
      />

      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}15`, boxShadow: `0 0 16px ${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">{title}</p>
          <motion.p
            className="text-2xl font-black text-white mt-0.5 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-[11px] text-white/25 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}
