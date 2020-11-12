"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _koa = _interopRequireDefault(require("koa"));

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _koaSendfile = _interopRequireDefault(require("koa-sendfile"));

var _koaStatic = _interopRequireDefault(require("koa-static"));

var _env = _interopRequireDefault(require("./env"));

var _apexRedirect = _interopRequireDefault(require("./middlewares/apexRedirect"));

var _opensearch = require("./utils/opensearch");

var _robots = require("./utils/robots");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const isProduction = process.env.NODE_ENV === "production";
const koa = new _koa.default();
const router = new _koaRouter.default();

const readFile = _util.default.promisify(_fs.default.readFile);

const readIndexFile = async ctx => {
  if (isProduction) {
    return readFile(_path.default.join(__dirname, "../app/index.html"));
  }

  const middleware = ctx.devMiddleware;
  await new Promise(resolve => middleware.waitUntilValid(resolve));
  return new Promise((resolve, reject) => {
    middleware.fileSystem.readFile(`${ctx.webpackConfig.output.path}/index.html`, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
};

const renderApp = async (ctx, next) => {
  if (ctx.request.path === "/realtime/") {
    return next();
  }

  const page = await readIndexFile(ctx);
  const env = `
    window.env = ${JSON.stringify(_env.default)};
  `;
  ctx.body = page.toString().replace(/\/\/inject-env\/\//g, env).replace(/\/\/inject-sentry-dsn\/\//g, process.env.SENTRY_DSN || "").replace(/\/\/inject-slack-app-id\/\//g, process.env.SLACK_APP_ID || "");
}; // serve static assets


koa.use((0, _koaStatic.default)(_path.default.resolve(__dirname, "../../public"), {
  maxage: 60 * 60 * 24 * 30 * 1000
}));
router.get("/_health", ctx => ctx.body = "OK");

if (process.env.NODE_ENV === "production") {
  router.get("/static/*", async ctx => {
    ctx.set({
      "Cache-Control": `max-age=${356 * 24 * 60 * 60}`
    });
    await (0, _koaSendfile.default)(ctx, _path.default.join(__dirname, "../app/", ctx.path.substring(8)));
  });
}

router.get("/robots.txt", ctx => {
  ctx.body = (0, _robots.robotsResponse)(ctx);
});
router.get("/opensearch.xml", ctx => {
  ctx.type = "text/xml";
  ctx.body = (0, _opensearch.opensearchResponse)();
});
router.get("/share/*", (ctx, next) => {
  ctx.remove("X-Frame-Options");
  return renderApp(ctx, next);
}); // catch all for application

router.get("*", renderApp); // middleware

koa.use((0, _apexRedirect.default)());
koa.use(router.routes());
var _default = koa;
exports.default = _default;