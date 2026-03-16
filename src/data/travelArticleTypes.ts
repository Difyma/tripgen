/** Блок секции статьи: список мест с описанием */
export interface TravelArticleSectionList {
  type: 'list';
  /** Заголовок секции (H2) */
  title: string;
  /** Нумерованный список */
  numbered?: boolean;
  /** С какого номера начинать (для сквозной нумерации по статье) */
  startIndex?: number;
  /** Элементы списка */
  items: string[];
  /** Краткое описание после списка */
  description?: string;
}

/** Блок региона: крупное фото + заголовок + список мест + описание (интерактивный) */
export interface TravelArticleSectionRegion {
  type: 'region';
  /** Якорь для навигации (id элемента) */
  id?: string;
  /** Slug для страницы кластера: /blog/sever-rossii */
  slug?: string;
  /** Изображение региона */
  image: string;
  /** Подпись к фото (alt) */
  imageAlt: string;
  /** Заголовок (H2) */
  title: string;
  /** Тег/категория на карточке (например: Города, Природа, Море) */
  tag?: string;
  /** Нумерация с этого номера */
  startIndex?: number;
  /** Места в регионе */
  items: string[];
  /** Краткое описание */
  description?: string;
  /** Почему стоит поехать (150–200 слов для SEO) */
  whyVisit?: string;
  /** Текст кнопки «спланировать поездку» (опционально) */
  ctaLabel?: string;
}

/** Блок секции: текст (абзацы) */
export interface TravelArticleSectionText {
  type: 'text';
  title?: string;
  paragraphs: string[];
}

/** Карточка места в подборке */
export interface TravelArticleCardItem {
  title: string;
  description?: string;
  image?: string;
  link?: string;
}

/** Блок секции: сетка карточек */
export interface TravelArticleSectionCards {
  type: 'cards';
  title?: string;
  items: TravelArticleCardItem[];
  columns?: 2 | 3;
}

/** Блок: одно крупное фото с подписью */
export interface TravelArticleBlockImage {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  /** Компактный размер (меньше по ширине и отступам) */
  size?: 'default' | 'compact';
}

/** Блок: CTA в конце статьи */
export interface TravelArticleBlockCta {
  type: 'cta';
}

/** Блок: перелинковка (другие статьи + чат) */
export interface TravelArticleBlockRelated {
  type: 'related';
  links: { label: string; href: string }[];
}

/** Блок: описания регионов (список мест + «Почему стоит поехать») */
export interface TravelArticleBlockRegionDescriptions {
  type: 'regionDescriptions';
  /** Регионы с полным текстом (используются данные из секций region) */
  regionIds?: string[];
}

/** Блок: лучшие места России — детальные описания мест */
export interface TravelArticleBlockPlacesDetail {
  type: 'placesDetail';
  title: string;
  items: { name: string; description: string }[];
}

/** Блок: когда ехать в Россию (сезоны) */
export interface TravelArticleBlockWhenToVisit {
  type: 'whenToVisit';
  title: string;
  seasons: { name: string; description: string }[];
}

/** Блок: FAQ (часто задаваемые вопросы) */
export interface TravelArticleBlockFaq {
  type: 'faq';
  title: string;
  items: { question: string; answer: string }[];
}

/** Блок: популярные маршруты */
export interface TravelArticleBlockPopularRoutes {
  type: 'popularRoutes';
  title: string;
  items: { title: string; href: string; description?: string }[];
}

/** Блок: советы путешественникам */
export interface TravelArticleBlockTravelTips {
  type: 'travelTips';
  title: string;
  paragraphs: string[];
}

/** Блок: маршрут по дням (timeline) */
export interface TravelArticleBlockRoute {
  type: 'route';
  title: string;
  days: {
    label: string;
    title?: string;
    description?: string;
  }[];
}

export type TravelArticleSection =
  | TravelArticleSectionList
  | TravelArticleSectionRegion
  | TravelArticleSectionText
  | TravelArticleSectionCards
  | TravelArticleBlockImage
  | TravelArticleBlockCta
  | TravelArticleBlockRelated
  | TravelArticleBlockRegionDescriptions
  | TravelArticleBlockPlacesDetail
  | TravelArticleBlockWhenToVisit
  | TravelArticleBlockFaq
  | TravelArticleBlockPopularRoutes
  | TravelArticleBlockTravelTips
  | TravelArticleBlockRoute;

/** CTA-бар в hero (кнопка + чипы) */
export interface TravelArticleHeroCta {
  primaryLabel: string;
  primaryHref: string;
  chips?: { label: string; href: string }[];
}

/** Карточка в intro-блоке (изображение + подпись) */
export interface TravelArticleIntroCard {
  image: string;
  label: string;
}

export interface TravelArticle {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  /** Для карточки в списке блога */
  excerpt: string;
  heroImage: string;
  date: string;
  author?: string;
  readTime?: string;
  /** 1–2 абзаца вступления */
  intro: string[];
  /** CTA под hero (подборка маршрута + чипы по интересам) */
  heroCta?: TravelArticleHeroCta;
  /** Карточки справа в intro (двухколоночный блок) */
  introCards?: TravelArticleIntroCard[];
  /** Компактные карточки регионов (меньше по ширине и высоте) */
  compactRegions?: boolean;
  /** Блоки контента по порядку */
  sections: TravelArticleSection[];
  /** Ссылки для перелинковки в конце (если не используем блок related) */
  relatedLinks?: { label: string; href: string }[];
}
