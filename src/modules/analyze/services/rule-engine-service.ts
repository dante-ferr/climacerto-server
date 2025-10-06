import { injectable } from "inversify"
import type { IAnalysisResponse, IAnalysisResult, IClimateData, ICondition, IRulesConfig } from "../types/analyze-types.js"

const INITIAL_SCORE = 50

@injectable()
export class RuleEngineService {
    constructor(private readonly config: IRulesConfig) { }

    public analyze(climate: IClimateData, activity: string): IAnalysisResponse {
        const { score, pros, cons } = this.calculateScoreAndMessages(climate, activity)
        const { color, qualitative } = this.getAnalysisResult(score)
        const trendAlert = this.getTrendAlert(climate)

        return { score, qualitative, color, pros, cons, trendAlert }
    }

    private calculateScoreAndMessages(climate: IClimateData, activity: string) {
        let score = INITIAL_SCORE
        const pros: string[] = []
        const cons: string[] = []

        const activityRules = this.config.activityRules || {}

        const rules = activityRules[activity] || activityRules['default'] || []

        for (const rule of rules) {
            const condition = rule.condition
            if (this.checkCondition(climate, condition)) {
                score += rule.points
                const targetArray = rule.points > 0 ? pros : cons
                targetArray.push(rule.message)
            }
        }

        if (pros.length === 0 && cons.length === 0) {
            cons.push("The weather conditions are neutral or insufficient for a detailed analysis of this activity.")
        }

        score = Math.min(Math.max(score, 0), 100)

        return { score, pros, cons }
    }
    private getAnalysisResult(score: number): IAnalysisResult {
        const scoreGroup = Math.floor(score / 10)

        const analysisMap = this.config.analysisMap || {}
        const thresholds = Object.keys(analysisMap).map(Number).sort((a, b) => b - a)

        for (const threshold of thresholds) {
            if (scoreGroup >= threshold) {
                const result = analysisMap[threshold]
                if (result) {
                    return result
                }
            }
        }

        return analysisMap['1'] || { color: 'gray', qualitative: 'Indeterminado' }
    }

    private getTrendAlert(climate: IClimateData): string | undefined {
        const trendRules = this.config.trendAlertRules || []

        for (const rule of trendRules) {
            if (this.checkCondition(climate, rule.condition)) {
                return rule.message
            }
        }

        return undefined
    }

    private checkCondition(climate: IClimateData, condition: ICondition): boolean {
        const climateValue = climate[condition.fact]
        if (climateValue === undefined) return false

        switch (condition.operator) {
            case 'equals': return climateValue === condition.value
            case 'greaterThan': return climateValue > condition.value
            case 'lessThan': return climateValue < condition.value
            case 'between': return climateValue >= condition.value[0] && climateValue <= condition.value[1]
            case 'outside': return climateValue < condition.value[0] || climateValue > condition.value[1]
            case 'in': return Array.isArray(condition.value) && condition.value.includes(climateValue)
            default: return false
        }
    }
}