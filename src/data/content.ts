/**
 * Все тексты и ссылки страницы. Контент правится только здесь —
 * компоненты в src/components берут данные из этого файла.
 *
 * `draft: true` — текст-заглушка («рыба»). В режиме разметки такие места
 * подсвечены жёлтой рамкой: нужен финальный текст от заказчика.
 * `photo` / `logo` — путь к картинке в /public (например '/media/speakers/ivanov.jpg').
 * Пока путь пустой, на месте картинки рисуется заглушка.
 */

export const site = {
  metaTitle: 'MVP Квизмас — 13 декабря 2026, Москва',
  metaDescription:
    'Кибермейджор, MVP Talks и спортивный квиз: подводим итоги года в спорте, беттинге и киберспорте. 13 декабря 2026, Avulus Cyber Space.',
  /** Слой разметки прототипа: номера экранов, заметки из ТЗ, места под новогодние элементы. В проде — false. */
  annotations: false,
};

export const event = {
  title: 'MVP Квизмас',
  date: '13 декабря 2026',
  city: 'Москва',
  venue: 'Avulus Cyber Space',
  address: 'Москва, Серебрянический переулок, 12, стр. 1',
  mapUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('Москва, Серебрянический переулок, 12с1'),
  /** TODO: ссылка на покупку билета */
  ticketUrl: '#',
  /** куда ведут «Купить билет» на первом экране и «Билеты» в меню — блок с билетом ниже на странице */
  ticketAnchor: '#tickets',
  /** TODO: ссылка на регистрацию на квиз */
  quizRegisterUrl: '#',
};

export const contacts = {
  contactUrl: 'https://t.me/MVPAwards',
  socials: [
    { id: 'tg', label: 'Telegram', url: 'https://t.me/mvp_awards' },
    { id: 'vk', label: 'VK', url: 'https://vk.com/marspo' },
  ],
  policyUrl: 'https://mvpa.ru/files/terms/politika-obrabotki-personalnyix-dannyix-mvpa.pdf',
  consentUrl: 'https://mvpa.ru/files/terms/soglasie-na-obrabotku-personalnyix-dannyix-mvpa.pdf',
};

/** Пункты плавающего меню. id совпадает с id секции. */
export const nav = [
  { id: 'about', label: 'О событии' },
  { id: 'program', label: 'Программа' },
  { id: 'schedule', label: 'Расписание' },
  { id: 'talks', label: 'MVP Talks' },
  { id: 'quiz', label: 'Квиз' },
  { id: 'speakers', label: 'Спикеры' },
  { id: 'partners', label: 'Партнеры' },
  { id: 'location', label: 'Локация' },
  { id: 'faq', label: 'FAQ' },
  // вернуть вместе с блоком: jury «Жюри»
];

/** Партнёры на первом экране (по ТЗ — 2–3). */
export const heroPartners = [
  { role: 'генеральный партнёр', logo: '' },
  { role: 'стратегический партнёр', logo: '' },
  { role: 'официальный партнёр', logo: '', optional: true },
];

/** 01 · Первый экран — как слайд «Квизмас» на MVP (Figma: кадр «main», 1440×900). */
export const hero = {
  partner: { name: 'BetBoom', logo: '/media/hero/betboom.svg', caption: 'официальный партнер', url: 'https://betboom.ru' },
  /** В макете 13 декабря 2027 — в ТЗ и остальных блоках 2026, оставлено 2026 */
  date: event.date,
  address: event.address,
  logo: '/media/hero/logo-full.png',
  lead: 'Предновогоднее событие для спортивной, киберспортивной и беттинг-индустрии.',
  cta: 'Купить билет',
  video: '/media/hero/kvizmas-1080.mp4',
  poster: '/media/hero/poster.jpg',
};

/**
 * 02 · «Что мы придумали?» — экран закрепляется, текст закрашивается по мере скролла,
 * теги, снежинки и фото проезжают снизу вверх на разной глубине (параллакс).
 * Переносы строк (\n) — как в макете.
 */
