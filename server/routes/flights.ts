import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const AVIASALES_API_URL = process.env.AVIASALES_API_URL || 'https://api.travelpayouts.com/aviasales/v3';
const AVIASALES_API_TOKEN = process.env.AVIASALES_API_TOKEN;

// Log configuration status
console.log('Flights router initialized');
console.log('API URL:', AVIASALES_API_URL);
console.log('API Token status:', AVIASALES_API_TOKEN ? 'Present' : 'Missing');

interface SearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  tripClass?: 'Y' | 'C';  // Y - economy, C - business
  isRoundTrip: boolean;
}

interface AviasalesResponse {
  data: Array<{
    flight_number: string;
    airline: string;
    airline_name: string;
    origin_name: string;
    origin_airport: string;
    destination_name: string;
    destination_airport: string;
    departure_at: string;
    arrival_at: string;
    duration_to: number;
    duration_back?: number;
    transfers: number;
    return_transfers?: number;
    price: number;
  }>;
  currency: string;
  total: number;
}

// Validation middleware
const validateSearchParams = (req: Request, res: Response, next: Function) => {
  const { origin, destination, departureDate, returnDate, passengers, tripClass, isRoundTrip } = req.body;

  const errors = [];

  if (!origin || typeof origin !== 'string' || origin.length !== 3) {
    errors.push('Invalid origin airport code');
  }

  if (!destination || typeof destination !== 'string' || destination.length !== 3) {
    errors.push('Invalid destination airport code');
  }

  if (!departureDate || !isValidDate(departureDate)) {
    errors.push('Invalid departure date');
  }

  if (isRoundTrip && (!returnDate || !isValidDate(returnDate))) {
    errors.push('Invalid return date');
  }

  if (isRoundTrip && returnDate && new Date(returnDate) < new Date(departureDate)) {
    errors.push('Return date must be after departure date');
  }

  if (!passengers || typeof passengers !== 'object') {
    errors.push('Invalid passengers data');
  } else {
    if (typeof passengers.adults !== 'number' || passengers.adults < 1) {
      errors.push('At least one adult passenger is required');
    }
    if (passengers.children && (typeof passengers.children !== 'number' || passengers.children < 0)) {
      errors.push('Invalid number of children');
    }
    if (passengers.infants && (typeof passengers.infants !== 'number' || passengers.infants < 0)) {
      errors.push('Invalid number of infants');
    }
  }

  if (tripClass && !['Y', 'C'].includes(tripClass)) {
    errors.push('Invalid trip class. Must be Y (economy) or C (business)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Helper function to validate date format
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date >= new Date();
};

// Search flights
router.post('/search', validateSearchParams, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!AVIASALES_API_TOKEN) {
      throw new Error('Aviasales API token is not configured');
    }

    const { origin, destination, departureDate, returnDate, passengers, tripClass, isRoundTrip } = req.body;

    console.log('Making API request with params:', {
      origin,
      destination,
      departure_at: departureDate,
      return_at: isRoundTrip ? returnDate : undefined,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      trip_class: tripClass
    });

    const searchResponse = await axios.get(`${AVIASALES_API_URL}/prices_for_dates`, {
      params: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_at: departureDate,
        return_at: isRoundTrip ? returnDate : undefined,
        one_way: !isRoundTrip,
        unique: false,
        sorting: 'price',
        direct: false,
        currency: 'usd',
        limit: 30,
        page: 1,
        market: 'ru',
        token: AVIASALES_API_TOKEN
      }
    });

    // Transform the response to match the API format
    const flights = searchResponse.data.data.map((flight: any) => ({
      origin: flight.origin,
      destination: flight.destination,
      origin_airport: flight.origin_airport,
      destination_airport: flight.destination_airport,
      price: flight.price,
      airline: flight.airline,
      flight_number: flight.flight_number,
      departure_at: flight.departure_at,
      return_at: flight.return_at,
      transfers: flight.transfers,
      return_transfers: flight.return_transfers,
      duration: flight.duration,
      duration_to: flight.duration_to,
      duration_back: flight.duration_back,
      link: `https://www.aviasales.com${flight.link}`,
      currency: searchResponse.data.currency
    }));

    res.json({
      success: true,
      data: flights,
      currency: searchResponse.data.currency,
      search_params: {
        origin,
        destination,
        departure_at: departureDate,
        return_at: isRoundTrip ? returnDate : undefined,
        one_way: !isRoundTrip,
        passengers,
        trip_class: tripClass
      }
    });

  } catch (err: unknown) {
    console.error('Error in flight search:', err);
    
    const errorResponse = {
      error: 'Failed to fetch flights',
      details: err instanceof Error ? err.message : 'Unknown error',
      status: err instanceof Error && 'response' in err ? (err as any).response?.status : undefined
    };
    
    res.status(500).json(errorResponse);
  }
});

// Get price calendar
router.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { origin, destination, month } = req.query;

    if (!origin || !destination || !month) {
      res.status(400).json({
        error: 'Missing required parameters'
      });
      return;
    }

    const response = await axios.get(`${AVIASALES_API_URL}/prices_for_dates`, {
      params: {
        origin,
        destination,
        calendar_type: 'departure_date',
        month,
        currency: 'rub',
        token: AVIASALES_API_TOKEN
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error fetching price calendar:', err);
    res.status(500).json({
      error: 'Failed to fetch price calendar',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export default router; 