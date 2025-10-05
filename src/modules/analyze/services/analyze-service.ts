import { injectable, inject } from "inversify"
import { ANALYZE_TYPES } from "../types/analyze-di-types.js"
import type { IWeatherService } from "../../weather/types/weather-types.js"
import { RuleEngineService } from "./rule-engine-service.js"
import type { AnalyzeCoordsDto, AnalyzeNameDto, IAnalyzeService, IAnalysisResponse } from "../types/analyze-types.js"

@injectable()
export class AnalyzeService implements IAnalyzeService {
    constructor(
        @inject(ANALYZE_TYPES.WeatherService) private readonly weatherService: IWeatherService,
        @inject(ANALYZE_TYPES.RuleEngineService) private readonly ruleEngine: RuleEngineService
    ) { }

    async getAnalysisByCoords(dto: AnalyzeCoordsDto): Promise<IAnalysisResponse> {
        const climateData = await this.weatherService.getWeatherByCoords(dto.latitude, dto.longitude, dto.date)

        const formattedActivityId = dto.activityId.toLowerCase()

        return this.ruleEngine.analyze(climateData, formattedActivityId)
    }

    async getAnalysisByName(dto: AnalyzeNameDto): Promise<IAnalysisResponse> {
        const climateData = await this.weatherService.getWeatherByName(dto.name, dto.date)

        const formattedActivityId = dto.activityId.toLowerCase()

        return this.ruleEngine.analyze(climateData, formattedActivityId)
    }
}