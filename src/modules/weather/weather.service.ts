// Weather Service using WeatherAPI.com

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

interface WeatherApiCurrent {
  temp_c: number;
  temp_f: number;
  condition: {
    text: string;
    icon: string;
    code: number;
  };
  wind_mph: number;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  pressure_mb: number;
  pressure_in: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  vis_km: number;
  vis_miles: number;
  uv: number;
  gust_mph: number;
  gust_kph: number;
}

interface WeatherApiForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_mph: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_will_it_rain: number;
    daily_chance_of_rain: number;
    daily_will_it_snow: number;
    daily_chance_of_snow: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    uv: number;
  };
}

interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: WeatherApiCurrent;
  forecast?: {
    forecastday: WeatherApiForecastDay[];
  };
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp: number;
    temp_f: number;
    condition: string;
    icon: string;
    wind_speed: number;
    wind_dir: string;
    humidity: number;
    visibility: number;
    uv: number;
    feels_like: number;
    precipitation: number;
    cloud_coverage: number;
    pressure: number;
  };
  forecast?: {
    day: string;
    date: string;
    temp_max: number;
    temp_min: number;
    temp_avg: number;
    condition: string;
    icon: string;
    chance_of_rain: number;
    total_precip: number;
    avg_humidity: number;
  }[];
}

class WeatherService {
  /**
   * Get current weather by coordinates
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    try {
      const url = new URL(`${WEATHER_API_BASE_URL}/current.json`);
      url.searchParams.append('key', WEATHER_API_KEY);
      url.searchParams.append('q', `${lat},${lon}`);
      url.searchParams.append('aqi', 'no');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data = await response.json() as WeatherApiResponse;
      return this.transformWeatherData(data);
    } catch (error: any) {
      console.error('Error fetching weather data:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather forecast by coordinates (up to 14 days)
   */
  async getWeatherForecast(lat: number, lon: number, days: number = 5): Promise<WeatherData> {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    // WeatherAPI.com allows up to 14 days forecast
    const forecastDays = Math.min(Math.max(days, 1), 14);

    try {
      const url = new URL(`${WEATHER_API_BASE_URL}/forecast.json`);
      url.searchParams.append('key', WEATHER_API_KEY);
      url.searchParams.append('q', `${lat},${lon}`);
      url.searchParams.append('days', forecastDays.toString());
      url.searchParams.append('aqi', 'no');
      url.searchParams.append('alerts', 'yes');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data = await response.json() as WeatherApiResponse;
      return this.transformWeatherData(data);
    } catch (error: any) {
      console.error('Error fetching weather forecast:', error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * Transform WeatherAPI response to our standard format
   */
  private transformWeatherData(data: WeatherApiResponse): WeatherData {
    const result: WeatherData = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        localtime: data.location.localtime
      },
      current: {
        temp: data.current.temp_c,
        temp_f: data.current.temp_f,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        wind_speed: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        humidity: data.current.humidity,
        visibility: data.current.vis_km,
        uv: data.current.uv,
        feels_like: data.current.feelslike_c,
        precipitation: data.current.precip_mm,
        cloud_coverage: data.current.cloud,
        pressure: data.current.pressure_mb
      }
    };

    // Add forecast if available
    if (data.forecast?.forecastday) {
      result.forecast = data.forecast.forecastday.map(day => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
        date: day.date,
        temp_max: day.day.maxtemp_c,
        temp_min: day.day.mintemp_c,
        temp_avg: day.day.avgtemp_c,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        chance_of_rain: day.day.daily_chance_of_rain,
        total_precip: day.day.totalprecip_mm,
        avg_humidity: day.day.avghumidity
      }));
    }

    return result;
  }

  /**
   * Calculate risk level based on weather conditions
   */
  calculateRiskLevel(weatherData: WeatherData): 'low' | 'medium' | 'high' {
    const { wind_speed, precipitation, visibility } = weatherData.current;

    // High risk conditions
    if (wind_speed > 40 || precipitation > 10 || visibility < 2) {
      return 'high';
    }

    // Medium risk conditions
    if (wind_speed > 25 || precipitation > 5 || visibility < 5) {
      return 'medium';
    }

    // Low risk
    return 'low';
  }
}

export default new WeatherService();
