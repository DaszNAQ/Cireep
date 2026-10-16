// Balance numbers for the game. Change them here to tune it.

export const MUSIC_VOL = 0.55;
export const DRONE_VOL = 0.09;
export const SEMI = [0, 1, 3, 5, 7, 8, 10];

export const MU_CFG = {
  menu:   { bus:0.9, lp:2200, dr:0.55, tc:0.8 },
  play:   { bus:1.0, lp:3400, dr:0.7,  tc:0.6 },
  resume: { bus:0.8, lp:1200, dr:0.6,  tc:0.4 },
  pause:  { bus:0.7, lp:420,  dr:0.5,  tc:0.25 },
  scare:  { bus:0.12,lp:600,  dr:0.4,  tc:0.04 },
  over:   { bus:0.9, lp:1500, dr:0.6,  tc:1.2 }
};

export const VOW = [[[450,8],[800,10],[2830,12]], [[800,8],[1150,10],[2800,12]], [[325,8],[700,10],[2530,12]]];
export const BASKET_V = 2.0;
export const CT = [0, 45, 100, 170, 260];
export const C_SPD = [1.0, 1.5, 2.0, 2.35, 2.6];
export const C_CIR = [0.06, 0.15, 0.24, 0.32, 0.38];
export const C_GAP = [0.95, 0.70, 0.55, 0.46, 0.40];
export const HUES = [160, 178, 192, 206, 228, 262];
export const REV = [0.85, 0.70, 0.55, 0.42];
export const FALSE_RATE = [0, 0, 0.12, 0.22];
// Drift: balls veer sideways, growing from DRIFT_START to DRIFT_FULL.
export const DRIFT_START = 100;
export const DRIFT_FULL = 400;
export const DRIFT_VMAX = 0.50;       // max sideways speed (screen widths per second)
export const DRIFT_TURN = [0.45, 1.3]; // seconds between direction changes (min, max)
// Soft flash every FLASH_STEP points. No random flicker.
export const FLASH_STEP = 50;
export const FLASH_ALPHA = 0.1;   // flash strength (0-1), halved in reduce-flashing mode
export const FLASH_TIME = 0.12;   // seconds
export const SCARES = ['face', 'lunge', 'glitch', 'eyes'];
