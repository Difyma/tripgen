# План: SEO-статьи как лендинги TripGen

## 1. Анализ текущего проекта

### 1.1 Глобальные стили
- **Фон:** `#FBFBFD` (основной светлый фон секций), `bg-white` для карточек и контрастных блоков.
- **Типографика:** `text-gray-900` заголовки, `text-gray-600`/`text-gray-700` подзаписи и текст, `font-semibold` для H1/H2, `tracking-tight` для крупных заголовков.
- **Шрифт:** Cal Sans (`font-cal`) для логотипа и акцентов; системный sans для основного текста.
- **Цвета акцента:** `#094D92` в Footer (ссылки), `bg-black` для кнопок CTA, `rounded-full` / `rounded-xl` / `rounded-2xl` для кнопок и карточек.
- **CSS:** Tailwind, переменные в `:root` (background, foreground, primary, border, radius). Контейнер: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

### 1.2 UI-компоненты, уже используемые на сайте
- **Layout:** `MainNavbar`, `Footer` — на всех «лендинговых» страницах (Landing, About, ReadyTourDetails).
- **Карточки:** стиль ReadyTours / ExampleTour — `bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl`, `aspect-[4/3]` или `aspect-[3/4]` для изображений, градиент поверх фото `from-black/60 via-black/20 to-transparent`, подпись внизу слева (иконка + текст).
- **Кнопки CTA:** `bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-900`, с иконкой (MessageSquare, ChevronRight).
- **Секции:** чередование `bg-[#FBFBFD]` и `bg-white`, отступы `py-16`–`py-24`, заголовок секции — `text-4xl`/`text-5xl`/`text-6xl font-semibold mb-6`, подзаголовок `text-xl text-gray-600 max-w-2xl mx-auto`.
- **Framer Motion:** `motion.div` с `initial={{ opacity: 0, y: 20 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true }}` для появления блоков.
- **Иконки:** lucide-react (MapPin, Calendar, Clock, ArrowLeft, Heart, MessageCircle и т.д.).

### 1.3 Паттерны hero-блоков, секций, карточек, галерей, CTA
- **Hero (ReadyTourDetailsPage):** высота `h-[50vh] md:h-[60vh]`, полноэкранное фото, градиент `from-black/70 via-black/30 to-transparent`, кнопка «Назад» вверху слева (backdrop-blur), заголовок и мета внизу слева (белый текст, бейджи).
- **Hero (Hero.tsx главной):** `min-h-[85vh] sm:min-h-screen`, фон `#FBFBFD`, заголовок по центру (градиент текста), форма поиска ниже.
- **Секции с заголовком:** центр, H2 крупный, подзаголовок серый, иногда `flex justify-center` и декоративная полоска `w-24 h-1 bg-black rounded-full opacity-10` (AboutPage).
- **Карточки сеткой:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`, карточка = изображение + блок контента (заголовок, мета, кнопка «Подробнее» с ArrowRight).
- **Галерея (TravelGallery):** `grid grid-cols-2 lg:grid-cols-4 gap-4`, карточки `aspect-[3/4] rounded-2xl`, hover scale, градиент и подпись внизу (локация + категория бейдж).
- **CTA:** блок с иконкой (Heart в CTASection), заголовок, текст, одна кнопка по центру; HowItWorks — кнопка «Начать в чате» с MessageSquare.

### 1.4 Подходящие страницы-референсы внутри проекта
- **ReadyTourDetailsPage** — эталон для «страницы контента с hero»: hero с фото и overlay, кнопка назад, блок контента в `max-w-6xl`, табы/карточки, CTA (забронировать / задать вопрос в чат).
- **LandingPage** — сборка секций: Hero, HowItWorks, ExampleTour, Services, ReadyTours, TravelQuiz, CollectiveTour, CreatorSection, TravelGallery, CTASection.
- **AboutPage** — простая контентная страница: MainNavbar + секция с центрированным текстом, H1, подзаголовок, абзацы, H2 «Наша миссия», блок фич с иконками.
- **ReadyTours** — список карточек с категориями (кнопки-фильтры), сетка карточек с изображением, ценой, локацией, кнопкой «Подробнее».
- **ExampleTour** — карточка маршрута с остановками (время, название, описание, фото), CTA «Создать маршрут».
- **TravelGallery** — сетка фото с подписью и категорией.
- **Текущий BlogPostPage** — hero с картинкой + H1 в overlay, ниже белая карточка с HTML-контентом и CTA «Планируйте поездку с TRIPGEN». Контент — сплошной HTML (prose), без разбиения на визуальные блоки.

---

## 2. План без кода

### 2.1 Какие компоненты будут использованы (без изменений)
- **MainNavbar** — шапка всех SEO-статей.
- **Footer** — подвал.
- **ScrollToTop** / **ScrollToTopButton** — при необходимости (если страницы длинные).
- Существующие **ui**: Button (если нужен из @/components/ui/button), иконки lucide-react.
- **Link** (react-router-dom) для перелинковки и CTA в /chat.

### 2.2 Какие компоненты будут использованы (с минимальной доработкой)
- Никаких изменений в глобальных стилях или в самих MainNavbar/Footer не предполагается. Опционально: добавить в MainNavbar ссылку «Блог» или оставить вход только из Footer.

### 2.3 Какие новые компоненты нужны
Предлагается ввести **один слой универсальных блоков для travel-статей**, чтобы контент был отделён от вёрстки и можно было собирать лендинг из секций:

1. **TravelArticleLayout** (или **TravelArticlePage**)  
   Обёртка страницы: `MainNavbar` + контент статьи + `Footer`. Принимает `children` или слоты (hero, sections, cta). Устанавливает `document.title` и `meta description` из пропсов (SEO).

2. **TravelArticleHero**  
   Hero в стиле ReadyTourDetailsPage: полноширинное фото, градиент, кнопка «Назад» (на /blog), H1 и опционально подзаголовок/мета (дата, время чтения) внизу слева. Пропсы: `title`, `image`, `backLink`, `subtitle?`, `meta?`.

3. **TravelArticleIntro**  
   Блок ввода: один-два абзаца текста по центру или в колонке, крупный шрифт. Фон — `#FBFBFD` или белый. Пропсы: `children` (текст) или `paragraphs: string[]`.

