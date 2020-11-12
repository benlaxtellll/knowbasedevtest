"use strict";

var _factories = require("../test/factories");

var _support = require("../test/support");

var _index = require("./index");

/* eslint-disable flowtype/require-valid-file-annotation */
beforeEach(() => (0, _support.flushdb)());
it("should serialize policy", async () => {
  const user = await (0, _factories.buildUser)();
  const response = (0, _index.serialize)(user, user);
  expect(response.update).toEqual(true);
  expect(response.delete).toEqual(true);
});