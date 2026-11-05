"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  emptyState,
  restoreState,
  STORAGE_KEY,
  type DemoState,
} from "@/lib/domain";
const Context = createContext<{
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  ready: boolean;
  storageError: boolean;
  clear: () => void;
} | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      setState(restoreState(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }
  }, [state, ready]);
  function clear() {
    setState(structuredClone(emptyState));
    try {
      localStorage.removeItem(STORAGE_KEY);
      Object.keys(localStorage)
        .filter((k) => k === "iamt-board-v4" || k.startsWith("iamt-answer-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      setStorageError(true);
    }
  }
  return (
    <Context.Provider value={{ state, setState, ready, storageError, clear }}>
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(Context);
  if (!ctx) throw Error("DemoProvider required");
  return ctx;
}