4. **TravelArticleSection**  
   Секция с H2 и контентом: заголовок секции (как в HowItWorks/Services), под ним разный контент (списки, карточки, текст). Пропсы: `title`, `children`. Стили: как у существующих секций (`text-4xl`/`text-5xl font-semibold`, отступы).

5. **TravelArticleCards** (опционально)  
   Сетка карточек в стиле ReadyTours: изображение, заголовок, короткое описание. Для статей «50 мест» можно разбить по регионам и каждому региону дать блок карточек (фото + название места + 1 строка текста). Пропсы: `items: { image?, title, description?, link? }[]`, `columns?: 2 | 3`.

6. **TravelArticleList**  
   Нумерованный или маркированный список с коротким пояснением (как сейчас в blogPosts — регион + список мест + абзац). Можно оформить как карточки-чипы или два столбца (номер + название). Пропсы: `title?` (H3), `items: string[]`, `description?`, `numbered?: boolean`.

7. **TravelArticleImageBlock**  
   Крупное фото с подписью (опционально). Чтобы разбивать текст визуальными блоками. Пропсы: `src`, `alt`, `caption?`.

8. **TravelArticleCTA**  
   Единый блок CTA в стиле сайта: иконка (MessageCircle), заголовок («Планируйте поездку с TRIPGEN»), короткий текст, кнопка «Создать маршрут» → `/chat`. Вариант: sticky внизу экрана на мобиле (как в макетах лендингов). Пропсы: `title`, `description?`, `buttonText?`.

Новые компоненты — все в папке `src/components/travel-article/` (или `src/components/seo-article/`), экспорт из `index.ts`. Стили только Tailwind, без новых глобальных классов.

### 2.4 Как будет устроен шаблон SEO-статьи
- **Одна страница-шаблон:** например `TravelArticlePage.tsx` (или переиспользовать расширенный вариант текущей логики страницы статьи).  
  Роут: `/blog/:slug` как сейчас.  
  По `slug` выбирается **конфиг статьи** (объект с полями: seoTitle, seoDescription, h1, sections).  
  **Sections** — массив блоков с типом и данными: `{ type: 'hero', ... }`, `{ type: 'intro', ... }`, `{ type: 'section', title, content: ... }`, `{ type: 'cards', items: [...] }`, `{ type: 'list', title, items, description }`, `{ type: 'image', src, caption }`, `{ type: 'cta' }`.  
  Рендер: по очереди рендерить соответствующие компоненты (TravelArticleHero, TravelArticleIntro, TravelArticleSection с разным контентом, TravelArticleCards, TravelArticleList, TravelArticleImageBlock, TravelArticleCTA).  
  Внутри секций — короткие абзацы, списки, перелинковка (ссылки на другие статьи и на /chat) через обычные `<Link>` или `<a>` в тексте.

- **Итоговая структура одной статьи на экране:**  
  1. Hero (фото + H1).  
  2. Intro (1–2 абзаца).  
  3. Несколько секций (H2/H3 + контент): каждая секция — либо подборка карточек, либо список мест/пунктов с кратким текстом, либо блок «фото + подпись».  
  4. В конце — CTA (и при желании sticky CTA на мобиле).  
  Текст — без «стены», короткие абзацы и списки, много воздуха и визуальных блоков.

