import { ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import dashboardBg from "@/assets/dashboard-bg.png";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-[#060912] overflow-hidden">
      {/* Fixed background for entire panel */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.05) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(109,40,217,0.05) 0%, transparent 60%)"
        }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[220px] shrink-0 relative z-10">
        <div className="w-full">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#060912]/80 backdrop-blur-xl">
          <MobileSidebar />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-widest">STREAMSYNC</span>
          </div>
        </div>

        {/* Page content */}
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto p-5 lg:p-7"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
