import * as fs from "fs"
import { fileURLToPath } from "url"
import path, { dirname } from "path"
import { Container } from "inversify"
import { AnalyzeService } from "../services/analyze-service.js"
import { WeatherService } from "../../weather/service/weather-service.js"
import { AnalyzeController } from "../controllers/analyze-controller.js"
import { ANALYZE_TYPES } from "../types/analyze-di-types.js"
import { RuleEngineService } from "../services/rule-engine-service.js"
import type { IRulesConfig } from "../types/analyze-types.js"
import type { IAnalyzeService } from "../types/analyze-types.js"
import type { IWeatherService } from "../../weather/types/weather-types.js"

const analyzeContainer = new Container()

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)
const configPath = path.join(_dirname, './rules-config.json')
const configFile = fs.readFileSync(configPath, 'utf-8')
const rulesConfig: IRulesConfig = JSON.parse(configFile)

const ruleEngineInstance = new RuleEngineService(rulesConfig)

analyzeContainer.bind<RuleEngineService>(ANALYZE_TYPES.RuleEngineService)
    .toConstantValue(ruleEngineInstance)

analyzeContainer.bind<IAnalyzeService>(ANALYZE_TYPES.AnalyzeService).to(AnalyzeService).inSingletonScope()
analyzeContainer.bind<IWeatherService>(ANALYZE_TYPES.WeatherService).to(WeatherService).inSingletonScope()
analyzeContainer.bind<AnalyzeController>(AnalyzeController).toSelf().inSingletonScope()

export { analyzeContainer }



