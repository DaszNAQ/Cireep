// util.js
// Small helper functions.
// hash(n) gives the same "random" number (0 to 1) for the same input.

export function hash(n){ const q = Math.sin(n*127.1 + 311.7)*43758.5453; return q - Math.floor(q); }
