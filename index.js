import express from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import promiseRouter from 'express-promise-router'
import * as Sentry from '@sentry/node'
import { Integrations } from '@sentry/tracing'
import nnnRouter from '@middleware/nnn-router'
import cors from 'cors'
import statuses from 'statuses'
import { NODE_ENV_LIST } from '@const/index'

// Customize express response
express.response.sendStatus = function (statusCode) {
  const body = { message: statuses(statusCode) || String(statusCode) }
  this.statusCode = statusCode
  this.type('json')
  this.send(body)
}

const app = express()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
})
// Auto capture error when calling console.error
const error = console.error
console.error = function (err) {
  if (err instanceof Error) Sentry.captureException(err)
  error.apply(this, arguments)
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
  express.urlencoded({ extended: true }),
  express.json({ limit: '50MB' })
)

app.use(
  Sentry.Handlers.requestHandler(),
  Sentry.Handlers.tracingHandler(),
  OpenApiValidator.middleware({
    apiSpec: 'references/openapi.yml',
    validateRequests: true,
    validateResponses: true,
  }),
  nnnRouter({
    routeDir: 'routes',
    baseRouter: promiseRouter(),
    debug: process.env.NODE_ENV === NODE_ENV_LIST.development,
  }),
  Sentry.Handlers.errorHandler(),
  (err, req, res, next) => {
    error.call(console, err)
    return res.sendStatus(err.statusCode || err.status || 500)
  }
)

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
