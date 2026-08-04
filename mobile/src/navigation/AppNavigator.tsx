import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { TabBar } from "../components/TabBar";
import { HomeStackParamList, ProfileStackParamList, TabParamList } from "./types";
import { AlertsScreen } from "../screens/AlertsScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { PremiumScreen } from "../screens/PremiumScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { StationDetailScreen } from "../screens/StationDetailScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="StationDetail"
        component={StationDetailScreen}
        options={{ title: "Station details" }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ title: "Premium" }}
      />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ headerShown: false, title: "Home" }}
      />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: "Insights" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favorites" }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: "Alerts" }} />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ headerShown: false, title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainTabs />
    </NavigationContainer>
  );
}
