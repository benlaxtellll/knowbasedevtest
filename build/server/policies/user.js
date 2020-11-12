"use strict";

var _errors = require("../errors");

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, "read", _models.User, (actor, user) => user && user.teamId === actor.teamId);
allow(_models.User, "invite", _models.User, actor => {
  return true;
});
allow(_models.User, "update", _models.User, (actor, user) => {
  if (!user || user.teamId !== actor.teamId) return false;
  if (user.id === actor.id) return true;
  throw new _errors.AdminRequiredError();
});
allow(_models.User, "delete", _models.User, (actor, user) => {
  if (!user || user.teamId !== actor.teamId) return false;
  if (user.id === actor.id) return true;
  if (actor.isAdmin && !user.lastActiveAt) return true;
  throw new _errors.AdminRequiredError();
});
allow(_models.User, ["promote", "demote", "activate", "suspend"], _models.User, (actor, user) => {
  if (!user || user.teamId !== actor.teamId) return false;
  if (actor.isAdmin) return true;
  throw new _errors.AdminRequiredError();
});