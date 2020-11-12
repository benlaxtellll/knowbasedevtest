"use strict";

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, "create", _models.ApiKey);
allow(_models.User, ["read", "update", "delete"], _models.ApiKey, (user, apiKey) => user && user.id === apiKey.userId);