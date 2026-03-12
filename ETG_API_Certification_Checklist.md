# ETG API Pre-Certification Checklist

**Partner ID:** 270392.affiliate.a0bd  
**Key ID:** 12984  
**Project:** TripGen AI - AI-powered travel assistant  
**Website:** https://www.tripgen.ru  
**Date:** March 2026  
**Contact:** [your-email@company.com]

---

## General

### Map Test Hotels
✅ **Completed** - Mapped test hotel hid = 1 (id = "test_hotel")  
Test hotel URL: `https://ostrovok.ru/rooms/test_hotel/?utm_medium=partners&partner_slug=270392.affiliate.a0bd`

### Product Type for Certification
**Website** - AI Travel Assistant with hotel search and booking redirect  
- ✅ Access to the website has been provided
- Website URL: https://www.tripgen.ru
- Product type: AI Chat-based travel planner with hotel recommendations

### Comparison Diagram
- ✅ Yes, please find the diagram attached to the email
- Or: Diagram available at: https://www.tripgen.ru

### Testing
We have tested the following scenarios:
- ✅ Search by region (Moscow, Saint Petersburg, Paris, etc.)
- ✅ Search by hotel IDs (demo hotels)
- ✅ Test hotel booking flow verification
- ✅ Partner link attribution tracking

**Note:** We use Affiliate API model with redirect to Ostrovok booking page, not direct API booking.

### Payment Types
**Selected: "hotel"** - payment at the hotel (Affiliate API model)  
- We redirect users to Ostrovok website for booking completion
- Payment is processed by Ostrovok directly

**Not applicable (B2B only endpoints):**
- "deposit" payment - Not used (B2B API only)
- "now" payment with credit card token - Not used (B2B API only)

**Credit Card Token Questions - N/A for Affiliate:**
- [ ] Have you integrated the "Create credit card token" endpoint? - **No** (Affiliate model)
- [ ] Do you send "pay_uuid", "init_uuid", and "return_path"? - **No** (Affiliate model)
- [ ] Have you provided a host name for 3ds? - **No** (Affiliate model)
- [ ] Please make a booking with a card - **N/A** - We redirect to Ostrovok for booking

### IP Whitelisting on ETG end
- ✅ Yes, here are our IP addresses:
  - Production: [your-production-ip-addresses]
  - If dynamic IPs: We use dynamic IP addresses through cloud hosting (Vercel/AWS/ etc.)