export const intro = {
  title: ['Что мы', 'придумали?'],
  paragraphs: [
    'Мы объединили три индустрии — спорт, беттинг\nи киберспорт, чтобы подвести итоги года\nв расслабленной атмосфере. Подготовили полезный контент в новом формате и возможность\nобменяться опытом.',
    'А ещё соберём MVP-комьюнити, чтобы вместе\nсыграть в Квиз, проверить эрудицию и укрепить профессиональные связи.',
  ],
  /** те же абзацы с переносами мобильного макета (слова совпадают, отличаются только \n) */
  paragraphsMobile: [
    'Мы объединили три индустрии — спорт, беттинг и киберспорт,\nчтобы подвести итоги года\nв расслабленной атмосфере. Подготовили полезный контент\nв новом формате и возможность обменяться опытом.',
    'А ещё соберём MVP-комьюнити, чтобы вместе сыграть в Квиз, проверить эрудицию и укрепить профессиональные связи.',
  ],
  /**
   * Сцена с глубиной вокруг текста. x, y — позиция в кадре 1440×900 в момент, когда сцена
   * совпадает с макетом (кадр «2»); до него элементы ниже, после — уходят вверх.
   * z — удалённость от камеры: 1 — плоскость текста, меньше — дальше (медленнее, за текстом),
   * больше — ближе (быстрее и сильнее растут). back — слой за текстом.
   * m — позиция и размер в мобильном кадре 375×829 (Figma: «2 · mobile», кадр 743 — головы и нижние снежинки
   * опущены на 86: между концом текста (515) и головами 64 px, головы не заходят на текст); без m элемент
   * на мобильном скрыт, mobileOnly — только на мобильном. Теги в мобильном макете убраны.
   */
  floats: [
    { kind: 'snow', src: '/media/intro/snow-2.svg', x: -31, y: 223, w: 91, h: 96, z: 0.45, back: true, m: { x: -34, y: 89, w: 81.9 } },
    { kind: 'snow', src: '/media/intro/snow-4.svg', x: 1339, y: 381, w: 159, h: 168, z: 0.6, back: true, m: { x: 268, y: 188, w: 111.3 } },
    { kind: 'snow', src: '/media/intro/snow-6.svg', x: 737, y: 669, w: 73, h: 76, z: 0.35, back: true, m: { x: 140, y: 346, w: 58.4 } },
    { kind: 'snow', src: '/media/intro/snow-1.svg', x: 252, y: 190, w: 21, h: 22, z: 1.3, m: { x: 308, y: 742, w: 21 } },
    { kind: 'snow', src: '/media/intro/snow-3.svg', x: 1035, y: 223, w: 39, h: 42, z: 1.9 },
    { kind: 'tag', text: 'sport', color: 'accent', x: 395, y: 265, w: 110, h: 40, z: 1.15 },
    { kind: 'tag', text: 'mvp', color: 'dark', x: 755, y: 323.59, w: 90, h: 40, z: 1.15 },
    { kind: 'tag', text: 'cybersport', color: 'accent', x: 1131, y: 333.59, w: 150, h: 40, z: 1 },
    { kind: 'photo', src: '/media/intro/photo-2.png', x: 1000, y: 412, w: 179, h: 201, z: 1.45, m: { x: 191, y: 579, w: 100, h: 112 } },
    { kind: 'tag', text: 'betting', color: 'dark', x: 176, y: 389, w: 109, h: 40, z: 0.9 },
    { kind: 'snow', src: '/media/intro/snow-5.svg', x: 102, y: 542, w: 43, h: 46, z: 1.7, m: { x: 358, y: 609, w: 34.4 } },
    { kind: 'photo', src: '/media/intro/photo-1.png', x: 255, y: 567, w: 179, h: 201, z: 1.35, m: { x: 100, y: 635, w: 100, h: 112 } },
    { kind: 'snow', src: '/media/intro/snow-7.svg', x: 1257, y: 678, w: 62, h: 67, z: 2.1 },
    { kind: 'tag', text: 'quiz', color: 'dark', x: 923, y: 745, w: 90, h: 40, z: 0.95 },
    { kind: 'snow', src: '/media/intro/snow-8.svg', x: 502, y: 768, w: 28, h: 30, z: 1.5, m: { x: 300, y: 40, w: 28 } },
    { kind: 'snow', src: '/media/intro/snow-8.svg', x: 0, y: 0, w: 28, h: 30, z: 1.2, mobileOnly: true, m: { x: 13, y: 663, w: 19.6 } },
    { kind: 'tag', text: 'community', color: 'accent', x: 645, y: 707, w: 150, h: 40, z: 1.05 },
  ],
};

