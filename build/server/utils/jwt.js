"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserForJWT = getUserForJWT;
exports.getUserForEmailSigninToken = getUserForEmailSigninToken;

var _sub_minutes = _interopRequireDefault(require("date-fns/sub_minutes"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _errors = require("../errors");

var _models = require("../models");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getJWTPayload(token) {
  let payload;

  try {
    payload = _jsonwebtoken.default.decode(token);
  } catch (err) {
    throw new _errors.AuthenticationError("Unable to decode JWT token");
  }

  if (!payload) {
    throw new _errors.AuthenticationError("Invalid token");
  }

  return payload;
}

async function getUserForJWT(token) {
  const payload = getJWTPayload(token);
  const user = await _models.User.findByPk(payload.id);

  try {
    _jsonwebtoken.default.verify(token, user.jwtSecret);
  } catch (err) {
    throw new _errors.AuthenticationError("Invalid token");
  }

  return user;
}

async function getUserForEmailSigninToken(token) {
  const payload = getJWTPayload(token); // check the token is within it's expiration time

  if (payload.createdAt) {
    if (new Date(payload.createdAt) < (0, _sub_minutes.default)(new Date(), 10)) {
      throw new _errors.AuthenticationError("Expired token");
    }
  }

  const user = await _models.User.findByPk(payload.id); // if user has signed in at all since the token was created then
  // it's no longer valid, they'll need a new one.

  if (user.lastSignedInAt > payload.createdAt) {
    throw new _errors.AuthenticationError("Token has already been used");
  }

  try {
    _jsonwebtoken.default.verify(token, user.jwtSecret);
  } catch (err) {
    throw new _errors.AuthenticationError("Invalid token");
  }

  return user;
}