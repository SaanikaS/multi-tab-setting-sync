import "./style.css";
import { ChangeInfo, FONT_MAX, FONT_MIN, Language, LANGUAGES, Preferences } from "./settings/types";
import { PreferenceStore } from "./settings/store";
import { LANGUAGE_NAMES, strings } from "./i18n";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app element");

app.innerHTML = `
  <main class="panel">
    <h1 id="title"></h1>

    <label class="row">
      <span id="label-theme"></span>
      <input id="theme" class="switch" type="checkbox" role="switch" />
    </label>

    <label class="row">
      <span id="label-language"></span>
      <select id="language">
        ${LANGUAGES.map((code) => `<option value="${code}">${LANGUAGE_NAMES[code]}</option>`).join("")}
      </select>
    </label>

    <label class="row stack">
      <span>
        <span id="label-font"></span>
        <output id="font-value" for="fontSize"></output>
      </span>
      <input id="fontSize" type="range" min="${FONT_MIN}" max="${FONT_MAX}" step="1" />
    </label>

    <p id="preview" class="preview"></p>
    <p id="status" class="status" aria-live="polite"></p>
  </main>
`;

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

const themeInput = $<HTMLInputElement>("theme");
const languageSelect = $<HTMLSelectElement>("language");
const fontInput = $<HTMLInputElement>("fontSize");
const fontOutput = $<HTMLOutputElement>("font-value");
const statusEl = $<HTMLParagraphElement>("status");

/** Mirrors the preferences onto the page: theme, language and font size. */
function applyToDocument(p: Preferences): void {
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.lang = p.language;
  root.style.setProperty("--base-font-size", `${p.fontSize}px`);
}

function render(p: Preferences, info?: ChangeInfo): void {
  applyToDocument(p);
  const s = strings(p.language as Language);

  $("title").textContent = s.title;
  $("label-theme").textContent = s.theme;
  $("label-language").textContent = s.language;
  $("label-font").textContent = s.fontSize;
  $("preview").textContent = s.preview;

  themeInput.checked = p.theme === "dark";
  languageSelect.value = p.language;
  fontInput.value = String(p.fontSize);
  fontOutput.textContent = `${p.fontSize}px`;

  // Keep the last status message when this tab made the change itself.
  if (info?.source === "remote" && info.latencyMs !== undefined) {
    statusEl.textContent = s.syncLatency.replace("{ms}", String(Math.max(0, Math.round(info.latencyMs))));
  } else if (info?.source === "storage") {
    statusEl.textContent = s.syncReceived;
  } else if (info?.source !== "local") {
    statusEl.textContent = s.syncNone;
  }
}

const store = new PreferenceStore();

themeInput.addEventListener("change", () => {
  store.set("theme", themeInput.checked ? "dark" : "light");
});

languageSelect.addEventListener("change", () => {
  store.set("language", languageSelect.value as Language);
});

fontInput.addEventListener("input", () => {
  store.set("fontSize", Number(fontInput.value));
});

store.subscribe(render);
render(store.preferences);
