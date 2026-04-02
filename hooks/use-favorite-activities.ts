import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@royal_voyage_favorite_activities";

export interface FavoriteActivity {
  code: string;
  name: string;
  image: string;
  minPrice: number;
  currency: string;
  category?: string;
  duration?: string;
  destinationCode?: string;
  destName?: string;
}

export function useFavoriteActivities() {
  const [favorites, setFavorites] = useState<FavoriteActivity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setFavorites(JSON.parse(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  // Save favorites to AsyncStorage whenever they change
  const saveFavorites = useCallback(async (updated: FavoriteActivity[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const isFavorite = useCallback(
    (code: string) => favorites.some((f) => f.code === code),
    [favorites]
  );

  const addFavorite = useCallback(
    (activity: FavoriteActivity) => {
      setFavorites((prev) => {
        if (prev.some((f) => f.code === activity.code)) return prev;
        const updated = [activity, ...prev];
        saveFavorites(updated);
        return updated;
      });
    },
    [saveFavorites]
  );

  const removeFavorite = useCallback(
    (code: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.code !== code);
        saveFavorites(updated);
        return updated;
      });
    },
    [saveFavorites]
  );

  const toggleFavorite = useCallback(
    (activity: FavoriteActivity) => {
      if (isFavorite(activity.code)) {
        removeFavorite(activity.code);
        return false;
      } else {
        addFavorite(activity);
        return true;
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    isLoaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
