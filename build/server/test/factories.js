"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildShare = buildShare;
exports.buildTeam = buildTeam;
exports.buildEvent = buildEvent;
exports.buildUser = buildUser;
exports.buildIntegration = buildIntegration;
exports.buildCollection = buildCollection;
exports.buildGroup = buildGroup;
exports.buildGroupUser = buildGroupUser;
exports.buildDocument = buildDocument;
exports.buildAttachment = buildAttachment;

var _uuid = _interopRequireDefault(require("uuid"));

var _models = require("../models");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let count = 0;

async function buildShare(overrides = {}) {
  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser({
      teamId: overrides.teamId
    });
    overrides.userId = user.id;
  }

  return _models.Share.create({
    published: true,
    ...overrides
  });
}

function buildTeam(overrides = {}) {
  count++;
  return _models.Team.create({
    name: `Team ${count}`,
    slackId: _uuid.default.v4(),
    ...overrides
  });
}

function buildEvent(overrides = {}) {
  return _models.Event.create({
    name: "documents.publish",
    ip: "127.0.0.1",
    ...overrides
  });
}

async function buildUser(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  return _models.User.create({
    email: `user${count}@example.com`,
    username: `user${count}`,
    name: `User ${count}`,
    service: "slack",
    serviceId: _uuid.default.v4(),
    createdAt: new Date("2018-01-01T00:00:00.000Z"),
    lastActiveAt: new Date("2018-01-01T00:00:00.000Z"),
    ...overrides
  });
}

async function buildIntegration(overrides = {}) {
  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  const user = await buildUser({
    teamId: overrides.teamId
  });
  const authentication = await _models.Authentication.create({
    service: "slack",
    userId: user.id,
    teamId: user.teamId,
    token: "fake-access-token",
    scopes: ["example", "scopes", "here"]
  });
  return _models.Integration.create({
    type: "post",
    service: "slack",
    settings: {
      serviceTeamId: "slack_team_id"
    },
    authenticationId: authentication.id,
    ...overrides
  });
}

async function buildCollection(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser({
      teamId: overrides.teamId
    });
    overrides.userId = user.id;
  }

  return _models.Collection.create({
    name: `Test Collection ${count}`,
    description: "Test collection description",
    creatorId: overrides.userId,
    ...overrides
  });
}

async function buildGroup(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser({
      teamId: overrides.teamId
    });
    overrides.userId = user.id;
  }

  return _models.Group.create({
    name: `Test Group ${count}`,
    createdById: overrides.userId,
    ...overrides
  });
}

async function buildGroupUser(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser({
      teamId: overrides.teamId
    });
    overrides.userId = user.id;
  }

  return _models.GroupUser.create({
    createdById: overrides.userId,
    ...overrides
  });
}

async function buildDocument(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser();
    overrides.userId = user.id;
  }

  if (!overrides.collectionId) {
    const collection = await buildCollection(overrides);
    overrides.collectionId = collection.id;
  }

  return _models.Document.create({
    title: `Document ${count}`,
    text: "This is the text in an example document",
    publishedAt: new Date(),
    lastModifiedById: overrides.userId,
    createdById: overrides.userId,
    ...overrides
  });
}

async function buildAttachment(overrides = {}) {
  count++;

  if (!overrides.teamId) {
    const team = await buildTeam();
    overrides.teamId = team.id;
  }

  if (!overrides.userId) {
    const user = await buildUser();
    overrides.userId = user.id;
  }

  if (!overrides.collectionId) {
    const collection = await buildCollection(overrides);
    overrides.collectionId = collection.id;
  }

  if (!overrides.documentId) {
    const document = await buildDocument(overrides);
    overrides.documentId = document.id;
  }

  return _models.Attachment.create({
    key: `uploads/key/to/file ${count}.png`,
    url: `https://redirect.url.com/uploads/key/to/file ${count}.png`,
    contentType: "image/png",
    size: 100,
    acl: "public-read",
    createdAt: new Date("2018-01-02T00:00:00.000Z"),
    updatedAt: new Date("2018-01-02T00:00:00.000Z"),
    ...overrides
  });
}