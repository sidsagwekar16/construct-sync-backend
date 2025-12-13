// Weather Controller

import { Request, Response } from 'express';
import weatherService from './weather.service';
import { db } from '../../db/connection';

/**
 * Get weather for a specific site
 */
export async function getSiteWeather(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { days = 5 } = req.query;

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required' });
    }

    // Fetch site details with coordinates
    const result = await db.query(
      `SELECT id, name, address, latitude, longitude 
       FROM sites 
       WHERE id = $1`,
      [siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = result.rows[0];

    if (!site.latitude || !site.longitude) {
      return res.status(400).json({ 
        error: 'Site coordinates not available. Please add location data to the site.' 
      });
    }

    // Get weather forecast
    const weatherData = await weatherService.getWeatherForecast(
      parseFloat(site.latitude),
      parseFloat(site.longitude),
      parseInt(days as string)
    );

    // Calculate risk level
    const riskLevel = weatherService.calculateRiskLevel(weatherData);

    res.json({
      siteId: site.id,
      siteName: site.name,
      siteAddress: site.address,
      weather: weatherData,
      riskLevel
    });
  } catch (error: any) {
    console.error('Error getting site weather:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    });
  }
}

/**
 * Get weather for a specific job site
 */
export async function getJobWeather(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const { days = 5 } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const jobIdNum = parseInt(jobId, 10);
    if (isNaN(jobIdNum)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    // Fetch job details with site coordinates
    const result = await db.query(
      `SELECT 
        jobs.id,
        jobs.job_type,
        sites.address,
        sites.latitude,
        sites.longitude
       FROM jobs 
       LEFT JOIN sites ON jobs.site_id = sites.id
       WHERE jobs.id = $1`,
      [jobIdNum]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    if (!job.latitude || !job.longitude) {
      return res.status(400).json({ 
        error: 'Job location coordinates not available. Please add coordinates to the job or associate it with a site.' 
      });
    }

    // Get weather forecast
    const weatherData = await weatherService.getWeatherForecast(
      parseFloat(job.latitude),
      parseFloat(job.longitude),
      parseInt(days as string)
    );

    // Calculate risk level
    const riskLevel = weatherService.calculateRiskLevel(weatherData);

    res.json({
      jobId: job.id,
      jobName: job.job_type,
      jobAddress: job.address,
      weather: weatherData,
      riskLevel
    });
  } catch (error: any) {
    console.error('Error getting job weather:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    });
  }
}

/**
 * Get current weather by coordinates
 */
export async function getWeatherByCoordinates(req: Request, res: Response) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates provided' 
      });
    }

    const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
    const riskLevel = weatherService.calculateRiskLevel(weatherData);

    res.json({
      weather: weatherData,
      riskLevel
    });
  } catch (error: any) {
    console.error('Error getting weather by coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    });
  }
}

/**
 * Get weather forecast by coordinates
 */
export async function getForecastByCoordinates(req: Request, res: Response) {
  try {
    const { lat, lon, days = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates provided' 
      });
    }

    const weatherData = await weatherService.getWeatherForecast(
      latitude, 
      longitude,
      parseInt(days as string)
    );
    
    const riskLevel = weatherService.calculateRiskLevel(weatherData);

    res.json({
      weather: weatherData,
      riskLevel
    });
  } catch (error: any) {
    console.error('Error getting forecast by coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast',
      message: error.message 
    });
  }
}
