import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type AuthedRequest = Request & { user?: any; creator?: any };

const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    console.error('[tours] auth error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return next();
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user || undefined;
  } catch {
    req.user = undefined;
  }
  next();
};

const requireCreator = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'approved')
      .single();

    if (error || !creator) return res.status(403).json({ error: 'Not a creator' });
    req.creator = creator;
    next();
  } catch (err) {
    console.error('[tours] creator check error:', err);
    return res.status(403).json({ error: 'Creator verification failed' });
  }
};

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function normalizeTourPayload(body: any, creatorId: string) {
  const title = String(body.title || '').trim();
  const location = String(body.location || '').trim();
  const region = String(body.region || '').trim();
  const duration = String(body.duration || '').trim();
  const price = String(body.price || '').trim();
  const shortDescription = String(body.shortDescription || body.short_description || '').trim();
  const description = String(body.description || '').trim();

  if (!title || !location || !region || !duration || !price || !shortDescription || !description) {
    throw new Error('Missing required tour fields');
  }

  return {
    creator_id: creatorId,
    title,
    location,
    region,
    duration,
    duration_days: Math.max(1, toInt(body.durationDays ?? body.duration_days, 1)),
    group_size: String(body.groupSize ?? body.group_size ?? ''),
    min_group_size: toInt(body.minGroupSize ?? body.min_group_size, 1),
    max_group_size: toInt(body.maxGroupSize ?? body.max_group_size, 1),
    price,
    price_value: toInt(body.priceValue ?? body.price_value, 0),
    category: String(body.category || 'nature'),
    category_name: String(body.categoryName ?? body.category_name ?? 'Природа'),
    difficulty: ['easy', 'medium', 'hard'].includes(String(body.difficulty)) ? String(body.difficulty) : 'medium',
    short_description: shortDescription,
    description,
    image: String(body.image || ''),
    images: toArray(body.images),
    highlights: toArray(body.highlights),
    activities: toArray(body.activities),
    requirements: toArray(body.requirements),
    includes: toArray(body.includes),
    excludes: toArray(body.excludes),
    itinerary: toArray(body.itinerary),
    accommodation: toArray(body.accommodation),
    best_time: String(body.bestTime ?? body.best_time ?? ''),
    spots_left: toInt(body.spotsLeft ?? body.spots_left, 0),
    start_date: body.startDate || body.start_date || null,
    end_date: body.endDate || body.end_date || null,
    guide_info: body.guideInfo ?? body.guide_info ?? null,
    payment_method_title: String(body.paymentMethodTitle ?? body.payment_method_title ?? 'Оплата напрямую организатору'),
    payment_instructions: String(body.paymentInstructions ?? body.payment_instructions ?? ''),
    status: ['draft', 'pending', 'published', 'archived'].includes(String(body.status)) ? String(body.status) : 'pending',
  };
}

function mapTour(row: any) {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    location: row.location,
    region: row.region,
    image: row.image,
    images: row.images || [],
    duration: row.duration,
    durationDays: row.duration_days,
    groupSize: row.group_size,
    minGroupSize: row.min_group_size,
    maxGroupSize: row.max_group_size,
    price: row.price,
    priceValue: row.price_value,
    category: row.category,
    categoryName: row.category_name,
    difficulty: row.difficulty,
    shortDescription: row.short_description,
    description: row.description,
    includes: row.includes || [],
    excludes: row.excludes || [],
    itinerary: row.itinerary || [],
    highlights: row.highlights || [],
    accommodation: row.accommodation || [],
    activities: row.activities || [],
    requirements: row.requirements || [],
    bestTime: row.best_time,
    guideInfo: row.guide_info || undefined,
    spotsLeft: row.spots_left,
    startDate: row.start_date,
    endDate: row.end_date,
    paymentMethodTitle: row.payment_method_title,
    paymentInstructions: row.payment_instructions,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBooking(row: any) {
  return {
    id: row.public_reference || row.id,
    requestId: row.id,
    tourId: row.tour_id,
    sourceTourId: row.source_tour_id,
    tourName: row.tour_name,
    customer: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
    date: row.preferred_date || row.created_at,
    amount: row.amount,
    status: row.status,
    guests: row.guests,
    comments: row.comments,
    createdAt: row.created_at,
    paymentMethodTitle: row.payment_method_title,
  };
}

async function findCreatorByInput(creatorInput: string | undefined, tourId: string | undefined) {
  if (tourId) {
    const { data: tour } = await supabase
      .from('creator_tours')
      .select('creator_id')
      .eq('id', tourId)
      .single();
    if (tour?.creator_id) return tour.creator_id;
  }

  if (!creatorInput) return null;

  const { data: byId } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorInput)
    .maybeSingle();
  if (byId?.id) return byId.id;

  const { data: byUserId } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', creatorInput)
    .maybeSingle();
  return byUserId?.id || null;
}

router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('creator_tours')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tours] list failed:', error);
    return res.status(500).json({ error: 'Failed to fetch tours' });
  }

  res.json({ tours: (data || []).map(mapTour) });
});

router.get('/mine', requireAuth, requireCreator, async (req: AuthedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('creator_tours')
    .select('*')
    .eq('creator_id', req.creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tours] mine failed:', error);
    return res.status(500).json({ error: 'Failed to fetch creator tours' });
  }

  res.json({ tours: (data || []).map(mapTour) });
});

router.post('/', requireAuth, requireCreator, async (req: AuthedRequest, res: Response) => {
  try {
    const payload = normalizeTourPayload(req.body, req.creator.id);
    const { data, error } = await supabase
      .from('creator_tours')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[tours] create failed:', error);
      return res.status(500).json({ error: 'Failed to create tour' });
    }

    res.status(201).json({ tour: mapTour(data) });
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid tour payload' });
  }
});

router.get('/bookings/mine', requireAuth, requireCreator, async (req: AuthedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('tour_booking_requests')
    .select('*')
    .eq('creator_id', req.creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tours] bookings failed:', error);
    return res.status(500).json({ error: 'Failed to fetch booking requests' });
  }

  res.json({ bookings: (data || []).map(mapBooking) });
});

router.post('/bookings', optionalAuth, async (req: AuthedRequest, res: Response) => {
  const body = req.body || {};
  const customerName = String(body.customerName || '').trim();
  const customerEmail = String(body.customerEmail || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const tourName = String(body.tourName || '').trim();
  const tourId = body.tourId ? String(body.tourId) : undefined;
  const creatorInput = body.creatorId ? String(body.creatorId) : undefined;

  if (!customerName || !customerEmail || !customerPhone || !tourName) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  const creatorId = await findCreatorByInput(creatorInput, tourId);
  if (!creatorId) return res.status(404).json({ error: 'Tour creator not found' });

  const reference = `TRG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const payload = {
    public_reference: reference,
    creator_id: creatorId,
    tour_id: tourId || null,
    source_tour_id: body.sourceTourId ? String(body.sourceTourId) : null,
    tour_name: tourName,
    client_user_id: req.user?.id || null,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    guests: Math.max(1, toInt(body.guests, 1)),
    preferred_date: body.preferredDate || null,
    comments: String(body.comments || ''),
    amount: toInt(body.amount, 0),
    payment_method_title: String(body.paymentMethodTitle || 'Оплата напрямую организатору'),
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('tour_booking_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[tours] booking create failed:', error);
    return res.status(500).json({ error: 'Failed to create booking request' });
  }

  res.status(201).json({ booking: mapBooking(data) });
});

router.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('creator_tours')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tour not found' });
  res.json({ tour: mapTour(data) });
});

export default router;
