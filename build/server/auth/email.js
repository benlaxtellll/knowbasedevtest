"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sub_minutes = _interopRequireDefault(require("date-fns/sub_minutes"));

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _errors = require("../errors");

var _mailer = _interopRequireDefault(require("../mailer"));

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _methodOverride = _interopRequireDefault(require("../middlewares/methodOverride"));

var _validation = _interopRequireDefault(require("../middlewares/validation"));

var _models = require("../models");

var _jwt = require("../utils/jwt");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _koaRouter.default();
router.use((0, _methodOverride.default)());
router.use((0, _validation.default)());
router.post("email", async ctx => {
  const {
    email
  } = ctx.body;
  ctx.assertEmail(email, "email is required");
  const user = await _models.User.findOne({
    where: {
      email: email.toLowerCase()
    }
  });

  if (user) {
    const team = await _models.Team.findByPk(user.teamId); // If the user matches an email address associated with an SSO
    // signin then just forward them directly to that service's
    // login page

    if (user.service && user.service !== "email") {
      ctx.body = {
        redirect: `${team.url}/auth/${user.service}`
      };
      return;
    }

    if (!team.guestSignin) {
      throw new _errors.AuthorizationError();
    } // basic rate limit of endpoint to prevent send email abuse


    if (user.lastSigninEmailSentAt && user.lastSigninEmailSentAt > (0, _sub_minutes.default)(new Date(), 2)) {
      ctx.redirect(`${team.url}?notice=email-auth-ratelimit`);
      return;
    } // send email to users registered address with a short-lived token


    _mailer.default.signin({
      to: user.email,
      token: user.getEmailSigninToken(),
      teamUrl: team.url
    });

    user.lastSigninEmailSentAt = new Date();
    await user.save();
  } // respond with success regardless of whether an email was sent


  ctx.body = {
    success: true
  };
});
router.get("email.callback", (0, _authentication.default)({
  required: false
}), async ctx => {
  const {
    token
  } = ctx.request.query;
  ctx.assertPresent(token, "token is required");

  try {
    const user = await (0, _jwt.getUserForEmailSigninToken)(token);
    const team = await _models.Team.findByPk(user.teamId);

    if (!team.guestSignin) {
      throw new _errors.AuthorizationError();
    }

    if (!user.service) {
      user.service = "email";
      user.lastActiveAt = new Date();
      await user.save();
    } // set cookies on response and redirect to team subdomain


    ctx.signIn(user, team, "email", false);
  } catch (err) {
    ctx.redirect(`${process.env.URL}?notice=expired-token`);
  }
});
var _default = router;
exports.default = _default;