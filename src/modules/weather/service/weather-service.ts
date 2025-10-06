import { BadRequestError } from "../../shared/custom-erros/bad-request-error.js";
import { NotFoundError } from "../../shared/custom-erros/not-found-error.js";
import { ServiceUnavailableError } from "../../shared/custom-erros/service-unavailable-error.js";
import { InternalServerError } from "../../shared/custom-erros/internal-server-error.js";
import type {
  ClimateData,
  WeatherCondition,
  IWeatherService,
} from "../types/weather-types.js";

export class WeatherService implements IWeatherService {
  private readonly baseUrl = "https://api.open-meteo.com/v1/forecast";
  private readonly geocodeUrl = "https://nominatim.openstreetmap.org/search";

  async getWeatherByCoords(
    latitude: string,
    longitude: string,
    date: string
  ): Promise<ClimateData> {
    if (!date) {
      throw new BadRequestError("The 'date' parameter is required.");
    }

    if (!latitude || !longitude) {
      throw new BadRequestError(
        "The 'longitude' and 'latitude' parameters are required."
      );
    }

    const formattedDate = date.split("T")[0];

    const query = new URLSearchParams({
      latitude: latitude,
      longitude: longitude,
      start_date: formattedDate ?? "",
      end_date: formattedDate ?? "",
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "relative_humidity_2m_mean",
        "wind_speed_10m_max",
        "uv_index_max",
      ].join(","),
      timezone: "auto",
    });

    const url = `${this.baseUrl}?${query}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableError(
        "Could not get climate data at the moment."
      );
    }

    const { daily } = await response.json();

    if (
      !daily ||
      !daily.temperature_2m_max ||
      daily.temperature_2m_max.length === 0
    ) {
      throw new InternalServerError(
        "Unexpected response from the weather API."
      );
    }

    return {
      temperature:
        (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2,
      humidity: daily.relative_humidity_2m_mean[0],
      wind: daily.wind_speed_10m_max[0],
      uv: daily.uv_index_max[0] ?? 0,
      condition: this.mapWeatherCode(daily.weather_code[0]),
    };
  }

  async getWeatherByName(name: string, date: string): Promise<ClimateData> {
    const query = new URLSearchParams({
      format: "json",
      q: name,
      limit: "1",
    });

    const response = await fetch(`${this.geocodeUrl}?${query}`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "ClimaCertoApp/1.0 (your.contact.email@example.com)",
      },
    });

    if (!response.ok) {
      throw new ServiceUnavailableError(
        "Could not get geolocation data at the moment."
      );
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      throw new NotFoundError(`Location not found: ${name}`);
    }

    const { lat, lon } = results[0];

    return this.getWeatherByCoords(lat, lon, date);
  }

  private mapWeatherCode(code: number): WeatherCondition {
    const codeGroups: Record<string, number[]> = {
      Clear: [0],
      Cloudy: [1, 2, 3],
      Fog: [45, 48],
      Rain: [51, 53, 55, 61, 63, 65, 80, 81, 82],
      Snow: [71, 73, 75, 77, 85, 86],
      Windy: [95, 96, 99],
    };

    for (const [condition, codes] of Object.entries(codeGroups)) {
      if (codes.includes(code)) {
        return condition as WeatherCondition;
      }
    }

    return "Other";
  }
}
