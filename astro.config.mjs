// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Если страница будет жить в подпапке (например mvpa.ru/quizmas/) — укажите base: '/quizmas'.
  // Пути к файлам из /public в компонентах собираются через withBase(), поэтому ничего не сломается.
  base: '/',
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
