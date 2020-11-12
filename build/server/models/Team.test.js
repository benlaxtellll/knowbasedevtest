"use strict";

var _factories = require("../test/factories");

var _support = require("../test/support");

/* eslint-disable flowtype/require-valid-file-annotation */
beforeEach(() => (0, _support.flushdb)());
it("should set subdomain if available", async () => {
  const team = await (0, _factories.buildTeam)();
  const subdomain = await team.provisionSubdomain("testy");
  expect(subdomain).toEqual("testy");
  expect(team.subdomain).toEqual("testy");
});
it("should set subdomain with append if unavailable", async () => {
  await (0, _factories.buildTeam)({
    subdomain: "myteam"
  });
  const team = await (0, _factories.buildTeam)();
  const subdomain = await team.provisionSubdomain("myteam");
  expect(subdomain).toEqual("myteam1");
  expect(team.subdomain).toEqual("myteam1");
});
it("should do nothing if subdomain already set", async () => {
  const team = await (0, _factories.buildTeam)({
    subdomain: "example"
  });
  const subdomain = await team.provisionSubdomain("myteam");
  expect(subdomain).toEqual("example");
  expect(team.subdomain).toEqual("example");
});