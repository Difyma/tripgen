/**
 * Ostrovok (ETG - Emerging Travel Group) API Types
 * Based on API v3 documentation: https://docs.emergingtravel.com
 */

// ============ ENUMS ============

export type HotelType = 
  | 'Unspecified'
  | 'Resort'
  | 'Sanatorium'
  | 'Guesthouse'
  | 'Mini-hotel'
  | 'Castle'
  | 'Hotel'
  | 'Boutique_and_Design'
  | 'Apartment'
  | 'Cottages_and_Houses'
  | 'Farm'
  | 'Villas_and_Bungalows'
  | 'Camping'
  | 'Hostel'
  | 'BNB'
  | 'Glamping'
  | 'Apart-hotel';

export type RoomClass = 
  | 0 // run of house
  | 1 // dorm
  | 2 // capsule
  | 3 // room
  | 4 // junior suite
  | 5 // suite
  | 6 // apartment
  | 7 // studio
  | 8 // villa
  | 9 // cottage
  | 17 // bungalow
  | 18 // chalet
  | 19 // camping
  | 20; // tent

export type RoomQuality = 
  | 0 // undefined
  | 1 // economy
  | 2 // standard
  | 3 // comfort
  | 4 // business
  | 5 // superior
  | 6 // deluxe
  | 7 // premier
  | 8 // executive
  | 9 // presidential
  | 17 // premium
  | 18 // classic
  | 19 // ambassador
  | 20 // grand
  | 21 // luxury
  | 22 // platinum
  | 23 // prestige
  | 24 // privilege
  | 25; // royal

export type BathroomType = 
  | 0 // undefined
  | 1 // shared bathroom
  | 2 // private bathroom
  | 3; // external private bathroom

export type BeddingType = 
  | 0 // undefined
  | 1 // bunk bed
  | 2 // single bed
  | 3 // double bed
  | 4 // twin bed
  | 7 // multiple beds
  | 8 // chair-bed
  | 9; // sofa

export type MealType = 
  | 'unspecified'
  | 'all-inclusive'
  | 'breakfast'
  | 'breakfast-buffet'
  | 'continental-breakfast'
  | 'dinner'
  | 'full-board'
  | 'half-board'
  | 'lunch'
  | 'nomeal'
  | 'some-meal'
  | 'english-breakfast'
  | 'american-breakfast'
  | 'asian-breakfast'
  | 'chinese-breakfast'
  | 'israeli-breakfast'
  | 'japanese-breakfast'
  | 'scandinavian-breakfast'
  | 'scottish-breakfast'
  | 'breakfast-for-1'
  | 'breakfast-for-2'
  | 'super-all-inclusive'
  | 'soft-all-inclusive'
  | 'ultra-all-inclusive'
  | 'half-board-lunch'
  | 'half-board-dinner';

export type PaymentType = 
  | 'now'
  | 'hotel'
  | 'deposit';

export type RegionType = 
  | 'Airport'
  | 'Bus Station'
  | 'City'
  | 'Continent'
  | 'Country'
  | 'Multi-City (Vicinity)'
  | 'Multi-Railway Station'
  | 'Multi-Region (within a country)'
  | 'Neighborhood'
  | 'Point of Interest'
  | 'Province (State)'
  | 'Railway Station'
  | 'Street'
  | 'Subway (Entrace)';

export type ImageCategory = 
  | 'unspecified'
  | 'balcony'
  | 'bathroom'
  | 'beach'
  | 'business'
  | 'entertainment'
  | 'exterior'
  | 'guest_rooms'
  | 'hotel_front'
  | 'hotel_rooms'
  | 'lobby'
  | 'meal'
  | 'outside'
  | 'pool'
  | 'spa'
  | 'sports'
  | 'children'
  | 'miscellaneous';

