import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { setNetworkOnline, isNetworkOnline } from "../lib/network";
import { flushAnalytics } from "../lib/analytics";

type NetworkState = {
  isOnline: boolean;
};

const NetworkContext = createContext<NetworkState>({ isOnline: true });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (Platform.OS === "web") {
      const sync = () => {
        const next =
          typeof navigator !== "undefined" ? navigator.onLine !== false : true;
        setIsOnline(next);
        setNetworkOnline(next);
        if (next) flushAnalytics();
      };
      sync();
      window.addEventListener("online", sync);
      window.addEventListener("offline", sync);
      unsubscribe = () => {
        window.removeEventListener("online", sync);
        window.removeEventListener("offline", sync);
      };
    } else {
      void import("@react-native-community/netinfo").then((NetInfo) => {
        const sub = NetInfo.default.addEventListener((state) => {
          const next = state.isConnected !== false && state.isInternetReachable !== false;
          setIsOnline(next);
          setNetworkOnline(next);
          if (next) flushAnalytics();
        });
        unsubscribe = () => sub();
      });
    }

    return () => unsubscribe?.();
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}

export { isNetworkOnline };
