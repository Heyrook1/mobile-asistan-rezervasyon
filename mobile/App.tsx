import { Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/state/AuthContext";
import { NetworkProvider } from "./src/state/NetworkContext";
import { FavoritesProvider } from "./src/state/FavoritesContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { CookieConsentBanner } from "./src/components/CookieConsentBanner";
import { OfflineBanner } from "./src/components/OfflineBanner";

const Root = Platform.OS === "web" ? View : GestureHandlerRootView;

export default function App() {
  return (
    <Root style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <NetworkProvider>
            <AuthProvider>
              <FavoritesProvider>
                <StatusBar style="dark" />
                <OfflineBanner />
                <RootNavigator />
                <CookieConsentBanner />
              </FavoritesProvider>
            </AuthProvider>
          </NetworkProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </Root>
  );
}
