"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _errors = require("../errors");

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _models = require("../models");

var _policies = _interopRequireDefault(require("../policies"));

var _presenters = require("../presenters");

var _pagination = _interopRequireDefault(require("./middlewares/pagination"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Op = _sequelize.default.Op;
const {
  authorize
} = _policies.default;
const router = new _koaRouter.default();
router.post("shares.info", (0, _authentication.default)(), async ctx => {
  const {
    id,
    documentId
  } = ctx.body;
  ctx.assertUuid(id || documentId, "id or documentId is required");
  const user = ctx.state.user;
  const share = await _models.Share.findOne({
    where: id ? {
      id,
      revokedAt: {
        [Op.eq]: null
      }
    } : {
      documentId,
      userId: user.id,
      revokedAt: {
        [Op.eq]: null
      }
    }
  });

  if (!share || !share.document) {
    throw new _errors.NotFoundError();
  }

  authorize(user, "read", share);
  ctx.body = {
    data: (0, _presenters.presentShare)(share),
    policies: (0, _presenters.presentPolicies)(user, [share])
  };
});
router.post("shares.list", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  let {
    sort = "updatedAt",
    direction
  } = ctx.body;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const where = {
    teamId: user.teamId,
    userId: user.id,
    published: true,
    revokedAt: {
      [Op.eq]: null
    }
  };

  if (user.isAdmin) {
    delete where.userId;
  }

  const collectionIds = await user.collectionIds();
  const shares = await _models.Share.findAll({
    where,
    order: [[sort, direction]],
    include: [{
      model: _models.Document,
      required: true,
      paranoid: true,
      as: "document",
      where: {
        collectionId: collectionIds
      }
    }, {
      model: _models.User,
      required: true,
      as: "user"
    }, {
      model: _models.Team,
      required: true,
      as: "team"
    }],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  ctx.body = {
    pagination: ctx.state.pagination,
    data: shares.map(_presenters.presentShare),
    policies: (0, _presenters.presentPolicies)(user, shares)
  };
});
router.post("shares.update", (0, _authentication.default)(), async ctx => {
  const {
    id,
    published
  } = ctx.body;
  ctx.assertUuid(id, "id is required");
  ctx.assertPresent(published, "published is required");
  const user = ctx.state.user;
  const share = await _models.Share.findByPk(id);
  authorize(user, "update", share);
  share.published = published;
  await share.save();
  await _models.Event.create({
    name: "shares.update",
    documentId: share.documentId,
    modelId: share.id,
    teamId: user.teamId,
    actorId: user.id,
    data: {
      published
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: (0, _presenters.presentShare)(share),
    policies: (0, _presenters.presentPolicies)(user, [share])
  };
});
router.post("shares.create", (0, _authentication.default)(), async ctx => {
  const {
    documentId
  } = ctx.body;
  ctx.assertPresent(documentId, "documentId is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(documentId, {
    userId: user.id
  });
  const team = await _models.Team.findByPk(user.teamId);
  authorize(user, "share", document);
  authorize(user, "share", team);
  const [share, isCreated] = await _models.Share.findOrCreate({
    where: {
      documentId,
      userId: user.id,
      teamId: user.teamId,
      revokedAt: null
    }
  });

  if (isCreated) {
    await _models.Event.create({
      name: "shares.create",
      documentId,
      collectionId: document.collectionId,
      modelId: share.id,
      teamId: user.teamId,
      actorId: user.id,
      data: {
        name: document.title
      },
      ip: ctx.request.ip
    });
  }

  share.team = team;
  share.user = user;
  share.document = document;
  ctx.body = {
    data: (0, _presenters.presentShare)(share),
    policies: (0, _presenters.presentPolicies)(user, [share])
  };
});
router.post("shares.revoke", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertUuid(id, "id is required");
  const user = ctx.state.user;
  const share = await _models.Share.findByPk(id);
  authorize(user, "revoke", share);
  const document = await _models.Document.findByPk(share.documentId);

  if (!document) {
    throw new _errors.NotFoundError();
  }

  await share.revoke(user.id);
  await _models.Event.create({
    name: "shares.revoke",
    documentId: document.id,
    collectionId: document.collectionId,
    modelId: share.id,
    teamId: user.teamId,
    actorId: user.id,
    data: {
      name: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    success: true
  };
});
var _default = router;
exports.default = _default;