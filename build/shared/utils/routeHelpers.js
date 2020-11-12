"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.slackAuth = slackAuth;
exports.githubUrl = githubUrl;
exports.githubIssuesUrl = githubIssuesUrl;
exports.twitterUrl = twitterUrl;
exports.mailToUrl = mailToUrl;
exports.developers = developers;
exports.changelog = changelog;
exports.signin = signin;
exports.settings = settings;
exports.groupSettings = groupSettings;

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.object.keys");

function slackAuth(state) {
  var scopes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ["identity.email", "identity.basic", "identity.avatar", "identity.team"];
  var clientId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : process.env.SLACK_KEY;
  var redirectUri = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "".concat(process.env.URL, "/auth/slack.callback");
  var baseUrl = "https://slack.com/oauth/authorize";
  var params = {
    client_id: clientId,
    scope: scopes ? scopes.join(" ") : "",
    redirect_uri: redirectUri,
    state: state
  };
  var urlParams = Object.keys(params).map(function (key) {
    return "".concat(key, "=").concat(encodeURIComponent(params[key]));
  }).join("&");
  return "".concat(baseUrl, "?").concat(urlParams);
}

function githubUrl() {
  return "https://www.github.com/outline";
}

function githubIssuesUrl() {
  return "https://www.github.com/outline/outline/issues";
}

function twitterUrl() {
  return "https://twitter.com/outlinewiki";
}

function mailToUrl() {
  return "mailto:hello@getoutline.com";
}

function developers() {
  return "https://www.getoutline.com/developers";
}

function changelog() {
  return "https://www.getoutline.com/changelog";
}

function signin() {
  var service = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "slack";
  return "".concat(process.env.URL, "/auth/").concat(service);
}

function settings() {
  return "/settings";
}

function groupSettings() {
  return "/settings/groups";
}