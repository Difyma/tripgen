import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const OSTROVOK_API_URL = 'https://api.ostrovok.ru/v3';
const OSTROVOK_API_KEY = process.env.OSTROVOK_API_KEY;
const OSTROVOK_API_SECRET = process.env.OSTROVOK_API_SECRET;

interface SearchRequest {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface OstrovokHotel {
  id: string;
  name: string;
  stars?: number;
  address?: string;
  min_price?: number;
  currency?: string;
  thumbnail_url?: string;
}

interface OstrovokResponse {
  hotels: OstrovokHotel[];
}

router.post('/search', async (req: Request<{}, any, SearchRequest>, res: Response): Promise<void> => {
  try {
    const { query, checkIn, checkOut, guests } = req.body;

    // Validate required fields
    if (!query || !checkIn || !checkOut || !guests) {
      res.status(400).json({
        error: 'Missing required fields'
      });
      return;
    }

    // First, search for hotels by location
    const searchResponse = await axios.post<OstrovokResponse>(`${OSTROVOK_API_URL}/search`, {
      query,
      language: 'ru',
      currency: 'RUB',
      checkin: checkIn,
      checkout: checkOut,
      guests: [{
        adults: guests,
        children: []
      }]
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${OSTROVOK_API_KEY}:${OSTROVOK_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    // Transform the response to match our frontend interface
    const hotels = searchResponse.data.hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      stars: hotel.stars || 0,
      address: hotel.address || 'Address not available',
      price: hotel.min_price || 0,
      currency: hotel.currency || 'RUB',
      thumbnail: hotel.thumbnail_url || null
    }));

    res.json({
      hotels,
      total: hotels.length
    });

  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({
      error: 'Failed to fetch hotels'
    });
  }
});

export default router; 