### Required Endpoints for Implementation

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/b2b/v3/hotel/info/dump/` | ❌ No, not implemented | Using dynamic search instead |
| `/api/b2b/v3/hotel/info/incremental_dump/` | ❌ No, not implemented | Using dynamic search instead |
| `/api/b2b/v3/search/serp/` | ✅ Yes, implemented | Using `/region/` search type |
| `/api/b2b/v3/search/hp/` | ❌ No, not implemented | Using SERP search instead |
| `/api/b2b/v3/hotel/prebook/` | ❌ No, not implemented | Affiliate model - redirect to Ostrovok |
| `/api/b2b/v3/hotel/order/booking/form/` | ❌ No, not implemented | Affiliate model - redirect to Ostrovok |
| `/api/b2b/v3/hotel/order/booking/finish/` | ❌ No, not implemented | Affiliate model - redirect to Ostrovok |
| `/api/b2b/v3/hotel/order/booking/finish/status/` or Webhooks | ❌ No, not implemented | Affiliate model |

**Did you implement other endpoints?**  
✅ Yes, we implemented:
- `/api/b2b/v3/search/serp/region/` - Main search endpoint
- `/api/b2b/v3/search/serp/hotels/` - Search by hotel IDs
- `/api/b2b/v3/geo/` - Geo data for destinations

---

## Static Data

### Hotel Static Data Upload and Updates
- ✅ **Selected:** We use "Retrieve hotel content" (/hotel/info) to get the static data in real-time
- **Update frequency:** Real-time API calls (no local storage of static dump)
- **Reason:** AI-powered chat interface requires dynamic, on-demand hotel information

**Not used:**
- [ ] "Retrieve hotel dump" method - Not applicable for our real-time model
- [ ] "Retrieve hotel incremental dump" method - Not applicable

### Regions Data (if working with "Search by region")
- ✅ We use Content API to get region data dynamically
- **Update frequency:** Real-time API calls
- We do not store region data locally; we query `/geo/` endpoint as needed

### Number of Mapped Regions/Hotels
- **Hotels:** All hotels available through ETG API (dynamic search)
- **Regions:** All regions available through ETG API (dynamic search)
- **Approach:** We do not maintain a static mapping; users can search any destination supported by ETG

### Hotel Important Information
- ✅ **Selected:** Yes, we parse and display data from the "metapolicy_struct" and "metapolicy_extra_info" parameters
- Cancellation policies, check-in/out times, and important restrictions are displayed to users

### Room Static Data
- ✅ **Selected:** Yes, we show room images and amenities
- **Matching logic:** We use "room_group_id" and "room_name" to match and display room information

---

## Search Step

### Search Flow
- ✅ **Selected:** 2-steps search
  1. User requests hotels in chat (AI processes natural language)
  2. API search with region/hotel IDs → Display results with partner links

### Match_hash Usage
- ❌ **Selected:** No, we do not use "match_hash"
- **Reason:** We use real-time search and redirect users to Ostrovok for booking; no caching of search results

### Prebook Rate from Hotelpage Step
- ❌ **Selected:** No, we do not use "Prebook rate from hotelpage step"
- **Reason:** Affiliate model - we redirect users to Ostrovok website for booking; price verification happens on Ostrovok side

### Cache
- ✅ **Selected:** We don't cache search results
- **Reason:** Real-time AI chat requires fresh data for each user query
- All search endpoints (`/search/serp/region/`, `/search/serp/hotels/`, `/geo/`) are called in real-time

### Children Logic
- ✅ **Selected:** Yes, we accommodate children up to and including 17 years of age
- **Implementation:** Age is specified in all search requests within [] under "guests" > "children" parameter
- Child's age is properly passed to API in search requests

### Multiroom Booking
- ❌ **Selected:** No, we do not work with multiroom-booking
- **Reason:** Affiliate model with redirect to Ostrovok; users can configure multiroom on Ostrovok website
- Our interface focuses on single-room recommendations per search

**Test Booking Note:** N/A for multiroom (not implemented)

### Tax and Fees Data
- ✅ **Selected:** We display all taxes and fees (both included and non-included) separately
- We show the breakdown as provided in API response: `amount`, `show_amount`, `taxes`, and `fees`

### Dynamic Search Timeouts
- ✅ **Selected:** Yes, dynamic timeouts are used
- **"timeout" parameter:** Included in search requests
- **Expected Search Timeout:** 15 seconds
- **Maximum Search Timeout:** 30 seconds

### Cancellation Policies
- ✅ **Selected:** Yes, we parse and display them from "cancellation_penalties" in the API search responses
- **Modification:** No, we do not modify policies; we show them as they are
- **Timezone handling:** We display the cancellation deadline time in UTC+0 and show the UTC+0 timezone in the interface

### Lead Guest's Citizenship
- ❌ **Selected:** No, we do not request the citizenship data; we do not use the "residency" parameter in the API requests
- **Reason:** Affiliate model - citizenship is collected by Ostrovok during booking process on their website

### Meal Types
- ✅ **Selected:** We display ETG meal types as they are returned in the API search responses
- **Parameter used:** "meal" from the API search responses
- **Translation:** We use the provided translations when available

### Final Price
- ✅ **Selected:** "show_amount" - the final price displayed to user including all taxes

### Commission
- ✅ **Selected:** "Gross" and commission are calculated on the ETG end
- **Note:** Affiliate model - commission tracking via partner_slug and UTM parameters

### Rate Name Reflection
- ✅ **Selected:** "room_name" from /search/serp/ responses
- We display ETG room names as they are (no custom mapping)

### Early Check-in / Late Check-out (Upsells)
- ❌ **Selected:** Not applicable - working with Affiliate API
- Upsells are handled by Ostrovok website during booking process

### Hotel Chunk Size
- **Real number:** Up to 20 hotels per request (for `/search/serp/hotels/`)
- **Maximum number:** 50 hotels per request
- **Note:** For user experience, we typically display top 5-10 hotels per search

### Rates Filtration Logic
- ✅ **Selected:** ETG is the only supplier
- We display all rates returned by ETG API for selected hotels

---

## Booking Step

**Important Note:** We use Affiliate API model with redirect to Ostrovok website.
Direct booking endpoints are NOT implemented - users complete bookings on ostrovok.ru

### Test Bookings
**Approach:** N/A - Affiliate model  
Instead of API booking, we:
1. Generate partner tracking link with `partner_slug=270392.affiliate.a0bd`
2. Redirect user to Ostrovok hotel page with dates and guests pre-filled
3. User completes booking on Ostrovok website
4. Commission tracked via partner attribution

### Receiving Final Booking Status
- ❌ **Selected:** N/A for Affiliate model
- We do not process bookings directly; Ostrovok handles booking completion

### Booking Cut-off Timeouts
- ❌ **Selected:** N/A - Affiliate model
- Booking timeouts are handled by Ostrovok website

### Errors and Statuses Processing
- ❌ **Selected:** N/A - We do not implement booking endpoints
- Error handling is performed by Ostrovok website during booking process

### Confirmation E-mails
- ❌ **Selected:** We do not send an email address to ETG API
- **Reason:** Affiliate model - Ostrovok collects guest email during booking on their website

---

## Post-Booking

### Retrieve Bookings (/order/info)
- ❌ **Selected:** No
- **Reason:** Affiliate model - booking management is handled by Ostrovok directly with the guest

---

## Additional Information

### Our Integration Flow:

```
User Query (AI Chat)
    ↓
Natural Language Processing (AI)
    ↓
Destination/Hotel Extraction
    ↓
ETG API Search (/search/serp/region/ or /hotels/)
    ↓
Display Hotels with Photos, Prices, Amenities
    ↓
User Clicks "Book" Button
    ↓
Generate Partner Link (with partner_slug, utm_*)
    ↓
Redirect to Ostrovok.ru Hotel Page
    ↓
User Completes Booking on Ostrovok
    ↓
Commission Tracked via Partner Attribution
```

### Key Features:
- AI-powered natural language hotel search
- Real-time ETG API integration
- Partner link attribution with UTM tracking
- Test hotel integration verified
- Mobile-responsive chat interface

### Testing Completed:
- ✅ Test hotel (hid=1) booking flow
- ✅ Search by region (Moscow, Paris, Istanbul, etc.)
- ✅ Search by hotel IDs
- ✅ Partner link generation and attribution
- ✅ Date and guest parameters in URLs
- ✅ UTM tracking parameters

---

## Questions or Concerns

If any points require clarification due to our Affiliate API integration model, please contact us:

**Website:** https://www.tripgen.ru  
**Email:** [your-email@company.com]  
**Technical Contact:** [Your Name]  
**Phone:** [+7 XXX XXX XX XX]

---

*This checklist is submitted as part of ETG API certification process for Partner ID 270392.affiliate.a0bd*
