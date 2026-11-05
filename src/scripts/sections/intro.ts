/**
 * «Что мы придумали?» — экран закрепляется на время скролла:
 *   текст закрашивается по словам строго по очереди (эффект MagicText: .2 → 1);
 *   теги, снежинки и фото — сцена с глубиной: камера едет вверх, каждый элемент движется
 *   со своей скоростью по удалённости (data-z), чуть растёт, приближаясь к камере, и слегка
 *   разлетается от центра к краям.
 *   Через MID экранов скролла сцена стоит ровно как в макете, до этого — ниже, после — уходит вверх.
 * Сцена доезжает, пока экран уже уходит после закрепления, — без рывка на стыке.
 *
 * Мобильный — облегчённо: без закрепления и без эффектов от скролла, всё стоит как в макете,
 * текст просто проявляется по абзацам.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY } from '../core/stage';
import { initMagicText } from '../animations/magic-text';

/** через сколько экранов скролла от начала закрепления сцена совпадает с макетом */
const MID = 0.9;
/** путь элемента с z = 1 за экран скролла, px кадра 900 */
const SPEED = 420;
/** прирост масштаба за экран скролла при z = 1 — «наезд» камеры */
const DOLLY = 0.05;
/** разлёт от центра в стороны: доля расстояния до центра за экран скролла при z = 1 */
const SPREAD = 0.08;

export function initIntro(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-intro-section]');
  if (!section) return;
  const lead = section.querySelector<HTMLElement>('[data-intro-lead]')!;

  if (window.matchMedia(MOBILE_QUERY).matches) return initMobile(section);

  // экран закреплён на 220% высоты; сам таймлайн пустой — на нём держится закрепление
  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: '+=220%', pin: true, scrub: true, invalidateOnRefresh: true },
  });
  tl.set({}, {}, 1);
  const pin = tl.scrollTrigger!;

  // закрашивание заканчивается к 85% закрепления
  initMagicText(lead, { end: () => pin.start + (pin.end - pin.start) * 0.85 });
  initDepth(section, pin);
  return pin;
}

/**
 * Мобильный: блок не закреплён и ничего не двигает от скролла — снежинки и головы стоят на своих местах
 * из макета, текст по абзацам мягко проявляется при появлении (animations/soft-reveal.ts).
 * Возвращает триггер без закрепления — по нему фон-градиент знает, где блок (story-bg.ts).
 */
function initMobile(section: HTMLElement) {
  return ScrollTrigger.create({ trigger: section, start: 'top top', end: 'top top' });
}

function initDepth(section: HTMLElement, pin: ScrollTrigger) {
  const layer = section.querySelector<HTMLElement>('.intro__floats');
  const floats = Array.from(section.querySelectorAll<HTMLElement>('[data-float]'));
  if (!layer || !floats.length) return;

  const items = floats.map((el) => {
    // scale — сокращение (scaleX + scaleY): quickSetter его не раскрывает, а Safari падает
    // на setAttribute('scaleX,scaleY'), поэтому две оси отдельно
    const setScaleX = gsap.quickSetter(el, 'scaleX');
    const setScaleY = gsap.quickSetter(el, 'scaleY');
    return {
      el,
      z: Number(el.dataset.z) || 1,
      cx: 0,
      setX: gsap.quickSetter(el, 'x', 'px'),
      setY: gsap.quickSetter(el, 'y', 'px'),
      setScale: (v: number) => {
        setScaleX(v);
        setScaleY(v);
      },
    };
  });
  let screen = 900; // высота экрана в px слоя (учитывает масштаб кадра и мобильную раскладку)
  let center = 720;

  const measure = () => {
    const scale = layer.getBoundingClientRect().height / layer.offsetHeight || 1;
    screen = window.innerHeight / scale;
    center = layer.offsetWidth / 2;
    items.forEach((it) => (it.cx = it.el.offsetLeft + it.el.offsetWidth / 2));
  };

  // p — экраны скролла от начала закрепления
  const render = (p: number) => {
    const d = p - MID;
    items.forEach((it) => {
      const scale = 1 + d * DOLLY * it.z;
      it.setY(-d * SPEED * it.z * (screen / 900));
      // траектория расходится от центра к краям: наезд камеры плюс лёгкий разлёт в стороны
      it.setX((it.cx - center) * d * (DOLLY + SPREAD) * it.z);
      it.setScale(scale);
    });
  };

  ScrollTrigger.create({
    start: () => pin.start,
    end: () => pin.end + window.innerHeight,
    onUpdate: (self) => render((self.progress * (self.end - self.start)) / window.innerHeight),
    onRefresh: (self) => {
      measure();
      render((self.progress * (self.end - self.start)) / window.innerHeight);
    },
  });
}
