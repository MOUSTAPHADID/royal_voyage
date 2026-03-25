import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Booking, MOCK_BOOKINGS } from "./mock-data";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  nationality?: string;
  passportNumber?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  expoPushToken?: string;
};

// Admin credentials — stored only in app logic, never shown to customers
const ADMIN_EMAIL = "admin@royalvoyage.mr";
const ADMIN_PASSWORD = "RV@Admin2024!";

type AppContextType = {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<"admin" | "user" | false>;
  loginWithPhone: (phone: string) => Promise<"user" | false>;
  loginAsGuest: () => Promise<void>;
  register: (name: string, phone: string, email?: string) => Promise<boolean>;
  sendVerificationCode: (phone: string) => Promise<string>;
  verifyCode: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  // Bookings
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
  updateBookingPnr: (id: string, realPnr: string) => void;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;
  updateBookingTicketNumber: (id: string, ticketNumber: string) => void;
  updateBookingTicketSent: (id: string) => void;
  confirmBookingPayment: (id: string) => void;
  rejectBookingPayment: (id: string, reason: string) => void;
  updateBookingReceipt: (id: string, receiptImage: string) => void;
  updateBookingCheckin: (id: string, seatNumber: string, seatPreference: "window" | "middle" | "aisle", boardingGroup: string) => void;
  saveExpoPushToken: (token: string) => void;
  expoPushToken: string | null;
  saveAdminPushToken: (token: string) => void;
  adminPushToken: string | null;
  // Search state
  lastFlightSearch: FlightSearch | null;
  lastHotelSearch: HotelSearch | null;
  setLastFlightSearch: (s: FlightSearch) => void;
  setLastHotelSearch: (s: HotelSearch) => void;
};

export type FlightSearch = {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  tripType: "one-way" | "round-trip";
  class: "Economy" | "Business" | "First";
};

export type HotelSearch = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
};

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USER: "@royal_voyage_user",
  BOOKINGS: "@royal_voyage_bookings",
  EXPO_PUSH_TOKEN: "@royal_voyage_expo_push_token",
  ADMIN_PUSH_TOKEN: "@royal_voyage_admin_push_token",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lastFlightSearch, setLastFlightSearch] = useState<FlightSearch | null>(null);
  const [lastHotelSearch, setLastHotelSearch] = useState<HotelSearch | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [adminPushToken, setAdminPushToken] = useState<string | null>(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedBookings, storedToken, storedAdminToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS),
        AsyncStorage.getItem(STORAGE_KEYS.EXPO_PUSH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PUSH_TOKEN),
      ]);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedBookings) setBookings(JSON.parse(storedBookings));
      if (storedToken) setExpoPushToken(storedToken);
      if (storedAdminToken) setAdminPushToken(storedAdminToken);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Store pending verification codes
  const verificationCodes = React.useRef<Record<string, string>>({});

  const login = useCallback(async (emailOrPhone: string, password: string): Promise<"admin" | "user" | false> => {
    // Admin login check
    if (emailOrPhone.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: "admin",
        name: "مدير Royal Voyage",
        email: ADMIN_EMAIL,
        isAdmin: true,
      };
      setUser(adminUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser));
      return "admin";
    }
    // Regular customer login — accept any credentials
    const isPhone = /^[+\d]/.test(emailOrPhone) && !emailOrPhone.includes("@");
    const mockUser: User = {
      id: "u" + Date.now(),
      name: isPhone ? "" : emailOrPhone.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: isPhone ? "" : emailOrPhone,
      phone: isPhone ? emailOrPhone : undefined,
    };
    setUser(mockUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return "user";
  }, []);

  const loginWithPhone = useCallback(async (phone: string): Promise<"user" | false> => {
    const phoneUser: User = {
      id: "u" + Date.now(),
      name: "",
      email: "",
      phone,
    };
    setUser(phoneUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(phoneUser));
    return "user";
  }, []);

  const loginAsGuest = useCallback(async () => {
    const guestUser: User = {
      id: "guest_" + Date.now(),
      name: "ضيف",
      email: "",
      isGuest: true,
    };
    setUser(guestUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guestUser));
  }, []);

  const sendVerificationCode = useCallback(async (phone: string): Promise<string> => {
    // Generate a 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));
    verificationCodes.current[phone] = code;
    // Send via local push notification
    try {
      const { scheduleLocalNotification } = await import("@/lib/push-notifications");
      await scheduleLocalNotification(
        "رمز التحقق - Royal Voyage",
        `رمز التحقق الخاص بك: ${code}`,
        { type: "verification", code }
      );
    } catch {}
    return code;
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string): Promise<boolean> => {
    const stored = verificationCodes.current[phone];
    if (stored && stored === code) {
      delete verificationCodes.current[phone];
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, phone: string, email?: string): Promise<boolean> => {
    const newUser: User = {
      id: "u" + Date.now(),
      name,
      email: email || "",
      phone,
    };
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  }, [user]);

  const addBooking = useCallback(async (booking: Booking) => {
    const updated = [booking, ...bookings];
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const cancelBooking = useCallback(async (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "cancelled" as const } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingPnr = useCallback(async (id: string, realPnr: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, realPnr: realPnr.toUpperCase().trim(), realPnrUpdatedAt: now } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingStatus = useCallback(async (id: string, status: Booking["status"]) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingTicketNumber = useCallback(async (id: string, ticketNumber: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, ticketNumber: ticketNumber.trim(), ticketNumberUpdatedAt: now } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingTicketSent = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, ticketSent: true, ticketSentAt: now } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const confirmBookingPayment = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, paymentConfirmed: true, paymentConfirmedAt: now, paymentRejected: false, paymentRejectedReason: undefined, paymentRejectedAt: undefined } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const rejectBookingPayment = useCallback(async (id: string, reason: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, paymentRejected: true, paymentRejectedReason: reason, paymentRejectedAt: now, paymentConfirmed: false, paymentConfirmedAt: undefined } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingReceipt = useCallback(async (id: string, receiptImage: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, receiptImage, receiptImageAt: now } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const updateBookingCheckin = useCallback(async (id: string, seatNumber: string, seatPreference: "window" | "middle" | "aisle", boardingGroup: string) => {
    const now = new Date().toISOString();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, checkedIn: true, checkedInAt: now, seatNumber, seatPreference, boardingGroup } : b
    );
    setBookings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  }, [bookings]);

  const saveExpoPushToken = useCallback(async (token: string) => {
    setExpoPushToken(token);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPO_PUSH_TOKEN, token);
  }, []);

  const saveAdminPushToken = useCallback(async (token: string) => {
    setAdminPushToken(token);
    await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PUSH_TOKEN, token);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithPhone,
        loginAsGuest,
        register,
        sendVerificationCode,
        verifyCode,
        logout,
        updateUser,
        bookings,
        addBooking,
        cancelBooking,
        updateBookingPnr,
        updateBookingStatus,
        updateBookingTicketNumber,
        updateBookingTicketSent,
        confirmBookingPayment,
        rejectBookingPayment,
        updateBookingReceipt,
        updateBookingCheckin,
        saveExpoPushToken,
        expoPushToken,
        saveAdminPushToken,
        adminPushToken,
        lastFlightSearch,
        lastHotelSearch,
        setLastFlightSearch,
        setLastHotelSearch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
