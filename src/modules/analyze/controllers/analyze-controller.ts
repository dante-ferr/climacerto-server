import { injectable, inject } from "inversify"
import { Query } from "../../shared/decorators/params.js"
import { Controller, Get } from "../../shared/decorators/routes.js"
import { ANALYZE_TYPES } from "../types/analyze-di-types.js"
import type { AnalyzeCoordsDto, AnalyzeNameDto, IAnalyzeService } from "../types/analyze-types.js"

@injectable()
@Controller('analyze')
export class AnalyzeController {
    constructor(@inject(ANALYZE_TYPES.AnalyzeService) private readonly analyzeService: IAnalyzeService) { }

    @Get("/coords")
    async analyzeByCoords(@Query() data: AnalyzeCoordsDto) {
        return await this.analyzeService.getAnalysisByCoords(data)
    }

    @Get("/name")
    async analyzeByName(@Query() data: AnalyzeNameDto) {
        console.log(data);
        return await this.analyzeService.getAnalysisByName(data)
    }
}