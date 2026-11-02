/** Пользователь попросил систему уменьшить движение */
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Есть мышь/тачпад (а не только палец) — включаем эффекты под курсор */
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
