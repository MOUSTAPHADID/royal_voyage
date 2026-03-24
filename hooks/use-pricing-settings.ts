import { useState, useEffect } from "react";
import {
  PricingSettings,
  loadPricingSettings,
  subscribePricingSettings,
  getPricingSettings,
} from "@/lib/pricing-settings";

/**
 * Hook لقراءة إعدادات الأسعار والاشتراك في تحديثاتها
 */
export function usePricingSettings(): PricingSettings {
  const [settings, setSettings] = useState<PricingSettings>(getPricingSettings());

  useEffect(() => {
    // تحميل الإعدادات من AsyncStorage عند أول تشغيل
    loadPricingSettings().then(setSettings);
    // الاشتراك في التحديثات
    const unsub = subscribePricingSettings(setSettings);
    return unsub;
  }, []);

  return settings;
}
