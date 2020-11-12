"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = present;

var _lodash = require("lodash");

var _models = require("../models");

var _s = require("../utils/s3");

var _user = _interopRequireDefault(require("./user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const attachmentRegex = /!\[.*?\]\(\/api\/attachments\.redirect\?id=(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi; // replaces attachments.redirect urls with signed/authenticated url equivalents

async function replaceImageAttachments(text) {
  const attachmentIds = [...text.matchAll(attachmentRegex)].map(match => match.groups && match.groups.id);

  for (const id of attachmentIds) {
    const attachment = await _models.Attachment.findByPk(id);

    if (attachment) {
      const accessUrl = await (0, _s.getSignedImageUrl)(attachment.key);
      text = text.replace(attachment.redirectUrl, accessUrl);
    }
  }

  return text;
}

async function present(document, options) {
  options = {
    isPublic: false,
    ...options
  };
  await document.migrateVersion();
  let text = options.isPublic ? await replaceImageAttachments(document.text) : document.text;
  const data = {
    id: document.id,
    url: document.url,
    urlId: document.urlId,
    title: document.title,
    text,
    emoji: document.emoji,
    createdAt: document.createdAt,
    createdBy: undefined,
    updatedAt: document.updatedAt,
    updatedBy: undefined,
    publishedAt: document.publishedAt,
    archivedAt: document.archivedAt,
    deletedAt: document.deletedAt,
    teamId: document.teamId,
    template: document.template,
    templateId: document.templateId,
    collaborators: [],
    starred: document.starred ? !!document.starred.length : undefined,
    revision: document.revisionCount,
    pinned: undefined,
    collectionId: undefined,
    parentDocumentId: undefined,
    lastViewedAt: undefined
  };

  if (!!document.views && document.views.length > 0) {
    data.lastViewedAt = document.views[0].updatedAt;
  }

  if (!options.isPublic) {
    data.pinned = !!document.pinnedById;
    data.collectionId = document.collectionId;
    data.parentDocumentId = document.parentDocumentId;
    data.createdBy = (0, _user.default)(document.createdBy);
    data.updatedBy = (0, _user.default)(document.updatedBy); // TODO: This could be further optimized

    data.collaborators = (await _models.User.findAll({
      where: {
        id: (0, _lodash.takeRight)(document.collaboratorIds, 10) || []
      }
    })).map(_user.default);
  }

  return data;
}