
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TokenState {
  contentTokens: number;
  viewTokens: number;
  addContentTokens: (amount: number) => void;
  addViewTokens: (amount: number) => void;
  spendContentTokens: (amount: number) => void;
  spendViewTokens: (amount: number) => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      contentTokens: 0,
      viewTokens: 0,
      addContentTokens: (amount) =>
        set((state) => ({ contentTokens: state.contentTokens + amount })),
      addViewTokens: (amount) =>
        set((state) => ({ viewTokens: state.viewTokens + amount })),
      spendContentTokens: (amount) =>
        set((state) => ({ contentTokens: state.contentTokens - amount })),
      spendViewTokens: (amount) =>
        set((state) => ({ viewTokens: state.viewTokens - amount })),
    }),
    {
      name: "token-storage",
    }
  )
);
