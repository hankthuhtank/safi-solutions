# Vibey

A receiver for places. Turn a radio dial and land somewhere else: a rainy Tokyo café, a log cabin
with the fire lit, the Atacama under the Milky Way. Each place is a living picture with the place's
own sound, and a music player tuned to it.

Live at <https://www.safisolutions.org/vibey/>.

## The idea

Everything is built around one object: a late-70s hi-fi receiver. The stations on the dial are
places (88.1 Rainy Tokyo Café … 107.1 Galactic Observatory), laid out like a real band — rooms at
the bottom, outdoors, water, the city, then the night sky. Drag the needle and you hear the hiss
between stations and see grain over the picture; rest on a station and it locks with a click and the
amber lamp. Push-keys along the faceplate open the drawers: Places, Music, Mix, Scene, Memory,
Sleep, TV and Setup. When you stop touching anything the receiver fades away and only the place is
left.

## What's in it

**Twenty places, forty-eight variations.** Every picture is a real photograph or film (no generated
imagery), cropped to 16:9 and served as 4K AVIF (WebP fallback) or as an AV1/HEVC loop for moving
water. Depth and semantic maps made for each photograph let the engine move only what should move:

- clouds and valley mist drift (flow-mapped, so nothing smears), water ripples and shimmers, wet
  streets glisten, foliage sways with the wind;
- rain, snow, falling petals and leaves, dust in lamplight, fireflies, embers and marine snow are
  GPU particles that fall *behind* nearer objects (depth occlusion) and, for interiors, only beyond
  the windows;
- rain forms on window glass, gathers, merges and runs down, refracting the street behind it, with
  a focus control (street or glass);
- lightning lights the clouds and the room, and the thunder arrives later the further away it was;
- the fire in the hearth is real fire footage composited into the fireplace; lamps and neon flicker;
- star fields twinkle, meteors cross the desert sky, the photograph's own aurora ripples and pulses,
  sunlight caustics play over the reef;
- the camera drifts very slowly and leans toward the pointer (parallax from depth).

**Sound.** Forty-two layers in a Web Audio mixer: thirty-two seamless loops cut from the steadiest
stretch of each field recording, eight event layers (thunder, owls and loons, gulls, whale song,
glasses, page turns, shishi-odoshi, a Kyoto temple bell) fired at irregular intervals with small
changes in pitch, level and position, and two generated tones (a deep-space drone and brown noise).
Every loop is levelled to the same loudness. Each layer has a level, mute and a second control —
distance for loops, how often for events. With "Sound follows the picture" on, turning up rain on
screen turns up the rain you hear.

**Music.** 372 tracks in sixteen bands from the Free Music Archive and the Internet Archive, each
licence checked (CC0, CC BY, CC BY-SA, US public domain), plus optional live finds from Openverse
(Jamendo, ccMixter, Wikimedia; CC0/BY/BY-SA only). Two decks with equal-power crossfades,
loudness-matched tracks, shuffle, repeat, starred and recent lists, playlist changes that fade, media
keys and lock-screen controls. Unplayable tracks are skipped with a note; going offline pauses
gracefully and resumes.

- *Kissa Jazz* is jazz for a Tokyo listening café: modern Creative Commons recordings chosen in that
  spirit. They are **not** Japanese releases and the app says so.
- *Vintage 78s* are genuine 1920–1925 recordings, public domain in the United States.

**Timers.** Sleep (fades music and room out over a chosen time, then dims the picture), focus
(Pomodoro rounds with a synthesized bell), place cycling (along the dial or shuffled; everywhere,
starred, or one category), music band cycling, memory (preset) rotation, and "a random atmosphere".

**Memory.** Save the place, its weather, the sound mix and the band as a memory; recall with 1–9.
Four come built in: Rainy Jazz Café, Alpine Morning, Ocean Meditation and Late Night Cyberpunk.
Everything is stored in the browser (localStorage). There are no accounts and nothing is sent
anywhere.

**TV mode.** Full screen, screen wake lock, no cursor, optional clock and now-playing, arrow keys or
a remote's D-pad to tune, OK to show the controls. Casting guidance in the app is honest: tab
casting or screen mirroring, because browsers only offer one-tap casting for plain video files.

**Quality.** Auto, Performance (≤1080p), Balanced (≤1440p) and Ultra (full 4K). The renderer also
watches its own frame time and lowers or raises its internal resolution. Machines without GPU
acceleration are detected and kept light. Without WebGL2 the place is shown as a still (or the
plain video loop). Reduced motion stops camera drift and lightning flashes.

## Layout

```
vibey/
  index.html, assets/        compiled app (published; do not edit)
  favicon.svg
  media/
    scenes/<place>/<variation>/   3840/2560/1600 AVIF, 2560/1600 WebP, maps-a/b/c.png, thumb.webp
                                  or loop-av1.mp4, loop-hevc.mp4, poster.webp for video places
    scenes/manifest.json     what exists, with LQIP placeholders
    fx/                      fire loop, café window reflection
    sounds/                  ambient loops and one-shots + manifest.json (files and credits)
    music/catalog.json       the music library (stream URLs, licences, loudness gains)
  _source/                   the app (React + TypeScript + WebGL2 + Web Audio)
    src/engine/visual/       renderer, shaders, particles, wet glass
    src/engine/audio/        audio engine, ambience mixer, music player
    src/data/                places, sounds, bands
    src/state/               store, controllers and timers
    src/ui/                  the receiver
  scripts/                   asset pipeline (below)
```

## Running and building

```bash
cd vibey
npm install
npm run dev        # http://localhost:5178/vibey/
npm run build      # type-checks, builds, then publishes index.html + assets/ into vibey/
```

`?fps=N` caps the frame rate, which helps when testing in software-rendered browsers.

## Asset pipeline

Run once; the outputs are committed.

1. `scripts/media-sources.json` lists every photo and film with its author, licence and page.
2. `scripts/scene-maps.py` (Python, PyTorch, transformers) makes the 16:9 master and the depth
   (Depth Anything V2 Small, Apache-2.0) and semantic maps (OneFormer ADE20K Swin-L, MIT);
   `scripts/mask-overrides.py` fixes the few windows the segmenter misses.
3. `node scripts/build-media.mjs <maps-dir>` encodes AVIF/WebP, thumbnails and the manifest.
4. `scripts/build-video.sh <work-dir>` cuts seamless loops (the tail cross-fades into the head) and
   encodes AV1 (SVT-AV1) and HEVC (x265).
5. `python3 scripts/build-sounds.py <work-dir>` downloads the Freesound recordings in
   `scripts/sound-sources.json`, finds the steadiest stretch, folds it into a seamless loop or
   splits one-shots, levels and encodes them.

## Licences and credits

Credits for every photograph, film, recording and track are in the app under Setup → Credits, and
in `scripts/media-sources.json`, `media/sounds/manifest.json` and `media/music/catalog.json`.

- Photos and films: Pexels License (Pexels), CC0, CC BY, CC BY-SA (Wikimedia Commons), CC BY 4.0
  (ESO, ESA/Webb, ESA/Hubble). Photos under CC BY or CC BY-SA were cropped and resized for Vibey and
  depth and mask maps were derived from them; those derived files carry the same licence as their
  source.
- Sounds: Freesound recordings under CC0 1.0 and CC BY 3.0/4.0; trimmed, looped and levelled.
- Music: streamed from its source under CC0, CC BY, CC BY-SA or US public domain; credited per track
  in the player.
- Fonts: Archivo and Newsreader (SIL Open Font License), loaded from Google Fonts.
- The app's own code, shaders and audio engine: © Safi Solutions.
