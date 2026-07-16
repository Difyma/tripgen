export type CuratedPlaceType =
  | 'restaurant'
  | 'cafe'
  | 'museum'
  | 'attraction'
  | 'park'
  | 'viewpoint'
  | 'shopping'
  | 'nightlife';

export interface CuratedPlace {
  name: string;
  type: CuratedPlaceType;
  area: string;
  why: string;
  bestTimeToVisit: string;
  priceLevel: string;
  duration: string;
  interests: string[];
}

interface PlaceSearchInput {
  destination: string;
  interests?: string[];
  preferences?: string[];
  budgetMax?: number;
}

const PLACES_BY_DESTINATION: Record<string, CuratedPlace[]> = {
  'москва': [
    { name: 'ГЭС-2', type: 'museum', area: 'Болотная набережная', why: 'современное искусство, архитектура и сильная культурная программа в центре', bestTimeToVisit: 'днем или ранним вечером', priceLevel: 'средний', duration: '1.5-2 часа', interests: ['art', 'architecture', 'culture', 'museum'] },
    { name: 'Патриаршие пруды', type: 'attraction', area: 'Пресня', why: 'короткая прогулка, кафе и вечерняя атмосфера старой Москвы', bestTimeToVisit: 'вечером', priceLevel: 'бесплатно', duration: '45-90 минут', interests: ['walks', 'food', 'local', 'romantic'] },
    { name: 'Северяне', type: 'restaurant', area: 'Большая Никитская', why: 'русская кухня в современной подаче, подходит для ужина без туристического ощущения', bestTimeToVisit: 'ужин', priceLevel: 'выше среднего', duration: '1.5-2 часа', interests: ['food', 'local', 'restaurant'] },
    { name: 'Кофемания на Большой Никитской', type: 'cafe', area: 'Большая Никитская', why: 'удобная точка для завтрака или паузы между прогулками по центру', bestTimeToVisit: 'утро', priceLevel: 'выше среднего', duration: '45-75 минут', interests: ['breakfast', 'coffee', 'comfort'] },
    { name: 'Аптекарский огород', type: 'park', area: 'Проспект Мира', why: 'спокойная зеленая локация, хороша для разгрузки плотного маршрута', bestTimeToVisit: 'утро или день', priceLevel: 'низкий', duration: '1-1.5 часа', interests: ['nature', 'walks', 'family'] },
    { name: 'Центральный рынок на Рождественском', type: 'restaurant', area: 'Трубная', why: 'много кухонь в одном месте, удобно для группы с разными вкусами', bestTimeToVisit: 'обед', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'group', 'casual'] },
  ],
  'санкт-петербург': [
    { name: 'Новая Голландия', type: 'park', area: 'Адмиралтейский район', why: 'еда, прогулка и культурные события в одной компактной локации', bestTimeToVisit: 'днем или вечером', priceLevel: 'средний', duration: '1.5-3 часа', interests: ['walks', 'food', 'culture', 'family'] },
    { name: 'Эрарта', type: 'museum', area: 'Васильевский остров', why: 'понятный вход в современное искусство без перегруза классикой', bestTimeToVisit: 'днем', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'museum', 'culture'] },
    { name: 'Севкабель Порт', type: 'viewpoint', area: 'Васильевский остров', why: 'вид на залив, кафе и расслабленный вечерний сценарий', bestTimeToVisit: 'закат', priceLevel: 'средний', duration: '1.5-2 часа', interests: ['view', 'walks', 'food', 'nightlife'] },
    { name: 'Бекицер', type: 'restaurant', area: 'Рубинштейна', why: 'неформальная еда и оживленная улица для вечернего маршрута', bestTimeToVisit: 'ужин', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'casual', 'nightlife'] },
    { name: 'Подписные издания', type: 'cafe', area: 'Литейный проспект', why: 'книжный магазин с кофейной остановкой, хорошо для неспешного маршрута', bestTimeToVisit: 'утро или день', priceLevel: 'средний', duration: '45-90 минут', interests: ['coffee', 'books', 'local'] },
  ],
  'париж': [
    { name: 'Musée d’Orsay', type: 'museum', area: '7-й округ', why: 'импрессионисты и сильная коллекция в красивом здании бывшего вокзала', bestTimeToVisit: 'утро', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'museum', 'culture'] },
    { name: 'Le Marais', type: 'attraction', area: '3-4-й округа', why: 'бутики, галереи, еда и исторические улицы без длинных переездов', bestTimeToVisit: 'день', priceLevel: 'бесплатно', duration: '2-3 часа', interests: ['walks', 'shopping', 'food', 'architecture'] },
    { name: 'Bouillon République', type: 'restaurant', area: 'République', why: 'классическая французская еда по умеренной цене и быстрый формат', bestTimeToVisit: 'обед или ужин', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'budget', 'local'] },
    { name: 'Café de Flore', type: 'cafe', area: 'Saint-Germain-des-Prés', why: 'иконическое кафе для завтрака или кофе в классическом Париже', bestTimeToVisit: 'утро', priceLevel: 'выше среднего', duration: '45-75 минут', interests: ['coffee', 'classic', 'romantic'] },
    { name: 'Parc des Buttes-Chaumont', type: 'park', area: '19-й округ', why: 'менее очевидный парк с видами и хорошей паузой от музеев', bestTimeToVisit: 'день', priceLevel: 'бесплатно', duration: '1-2 часа', interests: ['nature', 'walks', 'view'] },
  ],
  'стамбул': [
    { name: 'Айя-София', type: 'attraction', area: 'Султанахмет', why: 'главная историческая точка, которую удобно связать с Голубой мечетью и цистерной', bestTimeToVisit: 'утро', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['history', 'architecture', 'culture'] },
    { name: 'Цистерна Базилика', type: 'museum', area: 'Султанахмет', why: 'атмосферная короткая остановка рядом с главными достопримечательностями', bestTimeToVisit: 'день', priceLevel: 'средний', duration: '45-60 минут', interests: ['history', 'architecture'] },
    { name: 'Karaköy Lokantası', type: 'restaurant', area: 'Каракёй', why: 'турецкая кухня в удобном районе между Галатой и набережной', bestTimeToVisit: 'обед или ужин', priceLevel: 'выше среднего', duration: '1.5 часа', interests: ['food', 'local', 'restaurant'] },
    { name: 'Galata Konak Cafe', type: 'cafe', area: 'Галата', why: 'кофе и видовые террасы рядом с Галатской башней', bestTimeToVisit: 'закат', priceLevel: 'средний', duration: '45-75 минут', interests: ['coffee', 'view', 'romantic'] },
    { name: 'Kadıköy Çarşı', type: 'shopping', area: 'Кадыкёй', why: 'рынок, уличная еда и более локальная азиатская сторона города', bestTimeToVisit: 'день или вечер', priceLevel: 'средний', duration: '2-3 часа', interests: ['food', 'local', 'shopping', 'walks'] },
  ],
  'дубай': [
    { name: 'Alserkal Avenue', type: 'museum', area: 'Al Quoz', why: 'галереи, дизайн-пространства и кафе за пределами моллового Дубая', bestTimeToVisit: 'днем', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'culture', 'coffee'] },
    { name: 'Dubai Creek Harbour', type: 'viewpoint', area: 'Creek Harbour', why: 'виды на skyline и спокойная прогулка у воды', bestTimeToVisit: 'закат', priceLevel: 'бесплатно', duration: '1-1.5 часа', interests: ['view', 'walks', 'romantic'] },
    { name: 'Arabian Tea House', type: 'restaurant', area: 'Al Fahidi', why: 'понятное знакомство с эмиратской кухней рядом с историческим кварталом', bestTimeToVisit: 'завтрак или обед', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'local', 'history'] },
    { name: 'Museum of the Future', type: 'museum', area: 'Trade Centre', why: 'зрелищная архитектура и интерактивный формат для первого визита', bestTimeToVisit: 'утро', priceLevel: 'выше среднего', duration: '2 часа', interests: ['architecture', 'family', 'museum'] },
    { name: 'Time Out Market Dubai', type: 'restaurant', area: 'Souk Al Bahar', why: 'много ресторанных концепций в одном месте рядом с фонтанами', bestTimeToVisit: 'ужин', priceLevel: 'средний', duration: '1.5-2 часа', interests: ['food', 'group', 'view'] },
  ],
};