/**
 * 03 · «Что будет?» — три пункта дня, экран закреплён: скроллом переключаются пункты
 * (все три всегда на экране, активный — белый), иконка посередине перетекает в следующую (WebGL).
 * Иконки вырезаны из спрайта макета.
 */
export const program = {
  title: ['Что', 'будет?'],
  items: [
    { title: 'Кибермейджор', lead: 'Совместный просмотр финала CS2 Major\nв Сингапуре на большом экране', icon: '/media/program/icon-cybermajor.png' },
    { title: 'MVP Talks', lead: 'Деловой блок: короткие динамичные форматы вместо классической конференции', icon: '/media/program/icon-talks.png' },
    { title: 'Спортивный квиз', lead: 'Командный квиз про спорт, киберспорт, беттинг и Новый год', icon: '/media/program/icon-quiz.png' },
  ],
};

type ScheduleItem = {
  time: string;
  title: string;
  /** Ключевой пункт — по ТЗ выводится крупнее */
  key?: boolean;
  text?: string;
  list?: string[];
  link?: { href: string; label: string };
};

export const schedule: { title: string; accent: string; items: ScheduleItem[] } = {
  title: 'Как всё',
  accent: 'пройдёт?',
  items: [
    { time: '09:30 — 10:00', title: 'Сбор гостей, приветственный кофе' },
    {
      time: '10:00 — 12:00',
      title: 'CS2 Major в Сингапуре',
      text: 'Совместный просмотр финала мажора\nпо CS2 в Сингапуре: большой экран, живая атмосфера и комментарии кастеров непосредственно на площадке',
      key: true,
    },
    { time: '12:00 — 13:00', title: 'Перерыв, кофе-брейк' },
    {
      time: '13:00 — 17:00',
      title: 'MVP Talks & Entertainment',
      text: 'Серия коротких динамичных форматов\nвместо классической конференции:',
      list: ['дискуссионные панели', 'баттлы', 'прожарка кейсов', 'сольные выступления', 'презентации исследований'],
      key: true,
    },
    { time: '17:00 — 18:00', title: 'Перерыв, кофе-брейк' },
    {
      time: '18:00 — 20:00',
      title: 'Спортивный квиз',
      text: 'Командный квиз с вопросами про: спорт, киберспорт, betting индустрию, музыку, кино, lifestyle, Новый год и Рождество',
      key: true,
    },
  ],
};

/**
 * Блок с логотипом в снегу после расписания: видео не играет само, кадр задаёт скролл.
 * Файл перекодирован под перемотку (каждый кадр ключевой, без звука) — исходник glass-disc-logo.mp4.
 */
export const logoSpin = {
  video: '/media/logo-spin/glass-logo.mp4',
  poster: '/media/logo-spin/glass-logo.jpg',
};

/**
 * Программа MVP Talks — один поток, белый экран (Figma: кадр «2», низ).
 * Время — название сессии — спикер — пояснение. Названия, спикеры и тексты пока «рыба».
 */
export const talks = {
  title: 'Программа MVP Talks',
  accent: '& Entertainment',
  badge: '13:00 — 17:00 · один поток',
  sessions: [
    {
      time: '13:00 — 13:30',
      title: 'Итоги года в спорте, беттинге и киберспорте',
      speaker: 'Константин Константинопольский',
      text: 'Приветствие от организаторов и короткий обзор главных событий индустрии за год.',
      draft: true,
    },
    {
      time: '13:30 — 14:15',
      title: 'Прожарка кейсов: маркетинг года',
      speaker: 'Анна Соколова',
      text: 'Авторы показывают кампании 2026 года, эксперты и зал разбирают их без скидок.',
      draft: true,
    },
    {
      time: '14:15 — 15:00',
      title: 'Букмекеры и клубы: кто кому нужнее',
      speaker: 'Илья Мартынов',
      text: 'Спонсорство в спорте: как меняются контракты, что получают клубы и где проходят границы.',
      draft: true,
    },
    {
      time: '15:15 — 16:00',
      title: 'Рынок киберспорта: итоги сезона',
      speaker: 'Мария Ветрова',
      text: 'Цифры по зрителям и призовым, главные турниры года и куда движется рынок дальше.',
      draft: true,
    },
    {
      time: '16:00 — 17:00',
      title: 'Баттл: прогнозы на 2027',
      speaker: 'Дмитрий Орлов и Артём Белов',
      text: 'Две позиции, пять минут на аргументы и голосование зала в реальном времени.',
      draft: true,
    },
  ],
};