export type ImageSize = 
  | '1024x768'
  | 'x220'
  | 'x500'
  | 'x768'
  | '40x40'
  | '80x80'
  | '100x100'
  | '120x120'
  | '241x241'
  | '240x240'
  | '154x105'
  | '170x154'
  | '640x350'
  | '320x175'
  | '200x200'
  | '1080x522'
  | '750x400'
  | '640x400'
  | '120x90'
  | '90x75'
  | 'x300'
  | 'x600'
  | '100x130'
  | 'x296'
  | '100x50'
  | 'x100'
  | '100x'
  | '640x230'
  | '370x'
  | '645x255'
  | '450x161'
  | 'x102'
  | '225x60'
  | '828x560'
  | '640x640'
  | '196x196'
  | '1298x'
  | '295x220'
  | '2048x2048'
  | '304x'
  | '304x140'
  | 'x700'
  | '112x112'
  | '695x'
  | '1300x620'
  | '2600x1240'
  | '600x313'
  | '1200x616'
  | '326x220'
  | '768x1024'
  | '900x900'
  | '1920x1080'
  | '1080x1920'
  | 'x1080'
  | 'x1920'
  | '1920x'
  | '1080x';

// ============ BASE INTERFACES ============

export interface HotelSearchParams {
  location: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  children?: number[]; // Ages of children
  currency?: string; // Default: RUB
  residency?: string; // ISO 3166-1 alpha-2 (e.g., 'ru', 'us')
  language?: string; // Default: 'ru'
  timeout?: number; // Search timeout in seconds
}

export interface HotelSearchRequest {
  ids?: string[]; // Legacy hotel IDs
  hid?: number[]; // New numeric hotel IDs
  checkin: string;
  checkout: string;
  guests: Guest[];
  language?: string;
  currency?: string;
  residency?: string;
  timeout?: number;
}

export interface Guest {
  adults: number;
  children: number[]; // Ages of children
}

// ============ HOTEL DATA ============

export interface Hotel {
  id: string; // Legacy ID
  hid?: number; // New numeric ID
  name: string;
  stars: number; // 0-5
  rating?: number; // 0-10
  address: string;
  latitude?: number;
  longitude?: number;
  hotel_type?: HotelType;
  
  // Images
  images: HotelImage[];
  thumbnail?: string;
  
  // Pricing
  rates: HotelRate[];
  min_price?: number;
  currency: string;
  bookingUrl?: string;
  
  // Descriptions
  description?: string;
  description_struct?: DescriptionParagraph[];
  
  // Amenities & Policies
  amenities?: AmenityGroup[];
  metapolicy_struct?: MetaPolicy;
  
  // Region info
  region?: RegionInfo;
  
  // Room groups
  room_groups?: RoomGroup[];
  
  // Serp filters
  serp_filters?: SerpFilter[];
  
  // Legal info (for specific countries)
  legal_info?: LegalInfo;
  
  // Key pickup info
  apartment_keys?: KeyPickupInfo;
  
  // Distance to center
  distance_center?: number; // in meters
}

export interface HotelImage {
  category: ImageCategory;
  url: string; // Contains {size} placeholder
  sizes?: Record<string, string>;
}

export interface DescriptionParagraph {
  title?: string;
  text: string;
}

export interface HotelRate {
  match_hash?: string;
  book_hash?: string;
  
  // Room info
  room_name: string;
  rg_ext?: RoomGroupExt;
  
  // Pricing
  daily_prices: string[]; // Price per day
  amount: number; // Total amount
  show_amount?: number; // Amount in requested currency
  currency: string;
  show_currency?: string;
  
  // Meal
  meal: string; // Deprecated, use meal_data
  meal_data: MealData;
  
  // Payment options
  payment_options: PaymentOptions;
  
  // Room details
  room_data?: RoomData;
  
  // Cancellation
  cancellation_penalties?: CancellationPenalties;
  
  // Availability
  all_inclusive?: boolean;
  is_package?: boolean;
  allotment?: number; // Available rooms
  
  // Policies
  no_show?: NoShowPolicy;
  
  // Legal info
  hotel_legal_info?: HotelLegalInfo;
}

export interface RoomGroupExt {
  rg_class: RoomClass;
  rg_quality: RoomQuality;
  rg_room_type: number;
  rg_bedding_type: BeddingType;
  rg_bathroom_type: BathroomType;
  rg_capacity?: number;
  rg_no_smoking?: boolean;
  rg_floor?: number;
  rg_view?: number;
  rg_balcony?: number;
}

