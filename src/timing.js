// timing.js
// Frame timing shared by the game loop and effects.
// per(p) keeps effects at the same speed on slow and fast devices.

export const timing = { fdt: 1 / 60, lowFx: false, fxEma: 16 };

export function per(p){ return Math.min(1, p*60*timing.fdt); }
