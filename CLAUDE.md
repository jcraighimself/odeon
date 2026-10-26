# Odeon

A tuner for stringed instruments, starting with guitar and ukulele, with multiple tunings for each. It starts as a web app and will become an offline app on my Android phone.

Odeon is part of a family of personal projects named after places in the ancient Greek world (Alexandria, Pergamum, Lyceum, Delphi). The Odeon was the building the Greeks used for musical performances.

`odeon-reference.md` is a broad-strokes guide written for the user (not for Claude). Keep it accurate when features change, in plain language and without code-level detail. This file is the technical reference.

## Working with the user

- **Claude writes the code, and the user makes the design decisions.** The user doesn't write code, but wants to shape the app. Ask for their input on how things look and behave, on trade-offs, and on naming, as often as makes sense. Batch small questions, and don't ask when the answer is obvious.
- **Go one step at a time.** Explain what the next step is and why, do that step, give a short "how to check it", then stop and wait for confirmation. Don't chain several steps together.
- **Never commit or push unless told to.** Commit messages are a short plain sentence ("Add the tuner screen"), no prefixes.
- **The user verifies changes in the browser** at `localhost:5173`. Don't start the dev server yourself (a throwaway one on another port for a quick check is fine; stop it after).
- **`.env` can't be read** (denied in `.claude/settings.json`).
- Explain things in plain terms. The user is a hobbyist, not a full-time dev. Their editor reformats on save, so point to code by function or identifier name rather than quoting a line.
- Record the user's design decisions under "Design decisions" below, including things that were tried and rejected.

## Goals

- Detect the pitch of a plucked string from the microphone and show how far it is from the target note.
- Support several instruments and several tunings per instrument, chosen on their own screens.
- Be fast and steady. The needle should settle quickly and not jitter.
- Work fully offline. No network calls, accounts, analytics or backend.
- Run on my Android phone. Phase 1 is an installable PWA. Phase 2 wraps the same code into an APK with Capacitor.

## Roadmap

### Phase 1: Web app / PWA (current)

- Microphone input through the Web Audio API (`getUserMedia` + `AnalyserNode` or an `AudioWorklet`).
- Pitch detection in the browser (see "Pitch detection" below).
- Chromatic mode: show the nearest note, octave, and cents sharp or flat.
- Instrument mode: tune to a selected instrument + tuning, with auto-detection of which string is being played and an option to lock to one string manually.
- Instruments and tunings at launch:
  - **Guitar:** Standard (E2 A2 D3 G3 B3 E4), Drop D, DADGAD, Open G, Open D, Half-step down.
  - **Ukulele:** Standard re-entrant (G4 C4 E4 A4), Low G (G3 C4 E4 A4), Baritone (D3 G3 B3 E4).
- Custom tunings: create, edit and delete my own tunings for any instrument.
- Screens: Tuner, Instrument/Tuning picker, Custom tuning editor, Settings.
- A tuning indicator (needle or bar) with an "in tune" state within ±5 cents.
- Adjustable reference pitch (A4 = 440 Hz by default, 430 to 450 Hz range).
- Installable PWA: web manifest, service worker that caches every asset, and full offline use after first load.
- Settings saved in `localStorage`.

### Phase 2: Android app

- Wrap the web build with Capacitor and produce an APK.
- Handle the Android microphone permission (`RECORD_AUDIO`).
- Keep the screen awake while tuning.
- No separate native codebase. The web code stays the single source of truth.

### Later (nice to have)

- More instruments (bass, mandolin, violin, banjo). Adding one should only mean adding data, not code.
- Optional reference tone playback for tuning by ear.
- Strobe-style display.

## Tech stack

