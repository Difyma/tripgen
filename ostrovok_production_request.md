# Запрос на доступ к Production API Ostrovok

**Кому:** partners@ostrovok.ru / api@ostrovok.ru  
**Тема:** Запрос на активацию Production API доступа — Partner ID 270392.affiliate.a0bd

---

Dear Ostrovok Team,

We are writing to request activation of **production API access** for our travel platform integration.

## About Our Project

**TripGen AI** — AI-powered travel planning platform that helps users plan trips, find hotels, and book accommodations through intelligent chat interface.

- **Website:** [your-website.com]
- **Product:** AI Travel Assistant with hotel search and booking
- **Target Audience:** Russian-speaking travelers planning trips worldwide
- **Monthly Active Users:** [X,XXX] (projected)

## Current Integration Status ✅

We have successfully completed integration with **Ostrovok B2B API** using test credentials:

- **Partner Slug:** `270392.affiliate.a0bd`
- **Key ID:** `12984`
- **Test API URL:** `https://partner-api.ostrovok.ru`

### What Works:
1. ✅ API Authentication (Key ID + API Token)
2. ✅ Hotel search via `/api/b2b/v3/search/serp/region/`
3. ✅ Hotel details via `/api/b2b/v3/search/serp/hotels/`
4. ✅ Partner link generation with proper attribution
5. ✅ Test hotel booking flow verified

### Test Hotel Verification:
We confirmed the integration works correctly with test hotel:
- **URL:** `https://ostrovok.ru/rooms/test_hotel/?utm_medium=partners&partner_slug=270392.affiliate.a0bd`
- **Booking flow:** Tested and functional
- **Attribution:** All UTM parameters and partner_slug correctly passed

## Production Access Request

We are ready to launch our integration and request:

1. **Production API credentials** for `api.worldota.net`
2. **Confirmation of affiliate terms** — commission rates and payment schedule
3. **API rate limits** for production environment
4. **Technical contact** for ongoing integration support

## Integration Details

### API Endpoints Used:
```
POST /api/b2b/v3/search/serp/region/     # Search by region
POST /api/b2b/v3/search/serp/hotels/     # Search by hotel IDs
GET  /api/b2b/v3/search/init/            # Search initialization
GET  /api/b2b/v3/hotelpage/              # Hotel details
GET  /api/b2b/v3/geo/                    # Geo data
```

### Link Format Used:
```
https://www.ostrovok.ru/rooms/{hotel_slug}/
  ?utm_medium=partners
  &partner_slug=270392.affiliate.a0bd
  &utm_source=270392.affiliate.a0bd
  &dates={checkin-checkout}
  &guests={guests}
```

## Compliance & Requirements

- ✅ **Attribution:** All links include `partner_slug` and `utm_medium=partners`
- ✅ **Test bookings:** We understand test hotels must be cancelled
- ✅ **Real bookings:** We will only promote real, bookable properties
- ✅ **Deep links:** Using `/rooms/{slug}/` format as per documentation

## Contact Information

**Technical Contact:**  
Name: [Your Name]  
Email: [your-email@company.com]  
Phone: [+7 XXX XXX XX XX]

**Business Contact:**  
Name: [Business Manager Name]  
Email: [business-email@company.com]

**Company Details:**  
Legal Name: [Your Company Legal Name]  
INN: [ИНН компании]  
Website: [your-website.com]

---

Please let us know what additional information or documentation is required to proceed with production access activation.

We are excited to launch this integration and start driving bookings through Ostrovok platform!

Best regards,  
[Your Name]  
[Your Title]  
[Company Name]

---

## Дополнительно (если нужен перевод на русский)

**Кому:** partners@ostrovok.ru  
**Тема:** Запрос на активацию Production API — Partner ID 270392.affiliate.a0bd

Здравствуйте!

Мы завершили интеграцию с Ostrovok B2B API и готовы к запуску. Просим активировать production-доступ.

**О проекте:**
- TripGen AI — AI-платформа для планирования путешествий
- Интеграция готова, тестовый отель работает корректно
- Генерация ссылок с partner_slug 270392.affiliate.a0bd

**Запрашиваем:**
1. Доступ к api.worldota.net (production)
2. Условия affiliate-программы
3. Rate limits для production

Контакты: [ваш email]

Спасибо!
