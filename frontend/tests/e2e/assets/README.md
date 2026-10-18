# Test asset fixtures

- `silence.mp3` — one second of silence, from the public-domain
  [anars/blank-audio](https://github.com/anars/blank-audio) collection
  (CC0). Committed so the upload tests (KARAOKE-012, ADMIN-009/010) exercise
  the real MP3 path without depending on a network fetch at test time. It
  carries real ID3 tags (title "1 Second of Silence", artist, album "Blank
  Audio") and a 34 KB embedded JPEG cover, which ADMIN-012 uses to prove the
  editor's metadata pre-fill and embedded-art extraction.
- `cover.png` — a 64×64 solid PNG, generated locally. The explicit cover /
  thumbnail fixture for ADMIN-013 (picked over the grabbed video frame,
  optimized to WebP on upload).
