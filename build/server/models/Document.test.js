"use strict";

var _models = require("../models");

var _factories = require("../test/factories");

var _support = require("../test/support");

/* eslint-disable flowtype/require-valid-file-annotation */
beforeEach(() => (0, _support.flushdb)());
beforeEach(jest.resetAllMocks);
describe("#getSummary", () => {
  test("should strip markdown", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `*paragraph*

paragraph 2`
    });
    expect(document.getSummary()).toBe("paragraph");
  });
  test("should strip title when no version", async () => {
    const document = await (0, _factories.buildDocument)({
      version: null,
      text: `# Heading
      
*paragraph*`
    });
    expect(document.getSummary()).toBe("paragraph");
  });
});
describe("#migrateVersion", () => {
  test("should maintain empty paragraph under headings", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `# Heading

paragraph`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`# Heading

paragraph`);
  });
  test("should add breaks under headings with extra paragraphs", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `# Heading


paragraph`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`# Heading


\\
paragraph`);
  });
  test("should add breaks between paragraphs", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `paragraph

paragraph`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`paragraph

\\
paragraph`);
  });
  test("should add breaks for multiple empty paragraphs", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `paragraph


paragraph`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`paragraph

\\
\\
paragraph`);
  });
  test("should add breaks with non-latin characters", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `除。

通`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`除。

\\
通`);
  });
  test("should update task list formatting", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `[ ] list item
`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`- [ ] list item
`);
  });
  test("should update task list with multiple items", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `[ ] list item
[ ] list item 2
`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`- [ ] list item
- [ ] list item 2
`);
  });
  test("should update checked task list formatting", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `[x] list item
`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`- [x] list item
`);
  });
  test("should update nested task list formatting", async () => {
    const document = await (0, _factories.buildDocument)({
      version: 1,
      text: `[x] list item
  [ ] list item
  [x] list item
`
    });
    await document.migrateVersion();
    expect(document.text).toBe(`- [x] list item
   - [ ] list item
   - [x] list item
`);
  });
});
describe("#searchForTeam", () => {
  test("should return search results from public collections", async () => {
    const team = await (0, _factories.buildTeam)();
    const collection = await (0, _factories.buildCollection)({
      teamId: team.id
    });
    const document = await (0, _factories.buildDocument)({
      teamId: team.id,
      collectionId: collection.id,
      title: "test"
    });
    const {
      results
    } = await _models.Document.searchForTeam(team, "test");
    expect(results.length).toBe(1);
    expect(results[0].document.id).toBe(document.id);
  });
  test("should not return search results from private collections", async () => {
    const team = await (0, _factories.buildTeam)();
    const collection = await (0, _factories.buildCollection)({
      private: true,
      teamId: team.id
    });
    await (0, _factories.buildDocument)({
      teamId: team.id,
      collectionId: collection.id,
      title: "test"
    });
    const {
      results
    } = await _models.Document.searchForTeam(team, "test");
    expect(results.length).toBe(0);
  });
  test("should handle no collections", async () => {
    const team = await (0, _factories.buildTeam)();
    const {
      results
    } = await _models.Document.searchForTeam(team, "test");
    expect(results.length).toBe(0);
  });
  test("should return the total count of search results", async () => {
    const team = await (0, _factories.buildTeam)();
    const collection = await (0, _factories.buildCollection)({
      teamId: team.id
    });
    await (0, _factories.buildDocument)({
      teamId: team.id,
      collectionId: collection.id,
      title: "test number 1"
    });
    await (0, _factories.buildDocument)({
      teamId: team.id,
      collectionId: collection.id,
      title: "test number 2"
    });
    const {
      totalCount
    } = await _models.Document.searchForTeam(team, "test");
    expect(totalCount).toBe("2");
  });
});
describe("#searchForUser", () => {
  test("should return search results from collections", async () => {
    const team = await (0, _factories.buildTeam)();
    const user = await (0, _factories.buildUser)({
      teamId: team.id
    });
    const collection = await (0, _factories.buildCollection)({
      userId: user.id,
      teamId: team.id
    });
    const document = await (0, _factories.buildDocument)({
      userId: user.id,
      teamId: team.id,
      collectionId: collection.id,
      title: "test"
    });
    const {
      results
    } = await _models.Document.searchForUser(user, "test");
    expect(results.length).toBe(1);
    expect(results[0].document.id).toBe(document.id);
  });
  test("should handle no collections", async () => {
    const team = await (0, _factories.buildTeam)();
    const user = await (0, _factories.buildUser)({
      teamId: team.id
    });
    const {
      results
    } = await _models.Document.searchForUser(user, "test");
    expect(results.length).toBe(0);
  });
  test("should return the total count of search results", async () => {
    const team = await (0, _factories.buildTeam)();
    const user = await (0, _factories.buildUser)({
      teamId: team.id
    });
    const collection = await (0, _factories.buildCollection)({
      userId: user.id,
      teamId: team.id
    });
    await (0, _factories.buildDocument)({
      userId: user.id,
      teamId: team.id,
      collectionId: collection.id,
      title: "test number 1"
    });
    await (0, _factories.buildDocument)({
      userId: user.id,
      teamId: team.id,
      collectionId: collection.id,
      title: "test number 2"
    });
    const {
      totalCount
    } = await _models.Document.searchForUser(user, "test");
    expect(totalCount).toBe("2");
  });
});
describe("#delete", () => {
  test("should soft delete and set last modified", async () => {
    let document = await (0, _factories.buildDocument)();
    let user = await (0, _factories.buildUser)();
    await document.delete(user.id);
    document = await _models.Document.findByPk(document.id, {
      paranoid: false
    });
    expect(document.lastModifiedById).toBe(user.id);
    expect(document.deletedAt).toBeTruthy();
  });
});