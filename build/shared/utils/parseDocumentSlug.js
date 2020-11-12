"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseDocumentSlug;

require("core-js/modules/es6.regexp.replace");

function parseDocumentSlug(url) {
  var parsed;

  if (url[0] === "/") {
    parsed = url;
  } else {
    try {
      parsed = new URL(url).pathname;
    } catch (err) {
      return;
    }
  }

  return parsed.replace(/^\/doc\//, "");
}