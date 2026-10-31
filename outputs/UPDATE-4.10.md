# NEON//NULL 4.10

Keyboard handlers now check that a key value exists before lowercasing it. This avoids an uncaught TypeError from malformed or synthetic key events in both single-player and co-op.
