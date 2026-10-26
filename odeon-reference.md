# Odeon — a guide

Odeon is a tuner for guitar and ukulele. It listens through the microphone, works out which note a string is playing, and shows how far off it is. It runs in the browser first, and later becomes an app on your Android phone. It works completely offline: no accounts, no internet, nothing sent anywhere.

This guide is the big picture: what's where and how to do the common things. Claude's own working notes are in `CLAUDE.md`.

---

## Where things stand

The "brain" of the tuner is built and tested, but there's nothing to see in the browser yet beyond a placeholder page. Built so far:

- **Note math:** turning a frequency (how fast a string vibrates, in Hz) into a note name like "E2", and working out how many **cents** sharp or flat it is. A cent is a hundredth of a semitone; tuners usually call a string "in tune" within about 5 cents.
- **Instruments and tunings:** guitar (Standard, Drop D, DADGAD, Open G, Open D, Half-step down) and ukulele (Standard, Low G, Baritone). These are just a list of data, so adding an instrument later means adding a few lines, not new code.
- **Pitch detection:** the part that listens to a sound and finds its note. It uses a method called **YIN**, which copes well with guitar strings. A plucked string isn't one clean tone; it has overtones that can fool simpler methods into reading the note an octave too high.
- **Picking the string:** when you pluck, the tuner works out which string you're tuning by finding the closest target note. It doesn't assume strings go low to high, because a ukulele's G string is higher than the C next to it.

Coming next: the microphone connection, then the tuner screen with its needle.

---

## Day to day

### Running it on your computer

Open a terminal in the project folder and run:

```
npm run dev
```

Then open **http://localhost:5173**. Changes show up in the open page by themselves.

### Checking that nothing is broken

```
npm test
```

This runs the automatic tests: about 350 checks. They play made-up string sounds into the pitch detector for every string of every tuning, and make sure the answer is within 1 cent. If everything is fine, the last lines say "passed".

```
npm run check
```

This checks the code for type mistakes (things like passing a word where a number belongs).

### Tidying code

```
npm run format
```

This runs Prettier over the whole project, with the same settings as your other projects. Your editor does this anyway when a file is saved.

---

## How it fits together

All the code is in the `src/` folder:

- `music/`: note names, frequencies and cents.
- `data/`: the list of instruments and tunings.
- `pitch/`: hearing a note in a sound.
- `audio/` (coming): the microphone.
- `screens/` and `components/` (coming): what you see.

The tests are in `tests/`.

The note math and pitch detection don't depend on the browser at all. That means they can be tested on their own, and they'll work unchanged when the app moves to Android.
