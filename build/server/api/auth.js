"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _lodash = require("lodash");

var _domains = require("../../shared/utils/domains");

var _routeHelpers = require("../../shared/utils/routeHelpers");

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _models = require("../models");

var _presenters = require("../presenters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _koaRouter.default();
let services = [];

if (process.env.GOOGLE_CLIENT_ID) {
  services.push({
    id: "google",
    name: "Google",
    authUrl: (0, _routeHelpers.signin)("google")
  });
}

if (process.env.SLACK_KEY) {
  services.push({
    id: "slack",
    name: "Slack",
    authUrl: (0, _routeHelpers.signin)("slack")
  });
}

services.push({
  id: "email",
  name: "Email",
  authUrl: ""
});

function filterServices(team) {
  let output = services;

  if (team && !team.googleId) {
    output = (0, _lodash.reject)(output, service => service.id === "google");
  }

  if (team && !team.slackId) {
    output = (0, _lodash.reject)(output, service => service.id === "slack");
  }

  if (!team || !team.guestSignin) {
    output = (0, _lodash.reject)(output, service => service.id === "email");
  }

  return output;
}

router.post("auth.config", async ctx => {
  // If self hosted AND there is only one team then that team becomes the
  // brand for the knowledge base and it's guest signin option is used for the
  // root login page.
  if (process.env.DEPLOYMENT !== "hosted") {
    const teams = await _models.Team.findAll();

    if (teams.length === 1) {
      const team = teams[0];
      ctx.body = {
        data: {
          name: team.name,
          services: filterServices(team)
        }
      };
      return;
    }
  } // If subdomain signin page then we return minimal team details to allow
  // for a custom screen showing only relevant signin options for that team.


  if (process.env.SUBDOMAINS_ENABLED === "true" && (0, _domains.isCustomSubdomain)(ctx.request.hostname)) {
    const domain = (0, _domains.parseDomain)(ctx.request.hostname);
    const subdomain = domain ? domain.subdomain : undefined;
    const team = await _models.Team.findOne({
      where: {
        subdomain
      }
    });

    if (team) {
      ctx.body = {
        data: {
          name: team.name,
          hostname: ctx.request.hostname,
          services: filterServices(team)
        }
      };
      return;
    }
  } // Otherwise, we're requesting from the standard root signin page


  ctx.body = {
    data: {
      services: filterServices()
    }
  };
});
router.post("auth.info", (0, _authentication.default)(), async ctx => {
  const user = ctx.state.user;
  const team = await _models.Team.findByPk(user.teamId);
  ctx.body = {
    data: {
      user: (0, _presenters.presentUser)(user, {
        includeDetails: true
      }),
      team: (0, _presenters.presentTeam)(team)
    },
    policies: (0, _presenters.presentPolicies)(user, [team])
  };
});
var _default = router;
exports.default = _default;