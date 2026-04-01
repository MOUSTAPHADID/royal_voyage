import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppCurrency, formatCurrency } from "./currency";

const STORAGE_KEY = "@royal_voyage_currency";

type CurrencyContextType = {
  currency: AppCurrency;
  setCurrency: (c: AppCurrency) => void;
  /** تنسيق مبلغ (بالأوقية) بالعملة المختارة */
  fmt: (amountMRU: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  fmt: (a) => `$${(a / 40.08).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<AppCurrency>("USD");

  // تحميل العملة المحفوظة عند بدء التطبيق
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && ["MRU", "USD", "EUR", "AOA"].includes(saved)) {
        setCurrencyState(saved as AppCurrency);
      }
    });
  }, []);

  const setCurrency = useCallback(async (c: AppCurrency) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(STORAGE_KEY, c);
  }, []);

  const fmt = useCallback(
    (amountMRU: number) => formatCurrency(amountMRU, currency),
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
