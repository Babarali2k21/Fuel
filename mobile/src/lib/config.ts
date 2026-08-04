import { Platform } from "react-native";

function getDefaultApiUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "http://localhost:8000";
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();
