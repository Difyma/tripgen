# ETG API Integration Diagram - TripGen AI

**Partner ID:** 270392.affiliate.a0bd  
**Website:** https://www.tripgen.ru

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                         https://www.tripgen.ru                              │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  AI Chat     │    │  Hotel Cards │    │  Book Button │                  │
│  │  Interface   │───▶│  Display     │───▶│  (Redirect)  │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRIPGEN AI BACKEND                                 │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  AI Processing  │    │  Search Logic   │    │  Link Generator │         │
│  │  (NLP)          │───▶│  & API Client   │───▶│  (Partner URLs) │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ETG (OSTROVOK) API                                  │
│                    https://partner-api.ostrovok.ru                          │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  /search/serp/  │    │  /hotel/info/   │    │  /geo/          │         │
│  │  region/hotels  │    │  (static data)  │    │  (destinations) │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OSTROVOK.RU WEBSITE                                 │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                                 │
│  │  Hotel Page     │    │  Booking Form   │                                 │
│  │  (test_hotel)   │    │  (Payment)      │                                 │
│  └─────────────────┘    └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Mapping

| TripGen AI Feature | ETG API Endpoint | Method | Purpose |
|-------------------|------------------|--------|---------|
| **Search Hotels by City** | `/api/b2b/v3/search/serp/region/` | POST | Search hotels in destination |
| **Search Hotels by ID** | `/api/b2b/v3/search/serp/hotels/` | POST | Get specific hotel rates |
| **Get Hotel Details** | `/api/b2b/v3/hotel/info/` | GET | Static hotel information |
| **Get Destinations** | `/api/b2b/v3/geo/` | GET | Region/city data |
| **Test Hotel** | `hid=1` (test_hotel) | - | Certification testing |

---

## Data Flow

### 1. User Search Flow
```
User: "Найди отели в Москве"
    │
    ▼
AI NLP: Extract destination = "Moscow"
    │
    ▼
TripGen Backend: POST /search/serp/region/
    │
    ▼
ETG API: Return hotel list with rates
    │
    ▼
TripGen: Display hotels with photos, prices, amenities
    │
    ▼
User: Clicks "Забронировать"
    │
    ▼
TripGen: Generate partner link
    │
    ▼
Redirect: https://ostrovok.ru/rooms/test_hotel/?partner_slug=...
```

### 2. Partner Link Structure
```
https://www.ostrovok.ru/rooms/{hotel_slug}/
    ?utm_medium=partners
    &partner_slug=270392.affiliate.a0bd
    &utm_source=270392.affiliate.a0bd
    &dates=11.03.2026-18.03.2026
    &guests=2
```

---

## Integration Model: AFFILIATE API

### What We Implement:
- ✅ **Search Endpoints** - Find hotels and rates
- ✅ **Static Data** - Hotel info, photos, amenities  
- ✅ **Partner Links** - Attribution tracking
- ✅ **Test Hotel** - Certification requirement

### What We DON'T Implement (Affiliate Model):
- ❌ **Booking Endpoints** - Users book on Ostrovok.ru
- ❌ **Payment Processing** - Handled by Ostrovok
- ❌ **Prebook/Finish** - Not needed for redirect model
- ❌ **Webhooks** - Not needed for redirect model

---

## Key Integration Points

### 1. Authentication
```
Header: Authorization: Token {API_TOKEN}
Key ID: 12984
Partner Slug: 270392.affiliate.a0bd
```

### 2. Search Request Example
```json
POST /api/b2b/v3/search/serp/region/
{
  "region_id": 1,
  "checkin": "2026-03-15",
  "checkout": "2026-03-20",
  "guests": [{"adults": 2}],
  "currency": "RUB",
  "language": "ru"
}
```

### 3. Partner Link Generation
```typescript
// Generate tracking URL with attribution
const bookingUrl = buildHotelPageLink('test_hotel', {
  partnerSlug: '270392.affiliate.a0bd',
  checkIn: '2026-03-15',
  checkOut: '2026-03-20',
  rooms: [{ adults: 2 }]
});
// Result: https://www.ostrovok.ru/rooms/test_hotel/?utm_medium=partners&...
```

---

## Testing & Certification

### Test Hotel Verification
```
Test Hotel ID: hid=1 / test_hotel
Test URL: https://ostrovok.ru/rooms/test_hotel/?partner_slug=270392.affiliate.a0bd
Status: ✅ Working - Booking page loads correctly
```

### Tested Scenarios
- ✅ Search by region (Moscow, Saint Petersburg, Paris, Istanbul, Dubai)
- ✅ Search by hotel IDs
- ✅ Partner link generation with UTM tracking
- ✅ Test hotel booking flow
- ✅ Date and guest parameters in URLs

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| AI Processing | OpenAI GPT API |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| API Integration | ETG B2B API v3 |

---

*Diagram created for ETG API Certification Process*  
*Partner ID: 270392.affiliate.a0bd*  
*Website: https://www.tripgen.ru*
