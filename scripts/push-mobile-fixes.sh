#!/bin/bash
set -euo pipefail

ROOT="/Users/alienware/Projects/fuel"
DELAY="${COMMIT_DELAY:-3}"
cd "$ROOT"

commit() {
  local msg="$1"
  shift
  git add "$@"
  git commit -m "$msg"
  echo "✓ $msg"
  sleep "$DELAY"
}

commit "fix(mobile): add react-native-worklets peer dependency" \
  mobile/package.json mobile/package-lock.json

commit "fix(mobile): add expo-splash-screen plugin" \
  mobile/app.json

commit "fix(mobile): import gesture handler at app entry point" \
  mobile/index.ts

commit "fix(mobile): wrap app with safe area and bottom sheet providers" \
  mobile/App.tsx

commit "fix(mobile): resolve duplicate navigation screen names" \
  mobile/src/navigation/types.ts mobile/src/navigation/AppNavigator.tsx

commit "fix(mobile): update tab bar labels for renamed routes" \
  mobile/src/components/TabBar.tsx

commit "fix(mobile): fix favorites screen navigation target" \
  mobile/src/screens/FavoritesScreen.tsx

commit "fix(mobile): update profile screen stack param type" \
  mobile/src/screens/ProfileScreen.tsx

commit "fix(mobile): overlay map and bottom sheet on home screen" \
  mobile/src/screens/HomeScreen.tsx

commit "fix(mobile): use native map pins for iOS reliability" \
  mobile/src/components/StationMap.tsx

commit "fix(mobile): improve bottom sheet safe area and list layout" \
  mobile/src/components/BottomSheet.tsx

echo ""
echo "Created $(git rev-list --count HEAD) total commits."
