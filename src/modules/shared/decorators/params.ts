export type ParamType = "query"

export interface IParamMetadata {
    index: number
    type: ParamType
    key: string | undefined
}

const createParamsDecorator = (type: IParamMetadata['type']) => {
    return (key?: string): ParameterDecorator => {
        return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
            const params: IParamMetadata[] = Reflect.getMetadata(propertyKey, target) || []

            params.push({
                index: parameterIndex,
                type,
                key
            })

            Reflect.defineMetadata(propertyKey, params, target)
        }
    }
}

export const Query = createParamsDecorator("query")