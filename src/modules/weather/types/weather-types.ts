export type WeatherCondition = "Clear" | "Cloudy" | "Fog" | "Rain" | "Snow" | "Windy" | "Other"

export interface ClimateData {
  temperature: number // °C
  humidity: number // %
  wind: number // m/s
  uv: number // índice UV
  condition: WeatherCondition
  precipitation: any

}

export interface IdealConditions {
  tempRange: [number, number]
  humidityRange: [number, number]
  maxWind: number
  allowRain: boolean
  maxUV: number
}

export interface IWeatherService {
  getWeatherByCoords(latitude: string, longitude: string, date: string): Promise<ClimateData>
  getWeatherByName(name: string, date: string): Promise<ClimateData>
}
