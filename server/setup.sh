#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "PORT=3000" > .env
  echo "OSTROVOK_API_KEY=your_api_key_here" >> .env
  echo "Please update the .env file with your actual API key"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the server
echo "Starting the server..."
npm run dev 