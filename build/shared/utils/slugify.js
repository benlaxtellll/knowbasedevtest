"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = safeSlugify;

require("core-js/modules/es6.regexp.replace");

var _slugify = _interopRequireDefault(require("slugify"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Slugify, escape, and remove periods from headings so that they are
// compatible with url hashes AND dom selectors
function safeSlugify(text) {
  return "h-".concat(escape((0, _slugify.default)(text, {
    lower: true
  }).replace(".", "-")));
}