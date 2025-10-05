import type { IParamMetadata } from "./params.js"

interface IRouteDefinition {
  path: string
  requestMethod: "get" | "post" | "patch" | "delete"
  methodName: string | symbol
}

const controllerRegistry: any[] = []

export const Controller = (prefix: string = ""): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata("prefix", prefix, target)

    if (!Reflect.hasMetadata("routes", target)) {
      Reflect.defineMetadata("routes", [], target)
    }

    controllerRegistry.push(target)
  }
}

const createMethodDecorator = (method: IRouteDefinition["requestMethod"]) => {
  return (path: string = "/"): MethodDecorator => {
    return (target: any, propertyKey: string | symbol) => {
      const controller = target.constructor
      const routes: IRouteDefinition[] = Reflect.getMetadata("routes", controller) || []

      routes.push({
        requestMethod: method,
        path,
        methodName: propertyKey,
      })

      Reflect.defineMetadata("routes", routes, controller)
    }
  }
}

export const Get = createMethodDecorator("get")

export function registerControllers(app: any, baseRoute = '', container: any) {
  for (const ControllerClass of controllerRegistry) {
    const prefix = Reflect.getMetadata('prefix', ControllerClass)
    const routes: IRouteDefinition[] = Reflect.getMetadata('routes', ControllerClass) || []
    const controllerInstance = container.get(ControllerClass)

    for (const route of routes) {
      const urlParts = [
        baseRoute,
        prefix,
        route.path
      ].map(part => part.replace(/^\/|\/$/g, ''))
        .filter(Boolean)

      const fullUrl = '/' + urlParts.join('/')

      app[route.requestMethod](fullUrl, async (request: any, reply: any) => {

        const paramMetadata: IParamMetadata[] = Reflect.getMetadata(route.methodName, controllerInstance) || []

        const args = []

        for (const param of paramMetadata) {
          switch (param.type) {
            case 'query':
              args[param.index] = request.query
              break
          }
        }

        const result = await controllerInstance[route.methodName](...args)

        reply.send(result)
      })
    }
  }
}