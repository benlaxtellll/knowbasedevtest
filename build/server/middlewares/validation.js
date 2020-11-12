"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validation;

var _validator = _interopRequireDefault(require("validator"));

var _color = require("../../shared/utils/color");

var _errors = require("../errors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validation() {
  return function validationMiddleware(ctx, next) {
    ctx.assertPresent = (value, message) => {
      if (value === undefined || value === null || value === "") {
        throw new _errors.ParamRequiredError(message);
      }
    };

    ctx.assertIn = (value, options, message) => {
      if (!options.includes(value)) {
        throw new _errors.ValidationError(message);
      }
    };

    ctx.assertNotEmpty = (value, message) => {
      if (value === "") {
        throw new _errors.ValidationError(message);
      }
    };

    ctx.assertEmail = (value = "", message) => {
      if (!_validator.default.isEmail(value)) {
        throw new _errors.ValidationError(message);
      }
    };

    ctx.assertUuid = (value = "", message) => {
      if (!_validator.default.isUUID(value)) {
        throw new _errors.ValidationError(message);
      }
    };

    ctx.assertPositiveInteger = (value, message) => {
      if (!_validator.default.isInt(value, {
        min: 0
      })) {
        throw new _errors.ValidationError(message);
      }
    };

    ctx.assertHexColor = (value, message) => {
      if (!(0, _color.validateColorHex)(value)) {
        throw new _errors.ValidationError(message);
      }
    };

    return next();
  };
}