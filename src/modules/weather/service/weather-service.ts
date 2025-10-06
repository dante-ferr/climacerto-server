import { BadRequestError } from "../../shared/custom-erros/bad-request-error.js"
import { NotFoundError } from "../../shared/custom-erros/not-found-error.js"
import { ServiceUnavailableError } from "../../shared/custom-erros/service-unavailable-error.js"
import { InternalServerError } from "../../shared/custom-erros/internal-server-error.js"
import type { ClimateData, WeatherCondition, IWeatherService } from "../types/weather-types.js"

interface NasaPowerResponse {
    properties?: {
        parameter?: Record<string, Record<string, number>>
    }
}

interface OpenMeteoResponse {
    daily: {
        weather_code: number[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        relative_humidity_2m_mean: number[]
        wind_speed_10m_max: number[]
        uv_index_max: number[]
    }
}

export class WeatherService implements IWeatherService {
    private readonly nasaBaseUrl = "https://power.larc.nasa.gov/api/temporal/daily/point"
    private readonly openMeteoBaseUrl = "https://api.open-meteo.com/v1/forecast"
    private readonly geocodeUrl = "https://nominatim.openstreetmap.org/search"

    async getWeatherByCoords(latitude: string, longitude: string, date: string): Promise<ClimateData> {
        if (!latitude || !longitude) {
            throw new BadRequestError("The 'longitude' and 'latitude' parameters are required.")
        }
        if (!date) {
            throw new BadRequestError("The 'date' parameter is required.")
        }

        // Tenta a NASA primeiro
        try {
            return await this.getWeatherFromNasa(latitude, longitude, date)
        } catch (err) {
            console.warn("NASA POWER failed, falling back to Open-Meteo:", err)
            // Se NASA falhar, chama Open-Meteo
            return await this.getWeatherFromOpenMeteo(latitude, longitude, date)
        }
    }

    async getWeatherByName(name: string, date: string): Promise<ClimateData> {
        const query = new URLSearchParams({ format: "json", q: name, limit: "1" })
        const response = await fetch(`${this.geocodeUrl}?${query}`, {
            headers: {
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent": "ClimaCertoApp/1.0 (your.contact.email@example.com)",
            },
        })

        if (!response.ok) {
            throw new ServiceUnavailableError("Could not get geolocation data at the moment.")
        }

        const results = await response.json()
        if (!results || results.length === 0) {
            throw new NotFoundError(`Location not found: ${name}`)
        }

        const { lat, lon } = results[0]
        return this.getWeatherByCoords(lat, lon, date)
    }

    private async getWeatherFromNasa(lat: string, lon: string, date: string): Promise<ClimateData> {
        const [rawDate] = date.split("T")
        const formattedDate = (rawDate ?? "").replace(/-/g, "")

        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            start: formattedDate,
            end: formattedDate,
            community: "RE",
            format: "JSON",
            parameters: ["T2M_MAX", "T2M_MIN", "RH2M", "WS10M", "ALLSKY_SFC_UV_INDEX", "PRECTOTCORR"].join(","),
        })

        const url = `${this.nasaBaseUrl}?${params}`
        const response = await fetch(url)
        if (!response.ok) {
            throw new ServiceUnavailableError("NASA POWER API is currently unavailable.")
        }

        const json: NasaPowerResponse = await response.json()
        const data = json.properties?.parameter
        if (!data || !data.T2M_MAX) throw new InternalServerError("Invalid response from NASA POWER.")

        const key = Object.keys(data.T2M_MAX)[0]
        if (!key) throw new InternalServerError("No valid date found in NASA POWER response.")

        const tmax = data.T2M_MAX[key] ?? 0
        const tmin = data.T2M_MIN?.[key] ?? 0
        const humidity = data.RH2M?.[key] ?? 0
        const wind = data.WS10M?.[key] ?? 0
        const uv = data.ALLSKY_SFC_UV_INDEX?.[key] ?? 0
        const precipitation = data.PRECTOTCORR?.[key] ?? 0

        return {
            temperature: (tmax + tmin) / 2,
            humidity,
            wind,
            uv,
            condition: this.mapWeather(uv, precipitation),
            precipitation
        }
    }

    private async getWeatherFromOpenMeteo(lat: string, lon: string, date: string): Promise<ClimateData> {
        const formattedDate = date.split("T")[0]

        const params = new URLSearchParams({
            latitude: lat ?? "",
            longitude: lon ?? "",
            start_date: formattedDate ?? "",
            end_date: formattedDate ?? "",
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "relative_humidity_2m_mean",
                "wind_speed_10m_max",
                "uv_index_max"
            ].join(","),
            timezone: "auto"
        })

        const url = `${this.openMeteoBaseUrl}?${params}`
        const response = await fetch(url)
        if (!response.ok) throw new ServiceUnavailableError("Open-Meteo API unavailable.")

        const json: OpenMeteoResponse = await response.json()
        return {
            temperature: ((json.daily.temperature_2m_max?.[0] ?? 0) + (json.daily.temperature_2m_min?.[0] ?? 0)) / 2,
            humidity: json.daily.relative_humidity_2m_mean?.[0] ?? 0,
            wind: json.daily.wind_speed_10m_max?.[0] ?? 0,
            uv: json.daily.uv_index_max?.[0] ?? 0,
            condition: this.mapWeatherCode(json.daily.weather_code?.[0] ?? 0),
            precipitation: 0 // Open-Meteo não retorna PRECTOTCORR
        }

    }

    private mapWeather(uv: number, precipitation: number): WeatherCondition {
        if (precipitation > 2) return "Rain"
        if (uv < 2) return "Fog"
        if (uv < 4) return "Cloudy"
        if (uv < 7) return "Clear"
        if (uv >= 7 && uv < 9) return "Windy"
        return "Other"
    }

    private mapWeatherCode(code: number): WeatherCondition {
        const codeGroups: Record<string, number[]> = {
            Clear: [0],
            Cloudy: [1, 2, 3],
            Fog: [45, 48],
            Rain: [51, 53, 55, 61, 63, 65, 80, 81, 82],
            Snow: [71, 73, 75, 77, 85, 86],
            Windy: [95, 96, 99],
        }
        for (const [cond, codes] of Object.entries(codeGroups)) {
            if (codes.includes(code)) return cond as WeatherCondition
        }
        return "Other"
    }
}
