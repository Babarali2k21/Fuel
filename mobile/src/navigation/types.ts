export type HomeStackParamList = {
  Home: undefined;
  StationDetail: { stationId: number };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Premium: undefined;
};

export type TabParamList = {
  Home: undefined;
  Insights: undefined;
  Favorites: undefined;
  Alerts: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}
