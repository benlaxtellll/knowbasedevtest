"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = present;

var _models = require("../models");

var _ = require(".");

function present(share) {
  return {
    id: share.id,
    documentId: share.documentId,
    documentTitle: share.document.title,
    documentUrl: share.document.url,
    published: share.published,
    url: `${share.team.url}/share/${share.id}`,
    createdBy: (0, _.presentUser)(share.user),
    createdAt: share.createdAt,
    updatedAt: share.updatedAt
  };
}