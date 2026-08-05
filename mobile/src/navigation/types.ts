export type HomeStackParamList = {
  HomeMap: undefined;
  StationDetail: { stationId: number };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Premium: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  Insights: undefined;
  Favorites: undefined;
  Alerts: undefined;
  ProfileTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}
