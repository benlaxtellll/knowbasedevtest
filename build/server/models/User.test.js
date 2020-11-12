"use strict";

var _factories = require("../test/factories");

var _support = require("../test/support");

/* eslint-disable flowtype/require-valid-file-annotation */
beforeEach(() => (0, _support.flushdb)());
it("should set JWT secret", async () => {
  const user = await (0, _factories.buildUser)();
  expect(user.getJwtToken()).toBeTruthy();
});