"use strict";

var _errors = require("../errors");

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, ["read"], _models.Share, (user, share) => user.teamId === share.teamId);
allow(_models.User, ["update", "revoke"], _models.Share, (user, share) => {
  if (!share || user.teamId !== share.teamId) return false;
  if (user.id === share.userId) return true;
  if (user.isAdmin) return true;
  throw new _errors.AdminRequiredError();
});