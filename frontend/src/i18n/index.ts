import { en } from "./locales/en";
import { de } from "./locales/de";
import type { Messages } from "./locales/types";

export type Locale = "de" | "en";

export const locales: Locale[] = ["de", "en"];

export const localeLabels: Record<Locale, string> = {
  de: "DE",
  en: "EN",
};

const dictionaries: Record<Locale, Messages> = { de, en };

type Path = string;

function getByPath(obj: unknown, path: Path): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function translate(
  locale: Locale,
  key: Path,
  params?: Record<string, string | number>,
): string {
  const value = getByPath(dictionaries[locale], key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  return key;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "de";
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

export function localizeExplanation(explanation: string, locale: Locale): string {
  if (locale === "de") return explanation;

  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [
      /^Die nächstgelegene Tankstelle ist auch die günstigste Option\.$/,
      () => translate("en", "station.nearestBest"),
    ],
    [
      /^Alle Optionen haben ähnliche Gesamtkosten\.$/,
      () => translate("en", "station.similarCosts"),
    ],
    [
      /^Fahre ([\d.]+) km weiter und spare €([\d.]+) gegenüber der nächsten Tankstelle\. Verkehr und Route wurden berücksichtigt\.$/,
      (m) =>
        translate("en", "station.driveFurtherSavePremium", {
          extra: m[1],
          savings: m[2],
        }),
    ],
    [
      /^Fahre ([\d.]+) km weiter und spare €([\d.]+) gegenüber der nächsten Tankstelle\.$/,
      (m) =>
        translate("en", "station.driveFurtherSave", {
          extra: m[1],
          savings: m[2],
        }),
    ],
    [
      /^Premium-Routing: ([\d.]+) km Umweg berücksichtigt\.$/,
      (m) => translate("en", "station.premiumRouting", { extra: m[1] }),
    ],
    [
      /^Routen-Optimierung: ([\d.]+) km Umweg entlang deiner Route\.$/,
      (m) => translate("en", "station.routeOptimization", { extra: m[1] }),
    ],
    [
      /^Optimaler Tankstopp entlang deiner Route: ([\d.]+) km Umweg und €([\d.]+) Ersparnis gegenüber dem nächsten Stopp\. Verkehr und Route wurden berücksichtigt\.$/,
      (m) =>
        translate("en", "station.routeStopSave", {
          extra: m[1],
          savings: m[2],
        }),
    ],
    [
      /^Die optimale Tankstelle entlang deiner Route ist auch die günstigste Option\.$/,
      () => translate("en", "station.routeBest"),
    ],
  ];

  for (const [pattern, replacer] of patterns) {
    const match = explanation.match(pattern);
    if (match) return replacer(match);
  }

  return explanation;
}

const predictionMessageMap: Record<string, keyof Messages["predictionMessages"]> = {
  "Wir sammeln noch Preisdaten. Schau in ein paar Tagen wieder vorbei.": "collecting",
  "Preise steigen tendenziell. Jetzt tanken könnte günstiger sein.": "rising",
  "Preise sinken tendenziell. Warten könnte sich lohnen.": "falling",
  "Preise sind stabil. Tanken wenn du es brauchst.": "stable",
  "Aktueller Durchschnittspreis in deiner Nähe — Trenddaten werden noch aufgebaut.": "collectingLive",
};

export function localizePredictionMessage(message: string, locale: Locale): string {
  if (locale === "de") return message;
  const key = predictionMessageMap[message];
  if (key) return translate("en", `predictionMessages.${key}`);
  return message;
}

export function getUpgradeFeatures(locale: Locale): string[] {
  const features = dictionaries[locale].upgrade.features;
  return Array.isArray(features) ? [...features] : [];
}
