export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  /** SEO: title страницы (document.title) */
  seoTitle: string;
  /** SEO: meta description */
  seoDescription: string;
  /** H1 на странице (часто совпадает с title) */
  h1: string;
  excerpt: string;
  image: string;
  date: string;
  author?: string;
  readTime?: string;
  /** HTML-контент с H2/H3, списками, перелинковкой */
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: '50-luchshih-mest-rossii',
    title: '50 лучших мест России для путешествий',
    seoTitle: '50 лучших мест России для путешествий — куда поехать в России',
    seoDescription: 'Подборка 50 лучших мест России для путешествий: Байкал, Алтай, Камчатка, Карелия, Москва и Петербург. Идеи для отдыха и маршрутов по России.',
    h1: '50 лучших мест России для путешествий',
    excerpt: 'Байкал, Алтай, Камчатка, Карелия, Москва и Петербург — 50 мест, которые стоит увидеть.',
    image: '/images/Traveling_around_Karelia.jpg',
    date: '2024-03-15',
    author: 'TRIPGEN',
    readTime: '8 мин',
    content: `
      <p>Россия — одна из самых разнообразных стран для путешествий. Здесь можно увидеть древние города, горы, моря, озера и уникальную природу. Мы собрали список из <strong>50 лучших мест России</strong>, которые стоит посетить.</p>

      <h2>Москва и Золотое кольцо</h2>
      <ol class="list-decimal list-inside space-y-1 my-4">
        <li>Москва</li>
        <li>Сергиев Посад</li>
        <li>Суздаль</li>
        <li>Владимир</li>
        <li>Переславль-Залесский</li>
        <li>Ростов Великий</li>
        <li>Ярославль</li>
        <li>Коломна</li>
      </ol>
      <p>Эти города известны древними монастырями, кремлями и историей России.</p>

      <h2>Север России</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="9">
        <li>Санкт-Петербург</li>
        <li>Петергоф</li>
        <li>Выборг</li>
        <li>Карелия</li>
        <li>Кижи</li>
        <li>Соловецкие острова</li>
        <li>Мурманск</li>
        <li>Териберка</li>
      </ol>
      <p>Север России славится суровой природой и северным сиянием.</p>

      <h2>Юг России</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="17">
        <li>Сочи</li>
        <li>Красная Поляна</li>
        <li>Анапа</li>
        <li>Геленджик</li>
        <li>Крым</li>
        <li>Ялта</li>
        <li>Севастополь</li>
        <li>Дагестан</li>
      </ol>
      <p>Здесь море, горы и теплый климат.</p>

      <h2>Урал</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="25">
        <li>Екатеринбург</li>
        <li>Пермь</li>
        <li>Каменный город</li>
        <li>Таганай</li>
      </ol>

      <h2>Сибирь</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="29">
        <li>Байкал</li>
        <li>Иркутск</li>
        <li>остров Ольхон</li>
        <li>Красноярские столбы</li>
        <li>Новосибирск</li>
        <li>Томск</li>
        <li>Алтай</li>
      </ol>

      <h2>Дальний Восток</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="36">
        <li>Владивосток</li>
        <li>Камчатка</li>
        <li>Сахалин</li>
        <li>Курильские острова</li>
        <li>Шантарские острова</li>
      </ol>

      <h2>Уникальные природные места</h2>
      <ol class="list-decimal list-inside space-y-1 my-4" start="41">
        <li>Эльбрус</li>
        <li>Домбай</li>
        <li>Архыз</li>
        <li>Плато Путорана</li>
        <li>Ленские столбы</li>
        <li>Чарские пески</li>
        <li>Кольский полуостров</li>
        <li>Куршская коса</li>
        <li>Шиханы</li>
        <li>Озеро Баскунчак</li>
      </ol>
      <p class="mt-8">Планируете поездку? <a href="/chat" class="text-[#094D92] font-medium hover:underline">Составьте маршрут с TRIPGEN</a> под свои даты и бюджет. Также читайте: <a href="/blog/kuda-poehat-letom-v-rossii" class="text-[#094D92] font-medium hover:underline">куда поехать летом в России</a> и <a href="/blog/marshrut-po-moskve-1-den" class="text-[#094D92] font-medium hover:underline">маршрут по Москве на 1 день</a>.</p>
    `
  },
  {
    id: '2',
    slug: 'kuda-poehat-na-vyhodnye',
    title: 'Куда поехать на выходные',
    seoTitle: 'Куда поехать на выходные — лучшие идеи коротких путешествий',
    seoDescription: 'Лучшие идеи, куда поехать на выходные: города России, природа, маршруты на 2 дня и короткие путешествия.',
    h1: 'Куда поехать на выходные',
    excerpt: 'Суздаль, Коломна, природа — идеи поездок на 2 дня.',
    image: '/images/Traveling_around_Altai.jpg',
    date: '2024-03-10',
    author: 'TRIPGEN',
    readTime: '5 мин',
    content: `
      <p>Иногда достаточно двух дней, чтобы сменить обстановку и увидеть новое место. Ниже — идеи, <strong>куда поехать на выходные</strong>: города и природа.</p>

      <h2>Лучшие города для поездки на выходные</h2>

      <h3>Суздаль</h3>
      <p>Один из самых атмосферных городов России. Здесь старинные монастыри, деревянные дома и красивые виды.</p>

      <h3>Коломна</h3>
      <p>Город рядом с Москвой с кремлем, музеями и известной пастилой.</p>

      <h3>Сергиев Посад</h3>
      <p>Главная достопримечательность — Троице-Сергиева лавра.</p>

      <h2>Куда поехать на природу</h2>
      <p>Если хочется уехать из города:</p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Карелия</li>
        <li>Алтай</li>
        <li>Байкал</li>
        <li>Домбай</li>
      </ul>
      <p>Здесь можно гулять по горам, кататься на лодках и отдыхать на природе.</p>
      <p class="mt-6">Больше идей: <a href="/blog/50-luchshih-mest-rossii" class="text-[#094D92] font-medium hover:underline">50 лучших мест России</a> и <a href="/blog/kuda-poehat-letom-v-rossii" class="text-[#094D92] font-medium hover:underline">куда поехать летом</a>. <a href="/chat" class="text-[#094D92] font-medium hover:underline">Создать маршрут с TRIPGEN</a>.</p>
    `
  },
  {
    id: '3',
    slug: 'marshrut-po-moskve-1-den',
    title: 'Маршрут по Москве на 1 день',
    seoTitle: 'Маршрут по Москве на 1 день — что посмотреть за один день',
    seoDescription: 'Готовый маршрут по Москве на один день: Красная площадь, Кремль, Зарядье, Арбат и Москва-Сити.',
    h1: 'Маршрут по Москве на 1 день',
    excerpt: 'Красная площадь, Зарядье, центр и Москва-Сити за один день.',
    image: '/images/Traveling_around_Baikal.jpg',
    date: '2024-03-05',
    author: 'TRIPGEN',
    readTime: '4 мин',
    content: `
      <p>Если у вас всего один день в Москве, можно увидеть главные достопримечательности. Ниже — готовый <strong>маршрут по Москве на 1 день</strong>.</p>

      <h2>Утро — Красная площадь</h2>
      <p>Начать день лучше с главной площади России.</p>
      <p><strong>Что посмотреть:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Кремль</li>
        <li>Собор Василия Блаженного</li>
        <li>ГУМ</li>
      </ul>
      <p>После этого можно пройти в парк Зарядье.</p>

      <h2>День — прогулка по центру</h2>
      <p><strong>Маршрут прогулки:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Красная площадь</li>
        <li>Никольская улица</li>
        <li>Лубянка</li>
        <li>Чистые пруды</li>
      </ul>

      <h2>Вечер — Москва-Сити</h2>
      <p>Вечером можно:</p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>подняться на смотровую площадку</li>
        <li>прокатиться на речном трамвае</li>
        <li>прогуляться по Арбату</li>
      </ul>
      <p class="mt-6">Ещё маршруты: <a href="/blog/marshrut-po-sankt-peterburgu-2-dnya" class="text-[#094D92] font-medium hover:underline">Петербург на 2 дня</a>, <a href="/blog/50-luchshih-mest-rossii" class="text-[#094D92] font-medium hover:underline">50 мест России</a>. <a href="/chat" class="text-[#094D92] font-medium hover:underline">Спланировать поездку с TRIPGEN</a>.</p>
    `
  },
  {
    id: '4',
    slug: 'marshrut-po-sankt-peterburgu-2-dnya',
    title: 'Маршрут по Санкт-Петербургу на 2 дня',
    seoTitle: 'Маршрут по Санкт-Петербургу на 2 дня — что посмотреть',
    seoDescription: 'Лучший маршрут по Санкт-Петербургу на два дня: Эрмитаж, Невский проспект, Исаакиевский собор и Петергоф.',
    h1: 'Маршрут по Санкт-Петербургу на 2 дня',
    excerpt: 'День в центре и день в пригородах — Эрмитаж, Петергоф, Царское Село.',
    image: '/images/Traveling_around_Karelia.jpg',
    date: '2024-03-01',
    author: 'TRIPGEN',
    readTime: '5 мин',
    content: `
      <p>Петербург — один из самых красивых городов Европы. За два дня можно посмотреть основные достопримечательности. Ниже — <strong>маршрут по Санкт-Петербургу на 2 дня</strong>.</p>

      <h2>День 1 — центр города</h2>
      <p><strong>Маршрут:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Дворцовая площадь</li>
        <li>Эрмитаж</li>
        <li>Невский проспект</li>
        <li>Казанский собор</li>
        <li>Исаакиевский собор</li>
      </ul>
      <p>Вечером можно посмотреть развод мостов.</p>

      <h2>День 2 — дворцы</h2>
      <p><strong>Лучшие места:</strong></p>

      <h3>Петергоф</h3>
      <p>Известен своими фонтанами и парками.</p>

      <h3>Царское Село</h3>
      <p>Здесь находится Екатерининский дворец и Янтарная комната.</p>
      <p class="mt-6">Полезно: <a href="/blog/marshrut-po-moskve-1-den" class="text-[#094D92] font-medium hover:underline">маршрут по Москве на 1 день</a>, <a href="/blog/50-luchshih-mest-rossii" class="text-[#094D92] font-medium hover:underline">50 лучших мест России</a>. <a href="/chat" class="text-[#094D92] font-medium hover:underline">Построить маршрут с TRIPGEN</a>.</p>
    `
  },
  {
    id: '5',
    slug: 'kuda-poehat-letom-v-rossii',
    title: 'Куда поехать летом в России',
    seoTitle: 'Куда поехать летом в России — лучшие направления',
    seoDescription: 'Лучшие места для отдыха летом в России: Байкал, Алтай, Карелия, Камчатка и море.',
    h1: 'Куда поехать летом в России',
    excerpt: 'Байкал, Алтай, Карелия и Камчатка — лучшие направления для лета.',
    image: '/images/Traveling_around_Kamchatka.jpg',
    date: '2024-02-20',
    author: 'TRIPGEN',
    readTime: '6 мин',
    content: `
      <p>Лето — лучшее время для путешествий по России. Ниже — идеи, <strong>куда поехать летом в России</strong>: Байкал, Алтай, Карелия и Камчатка.</p>

      <h2>Байкал</h2>
      <p>Самое глубокое озеро в мире.</p>
      <p><strong>Лучшие места:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>остров Ольхон</li>
        <li>Листвянка</li>
        <li>бухта Песчаная</li>
      </ul>

      <h2>Алтай</h2>
      <p>Один из самых красивых регионов России.</p>
      <p><strong>Что посмотреть:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Чуйский тракт</li>
        <li>Телецкое озеро</li>
        <li>долину Катуни</li>
      </ul>

      <h2>Карелия</h2>
      <p>Популярное направление для путешествий летом.</p>
      <p><strong>Главные места:</strong></p>
      <ul class="list-disc list-inside space-y-1 my-4">
        <li>Рускеала</li>
        <li>Ладожские шхеры</li>
        <li>Кижи</li>
      </ul>
      <p class="mt-6">Подборка направлений: <a href="/blog/50-luchshih-mest-rossii" class="text-[#094D92] font-medium hover:underline">50 лучших мест России</a>, <a href="/blog/kuda-poehat-na-vyhodnye" class="text-[#094D92] font-medium hover:underline">куда поехать на выходные</a>. <a href="/chat" class="text-[#094D92] font-medium hover:underline">Составить маршрут с TRIPGEN</a>.</p>
    `
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
