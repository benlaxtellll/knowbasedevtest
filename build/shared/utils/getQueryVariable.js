"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getQueryVariable;

require("core-js/modules/es6.regexp.split");

require("core-js/modules/es6.regexp.search");

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");

    if (pair[0] === variable) {
      return pair[1];
    }
  }
}