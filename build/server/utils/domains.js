"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCookieDomain = getCookieDomain;

var _domains = require("../../shared/utils/domains");

function getCookieDomain(domain) {
  return process.env.SUBDOMAINS_ENABLED === "true" ? (0, _domains.stripSubdomain)(domain) : domain;
}