/** Путь к файлу из /public с учётом `base` из astro.config.mjs. */
export const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
