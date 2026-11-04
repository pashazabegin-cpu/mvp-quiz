/**
 * Абзац с ручными переносами обоих макетов. Слова в десктопной и мобильной версии совпадают,
 * \n отмечает перенос после слова (d — в десктопном, m — в мобильном), поэтому идём по словам
 * двух версий параллельно. В разметке перенос — <br class="br-d"> / <br class="br-m">.
 */
const tokens = (text: string) => {
  const out: { word: string; br: boolean }[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (!/^\s+$/.test(part)) out.push({ word: part, br: false });
    else if (part.includes('\n') && out.length) out[out.length - 1].br = true;
  }
  return out;
};

export const paragraph = (desktop: string, mobile: string) => {
  const m = tokens(mobile);
  return tokens(desktop).map((t, i) => ({ word: t.word, d: t.br, m: m[i]?.br ?? false }));
};
