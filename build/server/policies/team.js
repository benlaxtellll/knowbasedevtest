"use strict";

var _errors = require("../errors");

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, "read", _models.Team, (user, team) => team && user.teamId === team.id);
allow(_models.User, "share", _models.Team, (user, team) => {
  if (!team || user.teamId !== team.id) return false;
  return team.sharing;
});
allow(_models.User, "auditLog", _models.Team, user => {
  if (user.isAdmin) return true;
  return false;
});
allow(_models.User, "invite", _models.Team, user => {
  if (user.isAdmin) return true;
  return false;
}); // ??? policy for creating new groups, I don't know how to do this other than on the team level

allow(_models.User, "group", _models.Team, user => {
  if (user.isAdmin) return true;
  throw new _errors.AdminRequiredError();
});
allow(_models.User, ["update", "export"], _models.Team, (user, team) => {
  if (!team || user.teamId !== team.id) return false;
  if (user.isAdmin) return true;
  throw new _errors.AdminRequiredError();
});