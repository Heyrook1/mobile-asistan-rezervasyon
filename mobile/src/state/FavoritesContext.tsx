import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/client";
import { FavoriteItem } from "../api/types";
import { useAuth } from "./AuthContext";

type FavoritesState = {
  favoriteIds: Set<string>;
  items: FavoriteItem[];
  loading: boolean;
  isFavorite: (businessId: string) => boolean;
  toggleFavorite: (businessId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesState | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { phase, clientUser } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (phase !== "ready") return;
    setLoading(true);
    try {
      const list = await api.listFavorites();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "ready" && clientUser) void refresh();
    if (phase === "unauthenticated") setItems([]);
  }, [phase, clientUser?.id, refresh]);

  const favoriteIds = useMemo(() => new Set(items.map((f) => f.businessId)), [items]);

  const isFavorite = useCallback(
    (businessId: string) => favoriteIds.has(businessId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(async (businessId: string) => {
    const res = await api.toggleFavorite(businessId);
    await refresh();
    return res.favorited;
  }, [refresh]);

  const value = useMemo<FavoritesState>(
    () => ({
      favoriteIds,
      items,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    }),
    [favoriteIds, items, loading, isFavorite, toggleFavorite, refresh]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