- **TypeScript** with strict mode on.
- **Vite** for dev server and builds.
- **Svelte 5** for the UI. It's small, compiles away most of its runtime, and handles multiple screens and forms (the tuning editor) much more cleanly than plain DOM code. Canvas or SVG for the needle.
- **Hash-based routing** (`#/tuner`, `#/tunings`, ...) through a tiny router (e.g. `svelte-spa-router`) or a hand-rolled one. Don't use history-API routing; hash routes work without server config and inside Capacitor's WebView.
- **vite-plugin-pwa** (Workbox) for the manifest and service worker.
- **Vitest** for unit tests.
- **Capacitor** for the Android build in Phase 2.

Keep dependencies minimal. Ask before adding a runtime dependency.

TypeScript is pinned to 6.x because `svelte-check` doesn't support TypeScript 7 yet.

## Code conventions

- Run Prettier on every file you edit (`npx prettier --write <files>`, or `npm run format` for everything). Same settings as the other projects: no semicolons, single quotes, 100 columns, plus `prettier-plugin-svelte`.
- `.gitattributes` forces LF line endings.
- `noUncheckedIndexedAccess` is on in `tsconfig.json`, so array reads are `T | undefined`.

## Project structure

```
src/
  audio/        mic input, AudioWorklet, buffering
  pitch/        pitch detection algorithms (pure functions, no DOM)
  music/        note math: frequency <-> note, cents, string matching
  data/         instrument and tuning definitions (plain data)
  stores/       app state: selected instrument/tuning, settings, custom tunings
  screens/      Tuner, TuningPicker, TuningEditor, Settings
  components/   needle, note display, string selector, shared UI
  main.ts
public/         icons, manifest assets
tests/
```

Pitch detection and note math must be pure, framework-free modules with no DOM or Web Audio dependencies, so they can be unit tested and reused unchanged in the Android build.

## Instruments and tunings

Instruments and tunings are data, not code. Nothing outside `data/` should know which instruments exist.

```ts
type Instrument = {
  id: string // "guitar", "ukulele"
  name: string
  stringCount: number
  tunings: Tuning[]
}

type Tuning = {
  id: string // "standard", "drop-d", or a generated id for custom ones
  name: string
  notes: string[] // scientific pitch notation, lowest-numbered string first: ["E2","A2",...]
  custom?: boolean
}
```

- Store notes as names with octaves ("G4"), and compute frequencies from them using the current A4 setting.
- Ukulele standard tuning is **re-entrant**: the G4 string is higher than the C4 next to it. Never assume strings go from low to high pitch. When auto-detecting a string, match on nearest frequency, not on string order.
- Custom tunings are saved in `localStorage` with a schema version number, so the format can change later without breaking saved data.

## Pitch detection

- Use **YIN** or **McLeod Pitch Method (MPM)**. Do not use raw FFT peak picking. Guitar strings have strong harmonics, and FFT peak picking often locks onto the wrong octave.
- Set the detection range from the current instrument and tuning (lowest note minus some margin to highest note plus some margin), not from hard-coded guitar values. Chromatic mode uses a wide default range.
- The lowest notes need the biggest buffer: low E2 is 82.41 Hz, Drop D's D2 is 73.42 Hz. Use a buffer that captures several periods of the lowest note (2048 samples at 44.1/48 kHz is a reasonable start; consider 4096 for anything below D2).
- Ignore input below an RMS/volume threshold, so the needle doesn't react to silence or room noise.
- Smooth the output (median filter or exponential moving average) to stop jitter, without making it feel laggy.
- Do the analysis off the main thread when practical (AudioWorklet), so the UI stays smooth.

## Note math

- Cents from target: `1200 * log2(f / f_target)`.
- MIDI note from frequency: `69 + 12 * log2(f / A4)`.
- A4 is configurable. Never hard-code 440 outside the default setting.

## Testing

- Unit test pitch detection with synthetic signals: pure sines, and sines with added harmonics and noise, at every string frequency of every built-in tuning (generate the test cases from `data/`). Detection should be within ±1 cent on clean signals.
- Test string matching on the re-entrant ukulele tuning.
- Validate every built-in tuning: the number of notes matches the instrument's string count, and every note name parses.
- Unit test the note math (frequency to note, cents, edge cases near note boundaries).
- Run `npm test` before calling a task done.

