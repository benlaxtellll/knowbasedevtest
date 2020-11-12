"use strict";

var _sub_days = _interopRequireDefault(require("date-fns/sub_days"));

var _fetchTestServer = _interopRequireDefault(require("fetch-test-server"));

var _app = _interopRequireDefault(require("../app"));

var _models = require("../models");

var _sequelize = require("../sequelize");

var _factories = require("../test/factories");

var _support = require("../test/support");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable flowtype/require-valid-file-annotation */
const server = new _fetchTestServer.default(_app.default.callback());
beforeEach(() => (0, _support.flushdb)());
afterAll(() => server.close());
describe("#utils.gc", () => {
  it("should destroy documents deleted more than 30 days ago", async () => {
    const document = await (0, _factories.buildDocument)({
      publishedAt: new Date()
    });
    await _sequelize.sequelize.query(`UPDATE documents SET "deletedAt" = '${(0, _sub_days.default)(new Date(), 60).toISOString()}' WHERE id = '${document.id}'`);
    const res = await server.post("/api/utils.gc", {
      body: {
        token: process.env.UTILS_SECRET
      }
    });
    const reloaded = await _models.Document.scope().findOne({
      where: {
        id: document.id
      },
      paranoid: false
    });
    expect(res.status).toEqual(200);
    expect(reloaded).toBe(null);
  });
  it("should destroy draft documents deleted more than 30 days ago", async () => {
    const document = await (0, _factories.buildDocument)({
      publishedAt: undefined
    });
    await _sequelize.sequelize.query(`UPDATE documents SET "deletedAt" = '${(0, _sub_days.default)(new Date(), 60).toISOString()}' WHERE id = '${document.id}'`);
    const res = await server.post("/api/utils.gc", {
      body: {
        token: process.env.UTILS_SECRET
      }
    });
    const reloaded = await _models.Document.scope().findOne({
      where: {
        id: document.id
      },
      paranoid: false
    });
    expect(res.status).toEqual(200);
    expect(reloaded).toBe(null);
  });
  it("should require authentication", async () => {
    const res = await server.post("/api/utils.gc");
    expect(res.status).toEqual(401);
  });
});