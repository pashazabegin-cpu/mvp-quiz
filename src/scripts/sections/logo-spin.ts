/**
 * Логотип в снегу: кадр видео задаёт скролл. Пока блок проходит через экран (верх у низа экрана →
 * низ у верха), видео проматывается от начала до конца — логотип делает оборот и встаёт лицом.
 * В файле каждый кадр ключевой, поэтому перемотка в обе стороны без рывков.
 * Грузится заранее, когда до блока остаётся пара экранов; до этого виден постер (первый кадр).
 *
 * Мобильный — проще: перемотка видео на каждый кадр скролла на телефонах дёргается и греет,
 * поэтому видео просто проигрывается один раз, когда блок заметно вышел на экран, и останавливается на последнем кадре.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY } from '../core/stage';

const FPS = 24;

export function initLogoSpin() {
  const section = document.querySelector<HTMLElement>('[data-spin]');
  const video = section?.querySelector<HTMLVideoElement>('[data-spin-video]');
  if (!section || !video) return;

  let progress = 0;
  let shown = -1;

  // не чаще кадра видео и не во время предыдущей перемотки
  const draw = () => {
    if (!video.duration || video.seeking) return;
    const last = Math.floor(video.duration * FPS) - 1;
    const frame = Math.round(progress * last);
    if (frame === shown) return;
    shown = frame;
    video.currentTime = (frame + 0.5) / FPS;
  };

  // iOS Safari рисует кадр по currentTime только у видео, которое хоть раз запускали
  const prime = () => {
    video
      .play()
      .then(() => video.pause())
      .catch(() => {})
      .finally(() => {
        shown = -1;
        draw();
      });
  };

  const load = () => {
    if (video.preload === 'auto') return;
    video.preload = 'auto';
    video.addEventListener('loadedmetadata', prime, { once: true });
    video.load();
  };

  if (window.matchMedia(MOBILE_QUERY).matches) {
    const preload = () => {
      video.preload = 'auto';
      video.load();
    };
    ScrollTrigger.create({ trigger: section, start: 'top bottom+=150%', once: true, onEnter: preload });
    ScrollTrigger.create({ trigger: section, start: 'top 70%', once: true, onEnter: () => void video.play().catch(() => {}) });
    return;
  }

  ScrollTrigger.create({ trigger: section, start: 'top bottom+=200%', end: 'max', once: true, onEnter: load });
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => (progress = self.progress),
    onRefresh: (self) => (progress = self.progress),
  });
  gsap.ticker.add(draw);
}
