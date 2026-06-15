import React, { createContext, useContext, useState } from 'react';

export interface AiUsage {
  dailyTokenLimit?: number;
  tokenLimit?: number;
  tokensUsed: number;
  remainingTokens: number;
  usedPercent: number;
  remainingPercent: number;
  resetIntervalHours?: number;
  windowStartedAt?: string;
  resetAt?: string;
  resetAtLabel?: string;
}

interface SidebarContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  aiUsage: AiUsage | null;
  setAiUsage: (value: AiUsage | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);

  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed, mobileOpen, setMobileOpen, aiUsage, setAiUsage }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