/**
 * 07 · Спортивный квиз — тёмная плашка на градиенте после белой программы MVP Talks.
 * Вокруг плашки по орбите идут иконки (scripts/sections/quiz-orbit.ts): все в одинаковых рамках
 * и на равных углах, размер и яркость задаёт перспектива. Порядок — как в макете слева направо.
 * Текст под иконками в макете пока повторяет «Что мы придумали?» — нужен свой.
 */
export const quiz = {
  title: ['Спортивный', 'квиз'],
  steps: ['Настраиваемся', 'Играем', 'Кайфуем'],
  /** темы вопросов — плашки под пунктами, по строкам как в макете */
  topics: [['Спорт', 'Betting-индустрия', 'Музыка'], ['Кино', 'Lifestyle', 'Киберспорт'], ['Новый год и Рождество']],
  /** пока текст из «Что мы придумали?» — как в макете (с его переносами) */
  paragraphs: intro.paragraphs,
  paragraphsMobile: intro.paragraphsMobile,
  draft: true,
  cta: 'Зарегистрироваться',
  /**
   * Иконки карусели: public/media/quiz/<name>.avif (+ .png для старых браузеров).
   * ratio — ширина/высота картинки: по нему считается видимая ширина, чтобы промежутки между иконками были равными.
   * Порядок — как в макете слева направо, по центру кубок.
   */
  icons: [
    { name: 'tennis', ratio: 1 },
    { name: 'shuba', ratio: 1.012 },
    { name: 'ornament', ratio: 0.795 },
    { name: 'mask', ratio: 0.736 },
    { name: 'cup', ratio: 0.917 },
    { name: 'olivier', ratio: 1 },
    { name: 'gloves', ratio: 1.228 },
    { name: 'sprats', ratio: 0.993 },
    { name: 'whistle', ratio: 1.714 },
    { name: 'tangerine', ratio: 0.993 },
    { name: 'hat', ratio: 1.217 },
    { name: 'bottle', ratio: 0.286 },
  ],
};

/**
 * «Кто будет?» — горизонтальная карусель. Имена и должности — «рыба» из макета.
 * В макете пять карточек; они повторяются, чтобы было что листать, пока нет настоящего списка.
 */
export const speakers = {
  title: ['Кто', 'будет?'],
  items: Array.from({ length: 10 }, (_, i) => ({
    name: 'Михаил Соколов',
    role: 'Финансовый директор',
    photo: `/media/speakers/speaker-${(i % 5) + 1}.webp`,
    draft: true,
  })),
};

/** Жюри. Как «Как всё пройдёт?»: заголовок закреплён, карточки прокручиваются. Пока заглушки. */
export const jury = {
  title: 'Жюри',
  lead: 'Эксперты, которые оценивают выступления и выбирают победителей.',
  items: Array.from({ length: 6 }, () => ({
    name: 'Имя Фамилия',
    role: 'Должность, компания',
    text: 'Пара строк о том, чем известен и за что отвечает в жюри.',
    photo: '',
    draft: true,
  })),
};

/** «Купить билет»: тексты пока из макета («рыба»), финальные — от заказчика */
export const ticket = {
  title: ['Купить', 'билет'],
  text: 'И пишем короткий текст, что участники премии проходят бесплатно бла бла бла.',
  perks: ['Первое офлайн событие от MVP Conference', 'Три потока программы', 'Доступ на церемонию MVP Awards', 'Количество билетов ограничено!'],
  cta: 'Купить билет',
  mark: '/media/tickets/mark.svg',
};

/**
 * Партнёры. x, y, w, h — логотип в px макета (x — от левого края кадра 1440, y — от верха блока),
 * roleX, roleY — центр и верх подписи. Логотипы смешиваются с фоном (color-dodge), на наведении белеют.
 */