### 2.5 Как будет выглядеть структура контента
- **Файл данных статей** (например `src/data/travelArticles.ts` или расширение текущего `blogPosts.ts`):  
  Для каждой статьи — объект с полями:
  - `slug`, `seoTitle`, `seoDescription`, `h1`
  - `heroImage`, опционально `heroSubtitle`, `readTime`, `date`
  - `intro` — строка или массив строк (абзацы)
  - `sections` — массив:
    - `{ type: 'section', title: string, content: { type: 'text' | 'list' | 'numbered', paragraphs?: string[], list?: string[], title?: string } }`
    - `{ type: 'cards', title?: string, items: { image?, title, description? }[] }` — для подборок мест с фото
    - `{ type: 'image', src, alt, caption? }`
    - `{ type: 'cta' }` — вставить стандартный CTA
  - `relatedLinks` — массив `{ label, href }` для перелинковки (другие статьи + «Создать маршрут»).

  Контент в данных — только строки и примитивы, без JSX. Рендер списков и карточек — в шаблоне по type.

- **Структура H2/H3:**  
  H2 — заголовки секций (например «Москва и Золотое кольцо», «Север России»).  
  H3 — при необходимости подзаголовки внутри секции (например название региона или «День 1»).  
  Сохраняем текущие SEO-заголовки из заданных статей.

### 2.6 Какие файлы будут созданы или изменены
- **Создать:**
  - `src/components/travel-article/TravelArticleLayout.tsx` (или включить логику в страницу)
  - `src/components/travel-article/TravelArticleHero.tsx`
  - `src/components/travel-article/TravelArticleIntro.tsx`
  - `src/components/travel-article/TravelArticleSection.tsx`
  - `src/components/travel-article/TravelArticleCards.tsx` (опционально, если решим карточки с фото)
  - `src/components/travel-article/TravelArticleList.tsx`
  - `src/components/travel-article/TravelArticleImageBlock.tsx`
  - `src/components/travel-article/TravelArticleCTA.tsx`
  - `src/components/travel-article/index.ts`
  - `src/data/travelArticles.ts` (или существенно расширить `blogPosts.ts` в сторону структурированных секций)
  - При желании: одна «эталонная» статья в виде конфига (например «50 лучших мест России») в `travelArticles.ts`.

- **Изменить:**
  - `src/pages/BlogPostPage.tsx` — перевести на рендер по конфигу и новым компонентам (hero, intro, sections, CTA). Оставить роут `/blog/:slug`.
  - `src/pages/BlogPage.tsx` — по необходимости обновить карточки превью (заголовок, описание, изображение) если поменяем ключи в данных; ссылки остаются `/blog/:slug`.
  - `src/data/blogPosts.ts` — либо заменить на `travelArticles.ts` с новой структурой (и маппинг slug → конфиг), либо добавить рядом новый массив и выбирать источник по slug.

- **Не трогать:**  
  Глобальные стили (index.css, tailwind.config), MainNavbar, Footer, остальные страницы (Landing, About, ReadyTours, ReadyTourDetails и т.д.), роуты кроме использования того же `/blog/:slug`.

---

## 3. Этапы реализации (после согласования плана)

1. **Шаблон и данные**  
   - Добавить типы и структуру конфига статьи (sections с type).  
   - Реализовать компоненты: Hero, Intro, Section, List, ImageBlock, CTA.  
   - Реализовать TravelArticleLayout (или логику в BlogPostPage): SEO (title, meta), рендер по sections.

2. **Одна эталонная статья**  
   - Взять «50 лучших мест России»: hero, intro, секции по регионам (H2 + нумерованный список + короткий абзац), в конце CTA и перелинковка.  
   - Подключить в BlogPostPage по slug, проверить адаптив и тон.

3. **Масштабирование**  
   - Перенести остальные 4 темы в ту же структуру (Куда поехать на выходные, Маршрут Москва 1 день, Маршрут Петербург 2 дня, Куда поехать летом).  
   - Для каждой: title, description, h1, h2/h3, короткий SEO-текст, списки/карточки, фото где есть, CTA и ссылки на другие статьи и /chat.

4. **Полировка**  
   - Sticky CTA на мобиле (опционально).  
   - Проверка перелинковки и доступности.  
   - Финальная вычитка контента и метаданных.

---

## 4. Краткое резюме

- **Стиль:** полностью опираемся на текущий сайт (ReadyTourDetails, ReadyTours, TravelGallery, CTASection, AboutPage): фон #FBFBFD/white, карточки rounded-2xl, черные CTA, Framer Motion.
- **Компоненты:** переиспользуем MainNavbar, Footer; добавляем только блоки в `travel-article/` под лендинговый формат статей.
- **Контент:** отделён от вёрстки (конфиг с sections), удобно редактировать и добавлять новые статьи.
- **Страницы:** те же URL `/blog`, `/blog/:slug`; существующий блог не ломаем, меняем только способ рендера статьи (с сплошного HTML на секции + компоненты).
- **SEO:** title, meta description, H1, H2/H3 сохраняются и при необходимости дополняются из конфига.

Если такой план подходит, следующий шаг — реализация шаблона и одной эталонной статьи («50 лучших мест России»).
