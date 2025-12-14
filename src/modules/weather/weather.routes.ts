// Weather Routes

import { Router } from 'express';
import * as weatherController from './weather.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

/**
 * @route   GET /api/mobile/weather/site/:siteId
 * @desc    Get weather forecast for a specific site
 * @access  Private
 * @query   days - Number of forecast days (default: 5, max: 14)
 */
router.get('/site/:siteId', authenticateToken, weatherController.getSiteWeather);

/**
 * @route   GET /api/mobile/weather/job/:jobId
 * @desc    Get weather forecast for a specific job site
 * @access  Private
 * @query   days - Number of forecast days (default: 5, max: 14)
 */
router.get('/job/:jobId', authenticateToken, weatherController.getJobWeather);

/**
 * @route   GET /api/mobile/weather/current
 * @desc    Get current weather by coordinates
 * @access  Private
 * @query   lat - Latitude
 * @query   lon - Longitude
 */
router.get('/current', authenticateToken, weatherController.getWeatherByCoordinates);

/**
 * @route   GET /api/mobile/weather/forecast
 * @desc    Get weather forecast by coordinates
 * @access  Private
 * @query   lat - Latitude
 * @query   lon - Longitude
 * @query   days - Number of forecast days (default: 5, max: 14)
 */
router.get('/forecast', authenticateToken, weatherController.getForecastByCoordinates);

export default router;
