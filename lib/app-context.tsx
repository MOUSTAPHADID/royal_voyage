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
};

type AppContextType = {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  // Bookings
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
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
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [lastFlightSearch, setLastFlightSearch] = useState<FlightSearch | null>(null);
  const [lastHotelSearch, setLastHotelSearch] = useState<HotelSearch | null>(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedBookings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS),
      ]);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedBookings) setBookings(JSON.parse(storedBookings));
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock login — accept any credentials
    const mockUser: User = {
      id: "u1",
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      phone: "+212 6 00 00 00 00",
      nationality: "Moroccan",
    };
    setUser(mockUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    const newUser: User = {
      id: "u" + Date.now(),
      name,
      email,
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

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        bookings,
        addBooking,
        cancelBooking,
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
