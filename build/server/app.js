"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var Sentry = _interopRequireWildcard(require("@sentry/node"));

var _koa = _interopRequireDefault(require("koa"));

var _koaCompress = _interopRequireDefault(require("koa-compress"));

var _koaHelmet = _interopRequireWildcard(require("koa-helmet"));

var _koaLogger = _interopRequireDefault(require("koa-logger"));

var _koaMount = _interopRequireDefault(require("koa-mount"));

var _koaOnerror = _interopRequireDefault(require("koa-onerror"));

var _koaSslify = _interopRequireDefault(require("koa-sslify"));

var _api = _interopRequireDefault(require("./api"));

var _auth = _interopRequireDefault(require("./auth"));

var _emails = _interopRequireDefault(require("./emails"));

var _routes = _interopRequireDefault(require("./routes"));

var _updates = _interopRequireDefault(require("./utils/updates"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const app = new _koa.default();
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
app.use((0, _koaCompress.default)());

if (isProduction) {
  // Force redirect to HTTPS protocol unless explicitly disabled
  if (process.env.FORCE_HTTPS !== "false") {
    app.use((0, _koaSslify.default)({
      trustProtoHeader: true
    }));
  } else {
    console.warn("Enforced https was disabled with FORCE_HTTPS env variable");
  } // trust header fields set by our proxy. eg X-Forwarded-For


  app.proxy = true;
} else if (!isTest) {
  /* eslint-disable global-require */
  const convert = require("koa-convert");

  const webpack = require("webpack");

  const devMiddleware = require("koa-webpack-dev-middleware");

  const hotMiddleware = require("koa-webpack-hot-middleware");

  const config = require("../webpack.config.dev");

  const compile = webpack(config);
  /* eslint-enable global-require */

  const middleware = devMiddleware(compile, {
    // display no info to console (only warnings and errors)
    noInfo: true,
    // display nothing to the console
    quiet: false,
    // switch into lazy mode
    // that means no watching, but recompilation on every request
    lazy: false,
    // public path to bind the middleware to
    // use the same as in webpack
    publicPath: config.output.publicPath,
    // options for formatting the statistics
    stats: {
      colors: true
    }
  });
  app.use(async (ctx, next) => {
    ctx.webpackConfig = config;
    ctx.devMiddleware = middleware;
    await next();
  });
  app.use(convert(middleware));
  app.use(convert(hotMiddleware(compile, {
    log: console.log,
    // eslint-disable-line
    path: "/__webpack_hmr",
    heartbeat: 10 * 1000
  })));
  app.use((0, _koaLogger.default)());
  app.use((0, _koaMount.default)("/emails", _emails.default));
} // catch errors in one place, automatically set status and response headers


(0, _koaOnerror.default)(app);

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    maxBreadcrumbs: 0,
    ignoreErrors: [// emitted by Koa when bots attempt to snoop on paths such as wp-admin
    // or the user submits a bad request. These are expected in normal running
    // of the application
    "BadRequestError", "UnauthorizedError"]
  });
}

app.on("error", (error, ctx) => {
  // we don't need to report every time a request stops to the bug tracker
  if (error.code === "EPIPE" || error.code === "ECONNRESET") {
    console.warn("Connection error", {
      error
    });
    return;
  }

  if (process.env.SENTRY_DSN) {
    Sentry.withScope(function (scope) {
      const requestId = ctx.headers["x-request-id"];

      if (requestId) {
        scope.setTag("request_id", requestId);
      }

      scope.addEventProcessor(function (event) {
        return Sentry.Handlers.parseRequest(event, ctx.request);
      });
      Sentry.captureException(error);
    });
  } else {
    console.error(error);
  }
});
app.use((0, _koaMount.default)("/auth", _auth.default));
app.use((0, _koaMount.default)("/api", _api.default));
app.use((0, _koaHelmet.default)());
app.use((0, _koaHelmet.contentSecurityPolicy)({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "gist.github.com", "www.google-analytics.com", "browser.sentry-cdn.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "github.githubassets.com"],
    imgSrc: ["*", "data:", "blob:"],
    frameSrc: ["*"],
    connectSrc: ["*"] // Removed because connect-src: self + websockets does not work in Safari
    // Ref: https://bugs.webkit.org/show_bug.cgi?id=201591
    // connectSrc: compact([
    //   "'self'",
    //   process.env.AWS_S3_UPLOAD_BUCKET_URL.replace("s3:", "localhost:"),
    //   "www.google-analytics.com",
    //   "api.github.com",
    //   "sentry.io",
    // ]),

  }
}));
app.use((0, _koaHelmet.dnsPrefetchControl)({
  allow: true
}));
app.use((0, _koaHelmet.referrerPolicy)({
  policy: "no-referrer"
}));
app.use((0, _koaMount.default)(_routes.default));
/**
 * Production updates and anonymous analytics.
 *
 * Set ENABLE_UPDATES=false to disable them for your installation
 */

if (process.env.ENABLE_UPDATES !== "false" && isProduction) {
  (0, _updates.default)();
  setInterval(_updates.default, 24 * 3600 * 1000);
}

var _default = app;
exports.default = _default;