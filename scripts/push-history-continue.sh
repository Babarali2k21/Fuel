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

# Frontend scaffold (partially staged from interrupted run)
commit "feat(frontend): scaffold Next.js application" \
  frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/next.config.ts frontend/postcss.config.mjs frontend/eslint.config.mjs frontend/Dockerfile frontend/vercel.json frontend/.gitignore frontend/public frontend/README.md

commit "feat(frontend): add app layout, styling, and middleware" \
  frontend/src/app/layout.tsx frontend/src/app/globals.css frontend/src/app/favicon.ico frontend/src/middleware.ts frontend/src/components/Providers.tsx frontend/src/components/CookieNotice.tsx

commit "feat(frontend): add i18n support for English and German" \
  frontend/src/i18n frontend/src/components/LanguageSwitcher.tsx

commit "feat(frontend): add API client and Zustand store" \
  frontend/src/lib/api.ts frontend/src/lib/features.ts frontend/src/lib/subscription.ts frontend/src/store/useAppStore.ts

commit "feat(frontend): add shared UI components" \
  frontend/src/components/ui.tsx frontend/src/components/BottomBar.tsx frontend/src/components/Header.tsx frontend/src/components/StationList.tsx frontend/src/components/AuthPrompt.tsx frontend/src/components/AuthPageShell.tsx frontend/src/lib/clerkAppearance.ts

commit "feat(frontend): add home page with fuel recommendations" \
  frontend/src/app/page.tsx frontend/src/components/UserInputs.tsx frontend/src/components/RecommendationCard.tsx

commit "feat(frontend): add Clerk authentication pages" \
  frontend/src/app/sign-in frontend/src/app/sign-up frontend/src/app/privacy/page.tsx

commit "feat(frontend): add upgrade and subscription flow" \
  frontend/src/app/upgrade/page.tsx frontend/src/components/SubscriptionSection.tsx frontend/src/components/PremiumLock.tsx

commit "feat(frontend): add settings and vehicle profiles" \
  frontend/src/app/settings/page.tsx frontend/src/components/SavedVehicles.tsx

commit "feat(frontend): add savings dashboard with charts" \
  frontend/src/app/dashboard/page.tsx frontend/src/components/SavingsChart.tsx frontend/src/components/PriceSparkline.tsx

commit "feat(frontend): add fuel logbook with export" \
  frontend/src/app/logbook/page.tsx frontend/src/lib/logbook.ts frontend/src/lib/logbook-export.ts frontend/src/components/logbook

commit "feat(frontend): add address autocomplete and route planning" \
  frontend/src/components/AddressAutocomplete.tsx frontend/src/components/RouteOptimizationBanner.tsx

commit "feat(frontend): add premium feature gates and prediction UI" \
  frontend/src/hooks/usePremiumAccess.ts frontend/src/components/PremiumFeatureGate.tsx frontend/src/components/PricePrediction.tsx

commit "feat(frontend): show station hours, toilets, and maps links" \
  frontend/src/lib/station-utils.ts

commit "feat(mobile): scaffold Expo React Native application" \
  mobile/package.json mobile/package-lock.json mobile/tsconfig.json mobile/app.json mobile/babel.config.js mobile/index.ts mobile/App.tsx mobile/.gitignore mobile/.env.example mobile/assets mobile/LICENSE

commit "feat(mobile): add design system and Zustand store" \
  mobile/src/theme mobile/src/store/useAppStore.ts mobile/src/types/station.ts mobile/src/lib/config.ts

commit "feat(mobile): add reusable UI components" \
  mobile/src/components/Button.tsx mobile/src/components/Card.tsx mobile/src/components/PriceTag.tsx mobile/src/components/StationItem.tsx mobile/src/components/BottomSheet.tsx mobile/src/components/TabBar.tsx mobile/src/components/FuelTypeSelector.tsx

commit "feat(mobile): add navigation with bottom tabs" \
  mobile/src/navigation

commit "feat(mobile): add core app screens" \
  mobile/src/screens/HomeScreen.tsx mobile/src/screens/StationDetailScreen.tsx mobile/src/screens/ProfileScreen.tsx mobile/src/screens/PremiumScreen.tsx

commit "feat(mobile): add insights, favorites, and alerts screens" \
  mobile/src/screens/InsightsScreen.tsx mobile/src/screens/FavoritesScreen.tsx mobile/src/screens/AlertsScreen.tsx

commit "feat(mobile): connect to live API, location, and real map" \
  mobile/src/lib/api.ts mobile/src/hooks mobile/src/components/StationMap.tsx

commit "chore: add agent docs, scripts, and shared folder" \
  frontend/AGENTS.md frontend/CLAUDE.md mobile/AGENTS.md mobile/CLAUDE.md mobile/.claude/settings.json scripts shared

echo ""
echo "Done! Total commits: $(git rev-list --count HEAD)"
git status --short
