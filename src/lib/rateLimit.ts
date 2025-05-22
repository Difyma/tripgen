import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RateLimitStore {
  isLimited: boolean;
  limitExpiry: number | null;
  attemptCount: number;
  setRateLimit: (duration: number) => void;
  clearRateLimit: () => void;
  incrementAttempts: () => void;
}

// Progressive backoff: each consecutive attempt increases wait time
const getBackoffDuration = (attempts: number): number => {
  const baseDelay = 60; // 1 minute base delay
  const maxDelay = 300; // 5 minutes maximum delay
  const backoffDelay = Math.min(baseDelay * Math.pow(1.5, attempts - 1), maxDelay);
  return Math.floor(backoffDelay);
};

export const useRateLimitStore = create<RateLimitStore>()(
  persist(
    (set, get) => ({
      isLimited: false,
      limitExpiry: null,
      attemptCount: 0,
      setRateLimit: (duration: number) => {
        const expiry = Date.now() + duration * 1000;
        set({ isLimited: true, limitExpiry: expiry });
      },
      clearRateLimit: () => {
        set({ isLimited: false, limitExpiry: null, attemptCount: 0 });
      },
      incrementAttempts: () => {
        const currentAttempts = get().attemptCount + 1;
        const duration = getBackoffDuration(currentAttempts);
        set({ 
          attemptCount: currentAttempts,
          isLimited: true,
          limitExpiry: Date.now() + duration * 1000 
        });
      }
    }),
    {
      name: 'auth-rate-limit',
      partialize: (state) => ({
        isLimited: state.isLimited,
        limitExpiry: state.limitExpiry,
        attemptCount: state.attemptCount
      })
    }
  )
); 