"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _add_months = _interopRequireDefault(require("date-fns/add_months"));

var _koa = _interopRequireDefault(require("koa"));

var _koaBody = _interopRequireDefault(require("koa-body"));

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _validation = _interopRequireDefault(require("../middlewares/validation"));

var _models = require("../models");

var _domains = require("../utils/domains");

var _email = _interopRequireDefault(require("./email"));

var _google = _interopRequireDefault(require("./google"));

var _slack = _interopRequireDefault(require("./slack"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = new _koa.default();
const router = new _koaRouter.default();
router.use("/", _slack.default.routes());
router.use("/", _google.default.routes());
router.use("/", _email.default.routes());
router.get("/redirect", (0, _authentication.default)(), async ctx => {
  const user = ctx.state.user; // transfer access token cookie from root to subdomain

  const rootToken = ctx.cookies.get("accessToken");
  const jwtToken = user.getJwtToken();

  if (rootToken === jwtToken) {
    ctx.cookies.set("accessToken", undefined, {
      httpOnly: true,
      domain: (0, _domains.getCookieDomain)(ctx.request.hostname)
    });
    ctx.cookies.set("accessToken", jwtToken, {
      httpOnly: false,
      expires: (0, _add_months.default)(new Date(), 3)
    });
  }

  const team = await _models.Team.findByPk(user.teamId);
  ctx.redirect(`${team.url}/home`);
});
app.use((0, _koaBody.default)());
app.use((0, _validation.default)());
app.use(router.routes());
var _default = app;
exports.default = _default;