export interface MealData {
  value: MealType;
  breakfast_included: boolean;
  children_meal_included?: boolean;
}

export interface PaymentOptions {
  payment_types: PaymentTypeInfo[];
}

export interface PaymentTypeInfo {
  type: PaymentType;
  amount: number;
  currency_code: string;
  show_amount?: number;
  show_currency_code?: string;
  is_need_cvv?: boolean;
  is_deposit?: boolean;
  commission_info?: CommissionInfo;
}

export interface CommissionInfo {
  charge: {
    amount_gross?: number;
    amount_commission?: number;
  };
}

export interface RoomData {
  name: string;
  balcony?: number; // 0 = no, 1 = yes
  bathroom?: number;
  bedding?: number;
  bedroom?: number;
  capacity?: number;
  class?: RoomClass;
  club?: number;
  family?: number;
  floor?: number;
  quality?: RoomQuality;
  gender?: number;
  view?: number;
  area?: number; // in square meters
  rg_ext?: RoomGroupExt;
}

export interface CancellationPenalties {
  policies: CancellationPolicy[];
  free_cancellation_before?: string; // ISO datetime
}

export interface CancellationPolicy {
  date_from: string;
  amount_charge: number;
  amount_show?: number;
  commission_info?: CommissionInfo;
}

export interface NoShowPolicy {
  amount: number;
  currency_code: string;
  from_time?: string; // HH:MM:SS
}

// ============ AMENITIES & POLICIES ============

export interface AmenityGroup {
  group_name: string;
  amenities: string[];
}

export interface MetaPolicy {
  add_fee?: AdditionalFeePolicy[];
  check_in_check_out?: CheckInOutPolicy[];
  children?: ChildrenPolicy[];
  children_meal?: ChildrenMealPolicy[];
  cot?: CotPolicy[];
  deposit?: DepositPolicy[];
  extra_bed?: ExtraBedPolicy[];
  internet?: InternetPolicy[];
  meals?: MealPolicy[];
  no_show?: NoShowPolicyMeta[];
  parking?: ParkingPolicy[];
  pets?: PetsPolicy[];
  shuttle?: ShuttlePolicy[];
  visa_support?: VisaSupportPolicy[];
  metapolicy_extra_info?: string;
}

export interface AdditionalFeePolicy {
  type: string;
  currency: string;
  price: number;
  price_unit: PriceUnit;
}

export interface CheckInOutPolicy {
  type: string;
  currency: string;
  inclusion: InclusionType;
  price: number;
}

export interface ChildrenPolicy {
  min_age: number;
  max_age: number;
  currency: string;
  extra_bed: 'unspecified' | 'available' | 'unavailable';
  price: number;
}

export interface ChildrenMealPolicy {
  min_age: number;
  max_age: number;
  currency: string;
  inclusion: InclusionType;
  meal_type: MealType;
  price: number;
}

export interface CotPolicy {
  available_count: number;
  currency: string;
  inclusion: InclusionType;
  price: number;
  price_unit: PriceUnit;
}

export interface DepositPolicy {
  availability: 'unspecified' | 'available' | 'unavailable';
  currency: string;
  deposit_type: string;
  payment_type: string;
  price: number;
  price_unit: PriceUnit;
  pricing_method: 'unspecified' | 'percent' | 'fixed';
}

export interface ExtraBedPolicy {
  available_count: number;
  currency: string;
  inclusion: InclusionType;
  price: number;
  price_unit: PriceUnit;
}

export interface InternetPolicy {
  currency: string;
  inclusion: InclusionType;
  internet_type: 'unspecified' | 'wireless' | 'wired';
  price: number;
  price_unit: PriceUnit;
  work_area: 'unspecified' | 'hotel' | 'room';
}

export interface MealPolicy {
  currency: string;
  inclusion: InclusionType;
  meal_type: MealType;
  price: number;
}

export interface NoShowPolicyMeta {
  availability: 'unspecified' | 'available' | 'unavailable';
  currency: string;
  day_period: string;
  time?: string;
  price: number;
}

