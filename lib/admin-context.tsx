import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

export type AdminLanguage = "ar" | "fr";

export interface AdminEmployee {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AdminContextType {
  employee: AdminEmployee | null;
  isLoading: boolean;
  language: AdminLanguage;
  loginEmployee: (emp: AdminEmployee) => Promise<void>;
  logoutEmployee: () => Promise<void>;
  setLanguage: (lang: AdminLanguage) => void;
  /** Reset the inactivity timer (call on user interaction) */
  resetInactivityTimer: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = "@rv_admin_employee";
const LANG_KEY = "@rv_admin_language";
const LAST_ACTIVE_KEY = "@rv_admin_last_active";

/** Auto-logout after 15 minutes of inactivity */
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguageState] = useState<AdminLanguage>("ar");
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─── Load persisted session ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [empStr, lang, lastActiveStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(LAST_ACTIVE_KEY),
        ]);
        if (empStr) {
          // Check if session expired while app was closed
          if (lastActiveStr) {
            const elapsed = Date.now() - parseInt(lastActiveStr, 10);
            if (elapsed > INACTIVITY_TIMEOUT_MS) {
              // Session expired — clear it
              await AsyncStorage.multiRemove([STORAGE_KEY, LAST_ACTIVE_KEY]);
              setIsLoading(false);
              return;
            }
          }
          setEmployee(JSON.parse(empStr));
        }
        if (lang === "ar" || lang === "fr") setLanguageState(lang);
      } catch {}
      setIsLoading(false);
    };
    load();
  }, []);

  // ─── Inactivity timer management ─────────────────────────────────────────
  const clearTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    inactivityTimer.current = setTimeout(() => {
      // Auto-logout after inactivity
      setEmployee(null);
      AsyncStorage.multiRemove([STORAGE_KEY, LAST_ACTIVE_KEY]).catch(() => {});
    }, INACTIVITY_TIMEOUT_MS);
  };

  const resetInactivityTimer = () => {
    if (employee) {
      startTimer();
      AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString()).catch(() => {});
    }
  };

  // Start timer when employee logs in
  useEffect(() => {
    if (employee) {
      startTimer();
      AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString()).catch(() => {});
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [employee]);

  // Handle app going to background / foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextState !== "active") {
        // App going to background — save timestamp
        AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString()).catch(() => {});
        clearTimer();
      } else if (appStateRef.current !== "active" && nextState === "active") {
        // App coming to foreground — check if session expired
        AsyncStorage.getItem(LAST_ACTIVE_KEY).then((lastActiveStr) => {
          if (lastActiveStr) {
            const elapsed = Date.now() - parseInt(lastActiveStr, 10);
            if (elapsed > INACTIVITY_TIMEOUT_MS) {
              setEmployee(null);
              AsyncStorage.multiRemove([STORAGE_KEY, LAST_ACTIVE_KEY]).catch(() => {});
            } else if (employee) {
              startTimer();
            }
          }
        }).catch(() => {});
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [employee]);

  // ─── Auth actions ─────────────────────────────────────────────────────────
  const loginEmployee = async (emp: AdminEmployee) => {
    setEmployee(emp);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  };

  const logoutEmployee = async () => {
    clearTimer();
    setEmployee(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, LAST_ACTIVE_KEY]);
  };

  const setLanguage = async (lang: AdminLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  };

  return (
    <AdminContext.Provider value={{
      employee, isLoading, language,
      loginEmployee, logoutEmployee, setLanguage,
      resetInactivityTimer,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
