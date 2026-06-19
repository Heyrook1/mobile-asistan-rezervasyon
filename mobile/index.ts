import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";
import { initMonitoring } from "./src/lib/monitoring";

if (Platform.OS === "web") {
  enableScreens(false);
} else {
  require("react-native-gesture-handler");
}

void initMonitoring();

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
