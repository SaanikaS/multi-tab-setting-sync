import { Language } from "./settings/types";

export interface Strings {
  title: string;
  theme: string;
  language: string;
  fontSize: string;
  preview: string;
  syncNone: string;
  syncReceived: string;
  /** Contains the placeholder {ms}. */
  syncLatency: string;
}

/** Language names are written in their own language so each one is recognizable. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ta: "தமிழ்",
};

const STRINGS: Record<Language, Strings> = {
  en: {
    title: "Preferences",
    theme: "Dark mode",
    language: "Language",
    fontSize: "Font size",
    preview: "Settings sync across every open tab and are kept after you close the browser.",
    syncNone: "No changes from other tabs yet.",
    syncReceived: "Updated from another tab.",
    syncLatency: "Last change from another tab arrived in {ms} ms.",
  },
  es: {
    title: "Preferencias",
    theme: "Modo oscuro",
    language: "Idioma",
    fontSize: "Tamaño de letra",
    preview: "La configuración se sincroniza en todas las pestañas abiertas y se conserva al cerrar el navegador.",
    syncNone: "Aún no hay cambios desde otras pestañas.",
    syncReceived: "Actualizado desde otra pestaña.",
    syncLatency: "El último cambio de otra pestaña llegó en {ms} ms.",
  },
  fr: {
    title: "Préférences",
    theme: "Mode sombre",
    language: "Langue",
    fontSize: "Taille du texte",
    preview: "Les réglages se synchronisent dans tous les onglets ouverts et sont conservés après la fermeture du navigateur.",
    syncNone: "Aucune modification depuis les autres onglets.",
    syncReceived: "Mis à jour depuis un autre onglet.",
    syncLatency: "La dernière modification d’un autre onglet est arrivée en {ms} ms.",
  },
  de: {
    title: "Einstellungen",
    theme: "Dunkler Modus",
    language: "Sprache",
    fontSize: "Schriftgröße",
    preview: "Einstellungen werden in allen geöffneten Tabs synchronisiert und nach dem Schließen des Browsers gespeichert.",
    syncNone: "Noch keine Änderungen aus anderen Tabs.",
    syncReceived: "Aus einem anderen Tab aktualisiert.",
    syncLatency: "Die letzte Änderung aus einem anderen Tab kam in {ms} ms an.",
  },
  ta: {
    title: "விருப்பங்கள்",
    theme: "இருண்ட பயன்முறை",
    language: "மொழி",
    fontSize: "எழுத்தின் அளவு",
    preview: "திறந்துள்ள அனைத்து தாவல்களிலும் அமைப்புகள் ஒத்திசைக்கப்படும்; உலாவியை மூடிய பிறகும் அவை சேமிக்கப்படும்.",
    syncNone: "பிற தாவல்களிலிருந்து இன்னும் மாற்றங்கள் இல்லை.",
    syncReceived: "பிற தாவலிலிருந்து புதுப்பிக்கப்பட்டது.",
    syncLatency: "பிற தாவலிலிருந்து கடைசி மாற்றம் {ms} மி.வினாடியில் வந்தது.",
  },
};

export function strings(lang: Language): Strings {
  return STRINGS[lang];
}
