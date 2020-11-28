import fp from 'fastify-plugin'

function mapValues(object: Record<string, any>, iteratee: Function) {
  const result: Record<string, any> = {}
  Object.keys(object).forEach((key) => {
    result[key] = iteratee(object[key], key, object)
  })
  return result
}

function updateSchema(data: any): any {
  if (Array.isArray(data)) {
    return data.map(updateSchema)
  } else if (typeof data === 'object' && data !== null) {
    const result = mapValues(data, updateSchema)
    if (result.type === 'object') {
      result.additionalProperties = result.additionalProperties || false
    }
    return result
  } else {
    return data
  }
}

export const noAdditionalProperties = fp(async (fastify, options: any) => {
  options = Object.assign(
    {
      body: true,
      headers: false,
      params: false,
      query: true
    },
    options
  )

  fastify.addHook('onRoute', (route: any) => {
    if (route.schema) {
      if (route.schema.body && options.body) {
        route.schema.body = updateSchema(route.schema.body.valueOf())
      }
      if (route.schema.headers && options.headers) {
        route.schema.headers = updateSchema(route.schema.headers.valueOf())
      }
      if (route.schema.params && options.params) {
        route.schema.params = updateSchema(route.schema.params.valueOf())
      }
      if (route.schema.querystring && options.query) {
        route.schema.querystring = updateSchema(
          route.schema.querystring.valueOf()
        )
      }
    }
  })
})
