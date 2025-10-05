interface AnalyzeBaseDto {
    activityId: string
    date: string
}

export interface AnalyzeCoordsDto extends AnalyzeBaseDto {
    latitude: string
    longitude: string
}

export interface AnalyzeNameDto extends AnalyzeBaseDto {
    name: string
}

export interface IAnalysisResponse {
    score: number
    qualitative: string
    color: string
    pros: string[]
    cons: string[]
    trendAlert?: string
}

export interface IAnalyzeService {
    getAnalysisByCoords(data: AnalyzeCoordsDto): Promise<IAnalysisResponse>
    getAnalysisByName(data: AnalyzeNameDto): Promise<IAnalysisResponse>
}

export interface IClimateData {
    temperature: number
    humidity: number
    wind: number
    uv: number
    condition: string
}

export interface ICondition {
    fact: keyof IClimateData
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'between' | 'outside' | 'in'
    value: any
}

export interface IRule {
    condition: ICondition
    points: number
    message: string
}

export interface IAnalysisResult {
    color: string
    qualitative: string
}

export interface IRulesConfig {
    activityRules: Record<string, IRule[]>
    analysisMap: Record<string, IAnalysisResult>
    trendAlertRules: IRule[]
}