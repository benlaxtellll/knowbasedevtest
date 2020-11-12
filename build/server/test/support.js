"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flushdb = flushdb;
Object.defineProperty(exports, "sequelize", {
  enumerable: true,
  get: function () {
    return _sequelize.sequelize;
  }
});
exports.seed = void 0;

var _models = require("../models");

var _sequelize = require("../sequelize");

function flushdb() {
  const sql = _sequelize.sequelize.getQueryInterface();

  const tables = Object.keys(_sequelize.sequelize.models).map(model => {
    const n = _sequelize.sequelize.models[model].getTableName();

    return sql.queryGenerator.quoteTable(typeof n === "string" ? n : n.tableName);
  });
  const query = `TRUNCATE ${tables.join(", ")} CASCADE`;
  return _sequelize.sequelize.query(query);
}

const seed = async () => {
  const team = await _models.Team.create({
    id: "86fde1d4-0050-428f-9f0b-0bf77f8bdf61",
    name: "Team",
    slackId: "T2399UF2P",
    slackData: {
      id: "T2399UF2P"
    }
  });
  const admin = await _models.User.create({
    id: "fa952cff-fa64-4d42-a6ea-6955c9689046",
    email: "admin@example.com",
    username: "admin",
    name: "Admin User",
    teamId: team.id,
    isAdmin: true,
    service: "slack",
    serviceId: "U2399UF1P",
    slackData: {
      id: "U2399UF1P",
      image_192: "http://example.com/avatar.png"
    },
    createdAt: new Date("2018-01-01T00:00:00.000Z")
  });
  const user = await _models.User.create({
    id: "46fde1d4-0050-428f-9f0b-0bf77f4bdf61",
    email: "user1@example.com",
    username: "user1",
    name: "User 1",
    teamId: team.id,
    service: "slack",
    serviceId: "U2399UF2P",
    slackData: {
      id: "U2399UF2P",
      image_192: "http://example.com/avatar.png"
    },
    createdAt: new Date("2018-01-02T00:00:00.000Z")
  });
  const collection = await _models.Collection.create({
    id: "26fde1d4-0050-428f-9f0b-0bf77f8bdf62",
    name: "Collection",
    urlId: "collection",
    teamId: team.id,
    creatorId: user.id
  });
  const document = await _models.Document.create({
    parentDocumentId: null,
    collectionId: collection.id,
    teamId: team.id,
    userId: collection.creatorId,
    lastModifiedById: collection.creatorId,
    createdById: collection.creatorId,
    title: "First ever document",
    text: "# Much test support"
  });
  await document.publish();
  await collection.reload();
  return {
    user,
    admin,
    collection,
    document,
    team
  };
};

exports.seed = seed;