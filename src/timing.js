// Frame timing shared by the loop and effects.

export const timing = { fdt: 1 / 60, lowFx: false, fxEma: 16 };

export function per(p){ return Math.min(1, p*60*timing.fdt); }
