"use strict";

var _errors = require("../errors");

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, "create", _models.Integration);
allow(_models.User, "read", _models.Integration, (user, integration) => user.teamId === integration.teamId);
allow(_models.User, ["update", "delete"], _models.Integration, (user, integration) => {
  if (!integration || user.teamId !== integration.teamId) return false;
  if (user.isAdmin) return true;
  throw new _errors.AdminRequiredError();
});