## Commands

```
npm run dev       # dev server (the user runs this, not Claude)
npm run build     # production build
npm run preview   # serve the production build (use this to test the PWA/offline)
npm test          # vitest
npm run check     # svelte-check (TypeScript + Svelte type check)
npm run format    # Prettier on the whole project
```

## Gotchas

- `getUserMedia` only works on HTTPS or `localhost`. To test on my phone over the LAN, use Vite's `--host` with HTTPS (e.g. `@vitejs/plugin-basic-ssl`).
- Browsers start the `AudioContext` suspended. Start or resume it from a user gesture (a "Start tuning" button).
- Turn off browser audio processing on the mic stream: `echoCancellation`, `noiseSuppression` and `autoGainControl` all set to `false`. They distort the signal and hurt pitch accuracy.
- Read the real sample rate from the `AudioContext`. Don't assume 44100.
- The service worker must cache everything, including the AudioWorklet module file.

## Working style

- Mobile-first UI: large readable note name, high contrast, usable one-handed, works in portrait.
- Keep commits small and focused.
- When a decision affects the Phase 2 Android build, call it out.

## Design decisions (the user's calls, so don't undo them without asking)

- **Same visual family as the other projects** (2026-10-25): dark slate background, cards with 1px borders and 10px radius, DM Sans body + Josefin Sans display, colours as CSS variables on `:root`. See `../alexandria/client/src/styles/base.css` and `../lyceum/client/src/style.css`.
- **Accent colour: amber/gold** (2026-10-25), clear of Alexandria's green, Lyceum's blue and Delphi's violet. Green stays free to mean "in tune" on the needle. Exact shade still to pick when the UI is built.
- **Fonts are bundled with the app** (2026-10-25), not loaded from Google Fonts like the other projects, because Odeon must work offline.

## Current status

**Done**

- Project setup: Vite 8, Svelte 5, TypeScript, Vitest, svelte-check, Prettier. No runtime dependencies yet. `src/App.svelte` is a placeholder.
- `src/music/notes.ts`: note names ↔ MIDI ↔ frequency, cents, `nearestNote` (chromatic mode; cents in [-50, 50)). `src/music/reference.ts` holds `DEFAULT_A4` and the 430–450 range, the only place 440 appears.
- `src/music/strings.ts`: `matchString` (nearest string by cents, never by order), `tuningRange` (lowest note −5 semitones to highest +5), `CHROMATIC_RANGE` (30–1600 Hz).
- `src/data/`: types, the nine built-in tunings, `getInstrument` / `getTuning`, and `validateTuning` (for the data tests and, later, the custom tuning editor).
- `src/pitch/yin.ts`: YIN with parabolic interpolation on the raw difference function; returns `null` when there's no clear pitch. `level.ts` (`rms`), `buffer.ts` (`bufferSizeFor`: 2048 for every built-in tuning, 4096 for chromatic).
- Tests (355): every string of every built-in tuning at 44.1 and 48 kHz, as a pure sine and with harmonics (within ±1 cent), and with noise (within ±3 cents, no octave errors); silence and white noise give no pitch; re-entrant ukulele matching; note boundaries; tuning validation.

## To-do

Work that hasn't started yet. Remove an item once it's done, and keep the user's decisions and open questions with each item. When a task finishes or the user asks "what's next", offer items from here.

### Next up

- **Audio path:** an AudioWorklet that collects samples and runs YIN off the main thread, a "Start tuning" button, the RMS gate and smoothing.
- **Tuner screen** with the needle, and the hand-rolled hash router.
- Then: Instrument/Tuning picker, Custom tuning editor, Settings (A4), PWA (manifest, service worker, offline).

### Open questions

- **String order wording** (raised 2026-10-25): "lowest-numbered string first" conflicts with the usual numbering, where string 1 on a guitar is the high E. The data follows the examples (`E2 A2 D3 …`, `G4 C4 E4 A4`), the order players say them. Possibly reword to "in the order players name them".
