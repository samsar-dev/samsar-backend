import express from 'express';
import axios from 'axios';
import { calculateDistance } from '../utils/geolocation';
import { authenticateToken } from '../middleware/auth.middleware';
import { Listing } from '../models/Listing';

const router = express.Router();

// Environment variables
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Search for locations using Mapbox Geocoding API
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 5, proximity, country = 'sy' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Construct the Mapbox API URL
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      q as string
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=${country}&limit=${limit}`;

    if (proximity) {
      url += `&proximity=${proximity}`;
    }

    const response = await axios.get(url);
    
    // Transform the response to a more friendly format
    const results = response.data.features.map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      text: feature.text,
      center: feature.center, // [lng, lat]
      context: feature.context?.map((ctx: any) => ({
        id: ctx.id,
        text: ctx.text,
        short_code: ctx.short_code,
      })),
    }));

    res.json(results);
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

/**
 * Reverse geocode coordinates to get address
 */
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=sy`;
    const response = await axios.get(url);
    
    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({ error: 'No address found for the given coordinates' });
    }

    const feature = response.data.features[0];
    
    res.json({
      address: feature.place_name,
      coordinates: [parseFloat(lat as string), parseFloat(lng as string)],
      context: feature.context?.map((ctx: any) => ({
        id: ctx.id,
        text: ctx.text,
        short_code: ctx.short_code,
      })),
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to reverse geocode coordinates' });
  }
});

/**
 * Get nearby listings within a radius (in km)
 */
router.get('/listings/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10, ...filters } = req.query;
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    // Get all listings (you might want to add pagination for production)
    const listings = await Listing.find(filters).lean();

    // Filter listings within the specified radius
    const nearbyListings = listings.filter((listing) => {
      if (!listing.location?.coordinates) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        listing.location.coordinates[1], // lat
        listing.location.coordinates[0]  // lng
      );
      
      return distance <= radiusKm;
    });

    // Add distance to each listing
    const results = nearbyListings.map((listing) => ({
      ...listing,
      distance: calculateDistance(
        latitude,
        longitude,
        listing.location.coordinates[1],
        listing.location.coordinates[0]
      ),
    }));

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    res.json(results);
  } catch (error) {
    console.error('Error getting nearby listings:', error);
    res.status(500).json({ error: 'Failed to get nearby listings' });
  }
});

/**
 * Calculate distance between two points
 */
router.get('/distance', (req, res) => {
  try {
    const { origin, destination, unit = 'km' } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const [originLat, originLng] = (origin as string).split(',').map(parseFloat);
    const [destLat, destLng] = (destination as string).split(',').map(parseFloat);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    let distance = calculateDistance(originLat, originLng, destLat, destLng);
    
    // Convert to miles if needed
    if (unit === 'mi') {
      distance *= 0.621371;
    }

    res.json({
      distance,
      unit,
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

export default router;
