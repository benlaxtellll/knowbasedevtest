"use strict";

var _invariant = _interopRequireDefault(require("invariant"));

var _lodash = require("lodash");

var _errors = require("../errors");

var _models = require("../models");

var _policy = _interopRequireDefault(require("./policy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  allow
} = _policy.default;
allow(_models.User, "create", _models.Collection);
allow(_models.User, ["read", "export"], _models.Collection, (user, collection) => {
  if (!collection || user.teamId !== collection.teamId) return false;

  if (collection.private) {
    (0, _invariant.default)(collection.memberships, "membership should be preloaded, did you forget withMembership scope?");
    const allMemberships = (0, _lodash.concat)(collection.memberships, collection.collectionGroupMemberships);
    return (0, _lodash.some)(allMemberships, m => ["read", "read_write", "maintainer"].includes(m.permission));
  }

  return true;
});
allow(_models.User, ["publish", "update"], _models.Collection, (user, collection) => {
  if (!collection || user.teamId !== collection.teamId) return false;

  if (collection.private) {
    (0, _invariant.default)(collection.memberships, "membership should be preloaded, did you forget withMembership scope?");
    const allMemberships = (0, _lodash.concat)(collection.memberships, collection.collectionGroupMemberships);
    return (0, _lodash.some)(allMemberships, m => ["read_write", "maintainer"].includes(m.permission));
  }

  return true;
});
allow(_models.User, "delete", _models.Collection, (user, collection) => {
  if (!collection || user.teamId !== collection.teamId) return false;

  if (collection.private) {
    (0, _invariant.default)(collection.memberships, "membership should be preloaded, did you forget withMembership scope?");
    const allMemberships = (0, _lodash.concat)(collection.memberships, collection.collectionGroupMemberships);
    return (0, _lodash.some)(allMemberships, m => ["read_write", "maintainer"].includes(m.permission));
  }

  if (user.isAdmin) return true;
  if (user.id === collection.creatorId) return true;
  throw new _errors.AdminRequiredError();
});