import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Log configuration status
console.log('Creator application router initialized');

// Submit creator application
router.post('/creator-application', async (req: Request, res: Response) => {
  try {
    const { name, email, socialMedia, portfolio, message } = req.body;

    // Basic validation
    if (!name || !email || !socialMedia || !portfolio) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, social media, and portfolio are required'
      });
    }

    // Here you would typically save the application to a database
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Application received successfully',
      data: {
        name,
        email,
        socialMedia,
        portfolio,
        message,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing creator application:', error);
    res.status(500).json({
      error: 'Failed to process application',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 