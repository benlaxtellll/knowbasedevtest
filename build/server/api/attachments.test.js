"use strict";

var _fetchTestServer = _interopRequireDefault(require("fetch-test-server"));

var _app = _interopRequireDefault(require("../app"));

var _factories = require("../test/factories");

var _support = require("../test/support");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable flowtype/require-valid-file-annotation */
const server = new _fetchTestServer.default(_app.default.callback());
beforeEach(() => (0, _support.flushdb)());
afterAll(() => server.close());
describe("#attachments.redirect", () => {
  it("should require authentication", async () => {
    const res = await server.post("/api/attachments.redirect");
    expect(res.status).toEqual(401);
  });
  it("should return a redirect for an attachment belonging to a document user has access to", async () => {
    const user = await (0, _factories.buildUser)();
    const attachment = await (0, _factories.buildAttachment)({
      teamId: user.teamId,
      userId: user.id
    });
    const res = await server.post("/api/attachments.redirect", {
      body: {
        token: user.getJwtToken(),
        id: attachment.id
      },
      redirect: "manual"
    });
    expect(res.status).toEqual(302);
  });
  it("should always return a redirect for a public attachment", async () => {
    const user = await (0, _factories.buildUser)();
    const collection = await (0, _factories.buildCollection)({
      teamId: user.teamId,
      userId: user.id,
      private: true
    });
    const document = await (0, _factories.buildDocument)({
      teamId: user.teamId,
      userId: user.id,
      collectionId: collection.id
    });
    const attachment = await (0, _factories.buildAttachment)({
      teamId: user.teamId,
      userId: user.id,
      documentId: document.id
    });
    const res = await server.post("/api/attachments.redirect", {
      body: {
        token: user.getJwtToken(),
        id: attachment.id
      },
      redirect: "manual"
    });
    expect(res.status).toEqual(302);
  });
  it("should not return a redirect for a private attachment belonging to a document user does not have access to", async () => {
    const user = await (0, _factories.buildUser)();
    const collection = await (0, _factories.buildCollection)({
      private: true
    });
    const document = await (0, _factories.buildDocument)({
      teamId: collection.teamId,
      userId: collection.userId,
      collectionId: collection.id
    });
    const attachment = await (0, _factories.buildAttachment)({
      teamId: document.teamId,
      userId: document.userId,
      documentId: document.id,
      acl: "private"
    });
    const res = await server.post("/api/attachments.redirect", {
      body: {
        token: user.getJwtToken(),
        id: attachment.id
      }
    });
    expect(res.status).toEqual(403);
  });
});