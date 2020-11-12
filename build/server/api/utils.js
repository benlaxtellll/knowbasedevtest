"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sub_days = _interopRequireDefault(require("date-fns/sub_days"));

var _debug = _interopRequireDefault(require("debug"));

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _errors = require("../errors");

var _models = require("../models");

var _sequelize = require("../sequelize");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _koaRouter.default();
const log = (0, _debug.default)("utils");
router.post("utils.gc", async ctx => {
  const {
    token
  } = ctx.body;

  if (process.env.UTILS_SECRET !== token) {
    throw new _errors.AuthenticationError("Invalid secret token");
  }

  log("Permanently deleting documents older than 30 days…");
  const where = {
    deletedAt: {
      [_sequelize.Op.lt]: (0, _sub_days.default)(new Date(), 30)
    }
  };
  const documents = await _models.Document.scope("withUnpublished").findAll({
    attributes: ["id"],
    where
  });
  const documentIds = documents.map(d => d.id);
  await _models.Attachment.destroy({
    where: {
      documentId: documentIds
    }
  });
  await _models.Document.scope("withUnpublished").destroy({
    where,
    force: true
  });
  log(`Deleted ${documentIds.length} documents`);
  ctx.body = {
    success: true
  };
});
var _default = router;
exports.default = _default;