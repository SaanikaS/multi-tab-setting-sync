# Multi-Tab Settings Synchronization

A TypeScript web app where user preferences (dark mode, language and font size) stay in sync across every open browser tab in real time, persist across restarts, and converge deterministically when tabs edit at the same time.

**Live demo:** `https://<your-username>.github.io/<your-repo>/` (see [Deployment](#deployment))

---

## Requirements

- Node.js 18.18 or newer (Node 20 LTS recommended)
- npm (comes with Node)
- Git
- A modern browser (Chrome, Edge, Firefox, Safari)

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## Setup and run locally

```bash
# 1. Install dependencies (creates node_modules/ and package-lock.json)
npm install

# 2. Run the unit tests
npm test

# 3. Start the dev server
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

**Try the sync:** open the app in two or three tabs side by side. Change the theme, the language or the font size in one tab. The other tabs update within a few milliseconds, and the status line under the controls shows the measured latency. Close every tab, reopen the app, and your settings are still there.

### Production build

```bash
npm run build      # type-checks with tsc, then bundles into dist/
npm run preview    # serves dist/ locally to check the production build
```

---

## Push the project to your GitHub repository

Run these from the project folder (`multi-tab-settings-sync/`).

**If you do not have a repository yet:** create an empty one on github.com (New repository, no README, no .gitignore, no license), then copy its URL.

```bash
# Initialize git (skip if the folder is already a repository)
git init
git branch -M main

# Stage everything (node_modules/ and dist/ are ignored by .gitignore)
git add .

# Commit
git commit -m "Implement multi-tab settings synchronization"

# Connect to your repository (replace the URL with yours)
git remote add origin https://github.com/<your-username>/<your-repo>.git

# Push
git push -u origin main
```

If you already cloned your repository, copy the project files into it, then run:

```bash
git add .
git commit -m "Add multi-tab settings synchronization"
git push
```

If `git remote add` says the remote already exists, run `git remote set-url origin <URL>` instead.

---

## Deployment

The included workflow (`.github/workflows/deploy.yml`) runs the tests, builds the app and publishes it to GitHub Pages every time you push to `main`.

1. On GitHub, open your repository and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or open the **Actions** tab and run "Test and deploy to GitHub Pages" manually).
4. When the run turns green, the live link appears in the job summary and at `https://<your-username>.github.io/<your-repo>/`.

Any static host works as well (Vercel, Netlify, Cloudflare Pages). Upload the `dist/` folder, or connect the repository.

---

## Project structure

```
multi-tab-settings-sync/
├── index.html                  Entry page; pre-paint script applies the saved theme
├── src/
│   ├── main.ts                 UI: builds the controls and wires them to the store
│   ├── style.css               Light and dark palettes, responsive layout
│   ├── i18n.ts                 Translations for English, Spanish, French, German, Tamil
│   └── settings/
│       ├── types.ts            Preference types, defaults, storage key, message types
│       ├── merge.ts            Pure conflict-resolution logic (no browser APIs)
│       ├── merge.test.ts       Unit tests for convergence and validation
│       └── store.ts            Persistence and cross-tab transport
├── .github/workflows/deploy.yml  Test, build and deploy to GitHub Pages
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## Technical explanation

### Preferences

There are three settings: `theme` (`light` or `dark`), `language` (one of five supported codes) and `fontSize` (an integer from 12 to 24 px). Each value is validated on the way in and again on the way out, so invalid data from storage or another tab is ignored.

### Real-time synchronization (latency target: under 100 ms)

Each tab keeps a full copy of the state. When a user changes a setting, the store does three things:

1. Updates its local copy.
2. Writes the copy to `localStorage`.
3. Posts the copy to a `BroadcastChannel`, a same-origin message bus that delivers to every other open tab directly, without a page reload.

The message includes the time it was sent, so the receiving tab can measure the delay. On a single machine this is typically a few milliseconds. For browsers without `BroadcastChannel`, the `storage` event (fired in other tabs whenever `localStorage` changes) carries the same state, so sync still works.

### Conflict resolution

Every preference is a separate last-writer-wins register. Each write carries:

- a **Lamport clock**: when a tab edits a setting, it sets the clock to one more than the highest clock it has seen for any setting. The edit therefore always supersedes everything that tab had already observed.
- a **writer id**: a random ID generated once per tab.

When two states are merged, the register with the higher `(clock, writer)` pair wins. The clock decides the order of causally related edits. The writer id only decides truly simultaneous edits, and every tab applies the same comparison, so all tabs pick the same winner.

Because this merge is commutative, associative and idempotent, the tabs converge to identical values no matter the order in which messages arrive or whether a message is received twice. Each channel can deliver the same update, and the merge still produces the same result.

Conflicts are resolved per setting. If one tab changes the theme while another changes the font size, both changes survive. If two tabs change the theme at once, exactly one value wins, and every tab shows it.

### Persistence and startup

The full state is stored under the `prefs-sync:v1` key in `localStorage`. A new tab reads it before the first paint: the inline script in `index.html` applies the saved theme, font size and language to the document, so the page never flashes the wrong theme. Then the store merges the saved state with defaults and the UI renders. Settings survive closing every tab and restarting the browser.

### Limitations

- Sync works only within one browser profile and origin. It does not sync across devices. That would need a server.
- `localStorage` holds about 5 MB per origin. These settings take a few hundred bytes.
- Each setting is one register, so there is no merge inside a single value. This is correct for scalar settings.
- Tab IDs are random and not tied to a user, which is fine because nothing is authenticated.

---

## Scripts

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start the development server with hot reload     |
| `npm test`        | Run the unit tests once                          |
| `npm run build`   | Type-check and build the production bundle       |
| `npm run preview` | Serve the production build locally               |
