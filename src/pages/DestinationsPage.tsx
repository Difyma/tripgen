import { useEffect, useState } from 'react';
import { MainNavbar } from '../components/MainNavbar';
import Footer from '../components/Footer';
import { AuthModal } from '../components/AuthModal';
import { Link } from 'react-router-dom';

export function DestinationsPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    document.title =
      'Направления для путешествий по России — города, регионы и маршруты | TRIPGEN';
    const metaDescription =
      'Выберите направление для путешествия по России: Золотое кольцо, Карелия, Байкал, Алтай, Кавказ и другие регионы. Постройте маршрут поездки с TRIPGEN.';

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = metaDescription;
  }, []);

  // Блок 1: популярные направления (регионы)
  const regionSections = [
    {
      slug: 'moskva-zolotoe-kolco',
      title: 'Москва и Золотое кольцо',
      description:
        'Исторический центр России с древними городами, монастырями и кремлями. Идеальное направление для первого путешествия по России.',
      highlights: ['Москва', 'Сергиев Посад', 'Суздаль', 'Владимир', 'Коломна'],
    },
    {
      slug: 'sever-rossii',
      title: 'Север России',
      description:
        'Карелия, Кольский полуостров и Архангельская область. Северное сияние, озёра, леса и деревянная архитектура.',
      highlights: ['Карелия', 'Кольский полуостров', 'Соловки'],
    },
    {
      slug: 'yug-rossii',
      title: 'Юг России',
      highlights: ['Сочи', 'Абхазия', 'Дагестан', 'Кабардино-Балкария'],
    },
    {
      slug: 'ural',
      title: 'Урал',
      description:
        'Горы между Европой и Азией, национальные парки и индустриальная история. Урал подойдёт тем, кто любит треккинг и активные маршруты.',
      highlights: ['Екатеринбург', 'Таганай', 'Зюраткуль'],
    },
    {
      slug: 'sibir',
      title: 'Сибирь',
      description:
        'Байкал, Алтай и бескрайние природные пространства. Регион для тех, кто любит дикую природу, походы и настоящие экспедиции.',
      highlights: ['Байкал', 'Алтай', 'Хакасия'],
    },
    {
      slug: 'dalniy-vostok',
      title: 'Дальний Восток',
      description:
        'Камчатка, Владивосток, Сахалин и Курильские острова. Вулканы, океан, горячие источники и совершенно другой ритм путешествия.',
      highlights: ['Камчатка', 'Сахалин', 'Курильские острова'],
    },
    {
      slug: 'priroda-rossii',
      title: 'Природа России',
      description:
        'Самые красивые природные места России: Байкал, Алтай, Камчатка, Карелия и национальные парки. От коротких прогулок до сложных походов.',
      highlights: ['Байкал', 'Алтай', 'Камчатка', 'Карелия'],
    },
  ];

  // Блок 2: популярные города
  const cityCards = [
    { name: 'Москва', slug: 'moskva' },
    { name: 'Санкт-Петербург', slug: 'spb' },
    { name: 'Казань', slug: 'kazan' },
    { name: 'Сочи', slug: 'sochi' },
    { name: 'Владивосток', slug: 'vladivostok' },
    { name: 'Екатеринбург', slug: 'ekaterinburg' },
    { name: 'Красноярск', slug: 'krasnoyarsk' },
    { name: 'Иркутск', slug: 'irkutsk' },
  ];

  // Блок 3: типы путешествий
  const tripTypes = [
    {
      title: 'Путешествия на выходные',
      description: 'Куда поехать на 2–3 дня из Москвы или Санкт-Петербурга.',
    },
    {
      title: 'Природные маршруты',
      description: 'Национальные парки, горы и заповедники России.',
    },
    {
      title: 'Исторические города',
      description: 'Древние города России и культурные маршруты.',
    },
    {
      title: 'Горные путешествия',
      description: 'Кавказ, Алтай и Урал: треккинги, перевалы и панорамы.',
    },
    {
      title: 'Морские курорты',
      description: 'Черное море и дальневосточные побережья России.',
    },
  ];

  // Блок 4: маршруты
  const routeCards = [
    { title: 'Маршрут по Золотому кольцу', slug: 'moskva-zolotoe-kolco' },
    { title: 'Маршрут по Карелии', slug: 'sever-rossii' },
    { title: 'Маршрут по Байкалу', slug: 'sibir' },
    { title: 'Маршрут по Алтаю', slug: 'sibir' },
    { title: 'Маршрут по Кавказу', slug: 'yug-rossii' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <MainNavbar onAuthClick={() => setIsAuthModalOpen(true)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <main className="pt-20 pb-16">
        {/* Hero + вступление */}
        <section className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-gradient-to-b from-[#EEF4FF] via-[#FBFBFD] to-[#FBFBFD]">
          <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Направления для путешествий по России
              </h1>
              <p className="text-base md:text-lg text-gray-600 mb-3 max-w-3xl">
                Россия — одна из самых больших стран мира, и путешествия здесь могут быть совершенно
                разными. От старинных городов Золотого кольца до вулканов Камчатки, от северных озёр
                Карелии до гор Кавказа.
              </p>
              <p className="text-base md:text-lg text-gray-600 mb-3 max-w-3xl">
                На этой странице собраны популярные направления для путешествий по России. Вы можете
                выбрать регион, узнать основные достопримечательности и построить маршрут поездки.
              </p>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-3xl">
                TRIPGEN помогает быстро спланировать путешествие: подобрать города, достопримечательности
                и оптимальный маршрут по вашему стилю отдыха.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/blog/50-luchshih-mest-rossii"
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-900 transition-colors shadow-sm"
                >
                  50 лучших мест России
                </Link>
                <Link
                  to="/tours"
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Смотреть готовые туры
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative w-full h-56 lg:h-64 rounded-[32px] overflow-hidden bg-gradient-to-tr from-[#0B1220] via-[#1F2937] to-[#4B5563] shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_52%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_55%)]" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
                    01 · Наш подход
                  </p>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold leading-snug">
                      Не просто список направлений, а умный конструктор путешествий.
                    </p>
                    <p className="text-xs text-white/70 max-w-xs">
                      Подберём комбинацию городов, природы и активности под ваши даты и бюджет.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-3 py-1 rounded-full bg-white/12 backdrop-blur-md">
                      Золотое кольцо
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/12 backdrop-blur-md">
                      Карелия
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/12 backdrop-blur-md">
                      Байкал
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/12 backdrop-blur-md">
                      Кавказ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Блок 1. Популярные направления (регионы) */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Популярные направления
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 max-w-3xl">
              Кластеры направлений, по которым проще всего начинать планировать путешествие: от
              классических маршрутов до экспедиционных регионов.
            </p>
            <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {regionSections.map((section) => (
                <article
                  key={section.slug}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-[#094D92] via-[#316B63] to-[#F5B942] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {section.highlights.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <Link
                        to={`/blog/${section.slug}`}
                        className="text-sm font-medium text-[#094D92] hover:underline"
                      >
                        Читать гид по региону
                      </Link>
                      <Link
                        to={`/chat?q=${encodeURIComponent(
                          `Хочу спланировать путешествие по региону: ${section.title}. Помоги подобрать маршрут или готовый тур.`
                        )}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs md:text-sm font-medium hover:bg-gray-900 transition-colors whitespace-nowrap"
                      >
                        <span className="whitespace-nowrap">Спросить TRIPGEN</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Блок 2. Популярные города */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Популярные города для путешествий
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 max-w-3xl">
              Города, с которых чаще всего начинают знакомство с Россией — от мегаполисов с музеями
              мирового уровня до городов у моря.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {cityCards.map((city) => (
                <Link
                  key={city.slug}
                  to={`/blog/${city.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-white hover:via-white hover:to-white hover:shadow-md transition-all px-4 py-3 flex flex-col justify-between"
                >
                  <span className="text-sm font-medium text-gray-900 group-hover:text-[#094D92]">
                    {city.name}
                  </span>
                  <span className="mt-1 text-xs text-gray-500 group-hover:text-gray-700 flex items-center gap-1">
                    <span>Гид по городу и маршруты</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Блок 3. Типы путешествий */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Популярные типы путешествий
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 max-w-3xl">
              Подберите формат отдыха: короткий уикенд, природный маршрут или экспедицию в горы —
              TRIPGEN подстроит маршрут под ваш запрос.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tripTypes.map((type) => (
                <div
                  key={type.title}
                  className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1.5"
                >
                  <h3 className="text-sm font-semibold text-gray-900">{type.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Блок 4. Маршруты путешествий */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Маршруты путешествий по России
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 max-w-3xl">
              Несколько базовых маршрутов, которые можно взять за основу и адаптировать под свои
              даты, темп и бюджет.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {routeCards.map((route) => (
                <Link
                  key={route.title}
                  to={`/blog/${route.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all px-5 py-4 flex flex-col justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 mb-1.5 group-hover:text-[#094D92]">
                    {route.title}
                  </span>
                  <span className="text-xs text-gray-600 flex items-center gap-1 group-hover:text-gray-800">
                    <span>Смотреть маршрут</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Блок 5. CTA: спланировать путешествие */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
          <div className="max-w-4xl mx-auto rounded-3xl bg-black text-white px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                Не знаете, куда поехать?
              </h2>
              <p className="text-sm md:text-base text-white/80 max-w-xl">
                TRIPGEN создаст персональный маршрут путешествия по России за несколько секунд.
                Укажите даты, бюджет и формат отдыха — и получите готовый план поездки.
              </p>
            </div>
            <Link
              to="/chat"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Создать маршрут
            </Link>
          </div>
        </section>

        {/* Блок 6. Когда лучше путешествовать по России */}
        <section className="px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 bg-gradient-to-b from-white to-[#F5F5FA]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-4">
              Когда лучше путешествовать по России
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-5 max-w-3xl">
              В России можно путешествовать круглый год — важно только выбрать правильный сезон под
              ваш маршрут. Ниже кратко по временам года.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm text-gray-700">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900">Весна</h3>
                <p className="text-sm text-gray-600">
                  Цветение на Кавказе, поездки по югу России и первые тёплые прогулки по городам.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900">Лето</h3>
                <p className="text-sm text-gray-600">
                  Поездки на Байкал, Алтай, Карелию и Север России. Оптимальное время для природных
                  маршрутов.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900">Осень</h3>
                <p className="text-sm text-gray-600">
                  Золотое кольцо и города России в осенних красках. Комфортная погода и меньше
                  туристов.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900">Зима</h3>
                <p className="text-sm text-gray-600">
                  Северное сияние, зимние маршруты по Карелии и Мурманской области, горнолыжные
                  курорты Кавказа и Сибири.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