const DESTINATION_ALIASES: Record<string, string> = {
  'moscow': 'москва',
  'питер': 'санкт-петербург',
  'петербург': 'санкт-петербург',
  'saint petersburg': 'санкт-петербург',
  'st petersburg': 'санкт-петербург',
  'spb': 'санкт-петербург',
  'paris': 'париж',
  'istanbul': 'стамбул',
  'dubai': 'дубай',
};

const INTEREST_SYNONYMS: Record<string, string[]> = {
  food: ['еда', 'ресторан', 'рестораны', 'кафе', 'гастроном', 'кухня', 'food'],
  art: ['искусство', 'галерея', 'галереи', 'art'],
  museum: ['музей', 'музеи', 'museum'],
  culture: ['культура', 'история', 'архитектура', 'culture'],
  walks: ['гулять', 'прогулки', 'пешком', 'walk'],
  nature: ['природа', 'парк', 'зелень', 'nature'],
  shopping: ['шопинг', 'магазины', 'shopping'],
  nightlife: ['бар', 'бары', 'вечер', 'nightlife'],
  family: ['дети', 'ребенок', 'семья', 'family'],
  romantic: ['романтика', 'романтич', 'пара', 'romantic'],
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

function destinationKey(destination: string): string | null {
  const normalized = normalizeText(destination);
  for (const [alias, key] of Object.entries(DESTINATION_ALIASES)) {
    if (normalized.includes(normalizeText(alias))) return key;
  }
  return Object.keys(PLACES_BY_DESTINATION).find((key) => normalized.includes(normalizeText(key))) || null;
}

function normalizedInterests(values: string[]): Set<string> {
  const source = values.map(normalizeText).filter(Boolean);
  const result = new Set<string>();
  for (const value of source) {
    result.add(value);
    for (const [canonical, synonyms] of Object.entries(INTEREST_SYNONYMS)) {
      if (synonyms.some((synonym) => value.includes(normalizeText(synonym)))) result.add(canonical);
    }
  }
  return result;
}

function scorePlace(place: CuratedPlace, interests: Set<string>, budgetMax?: number): number {
  let score = 0;
  for (const interest of place.interests) {
    if (interests.has(interest)) score += 4;
  }
  if (place.type === 'restaurant' || place.type === 'cafe') score += interests.has('food') ? 3 : 1;
  if (budgetMax && budgetMax < 70000 && place.priceLevel === 'выше среднего') score -= 2;
  if (place.priceLevel === 'бесплатно') score += 1;
  return score;
}

export function searchCuratedPlaces(input: PlaceSearchInput): CuratedPlace[] {
  const key = destinationKey(input.destination);
  const places = key ? PLACES_BY_DESTINATION[key] || [] : [];
  const interests = normalizedInterests([...(input.interests || []), ...(input.preferences || [])]);
  return [...places]
    .sort((a, b) => scorePlace(b, interests, input.budgetMax) - scorePlace(a, interests, input.budgetMax))
    .slice(0, 12);
}

export function formatPlacesForPrompt(places: CuratedPlace[], destination: string): string {
  if (places.length === 0) {
    return '\n\n# 📍 Места и заведения\n\nНет проверенного списка мест для этого направления. Можно рекомендовать общеизвестные реальные места, но не выдумывать адреса, рейтинги и часы работы.\n';
  }

  let text = '\n\n# 📍 Проверенные места и заведения для маршрута\n\n';
  places.forEach((place, index) => {
    const query = encodeURIComponent(`${place.name} ${destination}`);
    text += `### ${index + 1}. ${place.name}\n`;
    text += `- **Тип:** ${place.type}\n`;
    text += `- **Район:** ${place.area}\n`;
    text += `- **Почему подходит:** ${place.why}\n`;
    text += `- **Лучшее время:** ${place.bestTimeToVisit}\n`;
    text += `- **Бюджет:** ${place.priceLevel}\n`;
    text += `- **Время на месте:** ${place.duration}\n`;
    text += `- **Google Maps:** https://www.google.com/maps/search/?api=1&query=${query}\n\n`;
  });
  text += '⚠️ Для placeRecommendations и маршрута в первую очередь используй эти места. Если добавляешь другое место, оно должно быть общеизвестным и реально существующим.\n';
  return text;
}