export interface ParkingPolicy {
  currency: string;
  inclusion: InclusionType;
  price: number;
  price_unit: PriceUnit;
  territory_type: 'unspecified' | 'on_side' | 'off_side';
}

export interface PetsPolicy {
  currency: string;
  inclusion: InclusionType;
  pets_type: 'unspecified' | 'lt_5kg' | 'gt_5kg';
  price: number;
  price_unit: PriceUnit;
}

export interface ShuttlePolicy {
  currency: string;
  destination_type: string;
  inclusion: InclusionType;
  shuttle_type: 'unspecified' | 'one_way' | 'two_ways';
  price: number;
}

export interface VisaSupportPolicy {
  visa_support: 'unspecified' | 'support_enable';
}

export type PriceUnit = 
  | 'unspecified'
  | 'per_guest_per_night'
  | 'per_guest_per_stay'
  | 'per_room_per_night'
  | 'per_room_per_stay'
  | 'per_hour'
  | 'per_week'
  | 'per_car_per_night'
  | 'per_car_per_stay';

export type InclusionType = 'unspecified' | 'included' | 'not_included';

// ============ ROOM GROUPS ============

export interface RoomGroup {
  room_group_id: number;
  name: string;
  name_struct?: {
    bathroom?: string;
    bedding?: string;
    main_name?: string;
  };
  images: RoomGroupImage[];
  rg_ext: RoomGroupExt;
  room_amenities?: string[];
  area?: number;
}

export interface RoomGroupImage {
  category: ImageCategory;
  url: string;
}

// ============ REGION & LEGAL ============

export interface RegionInfo {
  id: string;
  name: string;
  iata?: string;
  type: RegionType;
}

export interface LegalInfo {
  hotel?: HotelLegalInfo;
  service_provider?: ServiceProviderLegalInfo;
}

export interface HotelLegalInfo {
  name?: string;
  address?: string;
  inn?: string;
  ogrn?: string;
  working_time?: string;
}

export interface ServiceProviderLegalInfo {
  name?: string;
  address?: string;
  inn?: string;
  ogrn?: string;
}

export interface KeyPickupInfo {
  pickup_type: 'unspecified' | 'phone' | 'address' | 'smartlock' | 'keypad' | 'lockbox' | 'reception';
  phone?: string;
  is_contactless?: boolean;
  email?: string;
  apartment_office_address?: string;
  apartment_extra_information?: string;
}

export interface SerpFilter {
  filter_id: string;
  filter_name: string;
}

// ============ API RESPONSES ============

export interface SearchByRegionResponse {
  hotels: Hotel[];
  total: number;
}

export interface HotelPageResponse {
  hotel: Hotel;
}

export interface HotelContentResponse {
  id: string;
  hid?: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  hotel_type?: HotelType;
  stars?: number;
  rating?: number;
  images_ext: HotelImage[];
  description_struct?: DescriptionParagraph[];
  amenities?: AmenityGroup[];
  metapolicy_struct?: MetaPolicy;
  region?: RegionInfo;
  room_groups?: RoomGroup[];
  serp_filters?: SerpFilter[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface SuggestResponse {
  hotels: SuggestHotel[];
  regions: SuggestRegion[] | null;
}

export interface SuggestHotel {
  id: string;
  hid?: number;
  name: string;
  region_id?: string;
}

export interface SuggestRegion {
  id: string;
  name: string;
  type: RegionType;
}

// ============ BOOKING RELATED ============

export interface PrebookRequest {
  hash: string; // book_hash from search
  price_increase_percent?: number; // 0-100
}

export interface PrebookResponse {
  book_hash: string; // New hash starting with "p-"
  price_details: {
    amount: number;
    currency: string;
    show_amount?: number;
    show_currency?: string;
  };
  cancellation_policy?: CancellationPenalties;
}

// ============ PARTNER LINK ============

export interface PartnerLinkParams {
  hotelId: string | number;
  checkIn: string;
  checkOut: string;
  guests: number;
  children?: number;
  partnerId?: string;
}
