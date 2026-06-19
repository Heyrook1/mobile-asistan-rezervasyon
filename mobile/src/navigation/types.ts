import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Provider, AppointmentRow } from "../api/types";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  ProviderDetail: { staffId: string; preview?: Provider };
  Clinic: { businessId: string; name?: string };
  Booking: { provider: Provider; serviceId?: string };
  Reschedule: { appointment: AppointmentRow };
  Notifications: undefined;
  Favorites: undefined;
};

export type TabsParamList = {
  Home: undefined;
  Search: { specialty?: string; query?: string } | undefined;
  Appointments: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export type SearchScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, "Search">,
  NativeStackScreenProps<RootStackParamList>
>;
