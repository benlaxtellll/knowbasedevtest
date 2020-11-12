"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _models = require("../models");

var _default = (user, options = {}) => {
  const userData = {};
  userData.id = user.id;
  userData.createdAt = user.createdAt;
  userData.lastActiveAt = user.lastActiveAt;
  userData.name = user.name;
  userData.isAdmin = user.isAdmin;
  userData.isSuspended = user.isSuspended;
  userData.avatarUrl = user.avatarUrl;

  if (options.includeDetails) {
    userData.email = user.email;
  }

  return userData;
};

exports.default = _default;