"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _userInviter = _interopRequireDefault(require("../commands/userInviter"));

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _models = require("../models");

var _policies = _interopRequireDefault(require("../policies"));

var _presenters = require("../presenters");

var _sequelize = require("../sequelize");

var _pagination = _interopRequireDefault(require("./middlewares/pagination"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  authorize
} = _policies.default;
const router = new _koaRouter.default();
router.post("users.list", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    sort = "createdAt",
    query,
    includeSuspended = false
  } = ctx.body;
  let direction = ctx.body.direction;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  let where = {
    teamId: user.teamId
  };

  if (!includeSuspended) {
    where = { ...where,
      suspendedAt: {
        [_sequelize.Op.eq]: null
      }
    };
  }

  if (query) {
    where = { ...where,
      name: {
        [_sequelize.Op.iLike]: `%${query}%`
      }
    };
  }

  const users = await _models.User.findAll({
    where,
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  ctx.body = {
    pagination: ctx.state.pagination,
    data: users.map(listUser => (0, _presenters.presentUser)(listUser, {
      includeDetails: user.isAdmin
    }))
  };
});
router.post("users.info", (0, _authentication.default)(), async ctx => {
  ctx.body = {
    data: (0, _presenters.presentUser)(ctx.state.user)
  };
});
router.post("users.update", (0, _authentication.default)(), async ctx => {
  const {
    user
  } = ctx.state;
  const {
    name,
    avatarUrl
  } = ctx.body;
  if (name) user.name = name;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  await user.save();
  ctx.body = {
    data: (0, _presenters.presentUser)(user, {
      includeDetails: true
    })
  };
}); // Admin specific

router.post("users.promote", (0, _authentication.default)(), async ctx => {
  const userId = ctx.body.id;
  const teamId = ctx.state.user.teamId;
  ctx.assertPresent(userId, "id is required");
  const user = await _models.User.findByPk(userId);
  authorize(ctx.state.user, "promote", user);
  const team = await _models.Team.findByPk(teamId);
  await team.addAdmin(user);
  await _models.Event.create({
    name: "users.promote",
    actorId: ctx.state.user.id,
    userId,
    teamId,
    data: {
      name: user.name
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: (0, _presenters.presentUser)(user, {
      includeDetails: true
    })
  };
});
router.post("users.demote", (0, _authentication.default)(), async ctx => {
  const userId = ctx.body.id;
  const teamId = ctx.state.user.teamId;
  ctx.assertPresent(userId, "id is required");
  const user = await _models.User.findByPk(userId);
  authorize(ctx.state.user, "demote", user);
  const team = await _models.Team.findByPk(teamId);
  await team.removeAdmin(user);
  await _models.Event.create({
    name: "users.demote",
    actorId: ctx.state.user.id,
    userId,
    teamId,
    data: {
      name: user.name
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: (0, _presenters.presentUser)(user, {
      includeDetails: true
    })
  };
});
router.post("users.suspend", (0, _authentication.default)(), async ctx => {
  const admin = ctx.state.user;
  const userId = ctx.body.id;
  const teamId = ctx.state.user.teamId;
  ctx.assertPresent(userId, "id is required");
  const user = await _models.User.findByPk(userId);
  authorize(ctx.state.user, "suspend", user);
  const team = await _models.Team.findByPk(teamId);
  await team.suspendUser(user, admin);
  await _models.Event.create({
    name: "users.suspend",
    actorId: ctx.state.user.id,
    userId,
    teamId,
    data: {
      name: user.name
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: (0, _presenters.presentUser)(user, {
      includeDetails: true
    })
  };
});
router.post("users.activate", (0, _authentication.default)(), async ctx => {
  const admin = ctx.state.user;
  const userId = ctx.body.id;
  const teamId = ctx.state.user.teamId;
  ctx.assertPresent(userId, "id is required");
  const user = await _models.User.findByPk(userId);
  authorize(ctx.state.user, "activate", user);
  const team = await _models.Team.findByPk(teamId);
  await team.activateUser(user, admin);
  await _models.Event.create({
    name: "users.activate",
    actorId: ctx.state.user.id,
    userId,
    teamId,
    data: {
      name: user.name
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: (0, _presenters.presentUser)(user, {
      includeDetails: true
    })
  };
});
router.post("users.invite", (0, _authentication.default)(), async ctx => {
  const {
    invites
  } = ctx.body;
  ctx.assertPresent(invites, "invites is required");
  const user = ctx.state.user;
  authorize(user, "invite", _models.User);
  const response = await (0, _userInviter.default)({
    user,
    invites,
    ip: ctx.request.ip
  });
  ctx.body = {
    data: {
      sent: response.sent,
      users: response.users.map(user => (0, _presenters.presentUser)(user))
    }
  };
});
router.post("users.delete", (0, _authentication.default)(), async ctx => {
  const {
    confirmation,
    id
  } = ctx.body;
  ctx.assertPresent(confirmation, "confirmation is required");
  let user = ctx.state.user;
  if (id) user = await _models.User.findByPk(id);
  authorize(ctx.state.user, "delete", user);
  await user.destroy();
  await _models.Event.create({
    name: "users.delete",
    actorId: user.id,
    userId: user.id,
    teamId: user.teamId,
    data: {
      name: user.name
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    success: true
  };
});
var _default = router;
exports.default = _default;