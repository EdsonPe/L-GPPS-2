import React from 'react';
import { motion } from 'motion/react';
import { Shield, Map as MapIcon, PlusSquare, BarChart3, User, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind classes merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'map', icon: Globe, label: 'Mapa' },
    { id: 'register', icon: PlusSquare, label: 'Registrar' },
    { id: 'dashboard', icon: BarChart3, label: 'Cidades' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:hidden">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-full flex items-center justify-around p-1 shadow-lg border border-nexus-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center p-3 transition-colors rounded-full",
                isActive ? "text-nexus-primary" : "text-nexus-muted hover:text-nexus-text"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-nav"
                  className="absolute inset-0 bg-nexus-primary/5 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={18} className={cn(isActive && "scale-110")} />
              <span className="text-[9px] font-bold uppercase tracking-tighter mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-nexus-primary text-white hover:brightness-110 shadow-md",
      secondary: "bg-white text-nexus-text border border-nexus-border hover:bg-gray-50 shadow-sm",
      ghost: "bg-transparent text-nexus-text hover:bg-black/5",
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