export const partners = {
  title: 'Партнеры',
  items: [
    { name: 'Матч ТВ', logo: '/media/partners/match.svg', role: 'Генеральный партнер', x: 163, y: 273.3, w: 139.04, h: 37.75, roleX: 230.5, roleY: 353.36 },
    { name: 'Чемпионат', logo: '/media/partners/champ.svg', role: 'Генеральный партнер', x: 453, y: 236.5, w: 173.8, h: 74.9, roleX: 537.5, roleY: 353.36 },
    { name: 'Советский спорт', logo: '/media/partners/sovsport.svg', role: 'Генеральный партнер', x: 788, y: 263.5, w: 174, h: 47.9, roleX: 872.5, roleY: 353.36 },
    { name: 'Meta Ratings', logo: '/media/partners/meta.svg', role: 'Генеральный партнер', x: 1117, y: 277.79, w: 184.03, h: 42.52, roleX: 1207.5, roleY: 353.36 },
    { name: 'Рейтинг букмекеров', logo: '/media/partners/rb.svg', role: 'Генеральный партнер', x: 256, y: 464.9, w: 188.9, h: 34.4, roleX: 348.5, roleY: 547.36 },
    { name: 'Sports.ru', logo: '/media/partners/sports.svg', role: 'Генеральный партнер', x: 624, y: 464.9, w: 184.6, h: 43, roleX: 714.5, roleY: 547.36 },
    { name: 'Sport24.ru', logo: '/media/partners/sport24.svg', role: 'Генеральный партнер', x: 981, y: 478, w: 220, h: 19.6, roleX: 1089.5, roleY: 547.36 },
  ],
};

export const location = {
  title: 'Локация',
  mapLabel: 'Открыть в Яндекс Картах',
  /**
   * Ключ JavaScript API Яндекс Карт (developer.tech.yandex.ru). Пока его нет, на месте карты — картинка
   * из макета (poster); с ключом появляется живая карта в стиле data/map-style.json.
   */
  mapApiKey: '',
  /** долгота, широта дома 12 стр. 1 (2ГИС) — порядок как в API Яндекс Карт */
  coords: [37.6483, 55.7502] as [number, number],
  zoom: 16,
  poster: '/media/location/map.webp',
  /** Фото площадки: depth — глубина параллакса, как у фото в «Что мы придумали?» */
  photos: [
    { src: '/media/location/photo-dan.webp', side: 'left', depth: 0.8 },
    { src: '/media/location/photo-reception.webp', side: 'right', depth: 1.15 },
  ],
};

export const faq = {
  title: 'FAQ',
  items: [
    {
      q: 'Где и когда пройдёт MVP Квизмас?',
      a: `${event.date}, ${event.venue}: ${event.address}.`,
    },
    { q: 'Есть ли парковка на площадке?', a: 'Уточняем у площадки — ответ появится ближе к событию.', draft: true },
    { q: 'Будет ли онлайн-трансляция и запись?', a: 'Нет, событие только офлайн — приходите за живым нетворкингом.', draft: true },
    { q: 'Нужно ли отдельно регистрироваться на квиз?', a: 'Да, регистрация на квиз — по кнопке в разделе «Спортивный квиз».', draft: true },
    { q: 'Как стать партнёром или спикером?', a: 'Напишите нам в Telegram — ссылка «Связаться с нами» вверху страницы.' },
    {
      q: 'Можно передать билет другому человеку?',
      a: 'Да, при покупке билета создаётся личный кабинет, где можно изменить данные для аккредитации.',
      draft: true,
    },
  ],
};

/** Подвал. Меню — как в макете; video — когда будет готов ролик, он встанет вместо картинки image. */
export const footer = {
  nav: [
    { id: 'about', label: 'Что мы придумали?' },
    { id: 'program', label: 'Что будет?' },
    { id: 'schedule', label: 'Как всё пройдёт?' },
    { id: 'talks', label: 'Программа MVP Talks & Entertainment' },
    { id: 'quiz', label: 'Спортивный квиз' },
    { id: 'speakers', label: 'Кто будет?' },
    { id: 'partners', label: 'Партнеры' },
    { id: 'location', label: 'Локация' },
    { id: 'faq', label: 'Faq' },
  ],
  image: '/media/footer/glass-logo.webp',
  video: '',
  logo: '/media/footer/logo-kvizmas.svg',
};
