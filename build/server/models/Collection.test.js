"use strict";

var _uuid = _interopRequireDefault(require("uuid"));

var _models = require("../models");

var _factories = require("../test/factories");

var _support = require("../test/support");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable flowtype/require-valid-file-annotation */
beforeEach(() => (0, _support.flushdb)());
beforeEach(jest.resetAllMocks);
describe("#url", () => {
  test("should return correct url for the collection", () => {
    const collection = new _models.Collection({
      id: "1234"
    });
    expect(collection.url).toBe("/collections/1234");
  });
});
describe("#addDocumentToStructure", () => {
  test("should add as last element without index", async () => {
    const {
      collection
    } = await (0, _support.seed)();

    const id = _uuid.default.v4();

    const newDocument = new _models.Document({
      id,
      title: "New end node",
      parentDocumentId: null
    });
    await collection.addDocumentToStructure(newDocument);
    expect(collection.documentStructure.length).toBe(2);
    expect(collection.documentStructure[1].id).toBe(id);
  });
  test("should add with an index", async () => {
    const {
      collection
    } = await (0, _support.seed)();

    const id = _uuid.default.v4();

    const newDocument = new _models.Document({
      id,
      title: "New end node",
      parentDocumentId: null
    });
    await collection.addDocumentToStructure(newDocument, 1);
    expect(collection.documentStructure.length).toBe(2);
    expect(collection.documentStructure[1].id).toBe(id);
  });
  test("should add as a child if with parent", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();

    const id = _uuid.default.v4();

    const newDocument = new _models.Document({
      id,
      title: "New end node",
      parentDocumentId: document.id
    });
    await collection.addDocumentToStructure(newDocument, 1);
    expect(collection.documentStructure.length).toBe(1);
    expect(collection.documentStructure[0].id).toBe(document.id);
    expect(collection.documentStructure[0].children.length).toBe(1);
    expect(collection.documentStructure[0].children[0].id).toBe(id);
  });
  test("should add as a child if with parent with index", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();
    const newDocument = new _models.Document({
      id: _uuid.default.v4(),
      title: "node",
      parentDocumentId: document.id
    });

    const id = _uuid.default.v4();

    const secondDocument = new _models.Document({
      id,
      title: "New start node",
      parentDocumentId: document.id
    });
    await collection.addDocumentToStructure(newDocument);
    await collection.addDocumentToStructure(secondDocument, 0);
    expect(collection.documentStructure.length).toBe(1);
    expect(collection.documentStructure[0].id).toBe(document.id);
    expect(collection.documentStructure[0].children.length).toBe(2);
    expect(collection.documentStructure[0].children[0].id).toBe(id);
  });
  describe("options: documentJson", () => {
    test("should append supplied json over document's own", async () => {
      const {
        collection
      } = await (0, _support.seed)();

      const id = _uuid.default.v4();

      const newDocument = new _models.Document({
        id: _uuid.default.v4(),
        title: "New end node",
        parentDocumentId: null
      });
      await collection.addDocumentToStructure(newDocument, undefined, {
        documentJson: {
          children: [{
            id,
            title: "Totally fake",
            children: []
          }]
        }
      });
      expect(collection.documentStructure[1].children.length).toBe(1);
      expect(collection.documentStructure[1].children[0].id).toBe(id);
    });
  });
});
describe("#updateDocument", () => {
  test("should update root document's data", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();
    document.title = "Updated title";
    await document.save();
    await collection.updateDocument(document);
    expect(collection.documentStructure[0].title).toBe("Updated title");
  });
  test("should update child document's data", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();
    const newDocument = await _models.Document.create({
      parentDocumentId: document.id,
      collectionId: collection.id,
      teamId: collection.teamId,
      userId: collection.creatorId,
      lastModifiedById: collection.creatorId,
      createdById: collection.creatorId,
      title: "Child document",
      text: "content"
    });
    await collection.addDocumentToStructure(newDocument);
    newDocument.title = "Updated title";
    await newDocument.save();
    await collection.updateDocument(newDocument);
    const reloaded = await _models.Collection.findByPk(collection.id);
    expect(reloaded.documentStructure[0].children[0].title).toBe("Updated title");
  });
});
describe("#removeDocument", () => {
  test("should save if removing", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();
    jest.spyOn(collection, "save");
    await collection.deleteDocument(document);
    expect(collection.save).toBeCalled();
  });
  test("should remove documents from root", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)();
    await collection.deleteDocument(document);
    expect(collection.documentStructure.length).toBe(0); // Verify that the document was removed

    const collectionDocuments = await _models.Document.findAndCountAll({
      where: {
        collectionId: collection.id
      }
    });
    expect(collectionDocuments.count).toBe(0);
  });
  test("should remove a document with child documents", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)(); // Add a child for testing

    const newDocument = await _models.Document.create({
      parentDocumentId: document.id,
      collectionId: collection.id,
      teamId: collection.teamId,
      userId: collection.creatorId,
      lastModifiedById: collection.creatorId,
      createdById: collection.creatorId,
      title: "Child document",
      text: "content"
    });
    await collection.addDocumentToStructure(newDocument);
    expect(collection.documentStructure[0].children.length).toBe(1); // Remove the document

    await collection.deleteDocument(document);
    expect(collection.documentStructure.length).toBe(0);
    const collectionDocuments = await _models.Document.findAndCountAll({
      where: {
        collectionId: collection.id
      }
    });
    expect(collectionDocuments.count).toBe(0);
  });
  test("should remove a child document", async () => {
    const {
      collection,
      document
    } = await (0, _support.seed)(); // Add a child for testing

    const newDocument = await _models.Document.create({
      parentDocumentId: document.id,
      collectionId: collection.id,
      teamId: collection.teamId,
      userId: collection.creatorId,
      lastModifiedById: collection.creatorId,
      createdById: collection.creatorId,
      publishedAt: new Date(),
      title: "Child document",
      text: "content"
    });
    await collection.addDocumentToStructure(newDocument);
    expect(collection.documentStructure.length).toBe(1);
    expect(collection.documentStructure[0].children.length).toBe(1); // Remove the document

    await collection.deleteDocument(newDocument);
    const reloaded = await _models.Collection.findByPk(collection.id);
    expect(reloaded.documentStructure.length).toBe(1);
    expect(reloaded.documentStructure[0].children.length).toBe(0);
    const collectionDocuments = await _models.Document.findAndCountAll({
      where: {
        collectionId: collection.id
      }
    });
    expect(collectionDocuments.count).toBe(1);
  });
});
describe("#membershipUserIds", () => {
  test("should return collection and group memberships", async () => {
    const team = await (0, _factories.buildTeam)();
    const teamId = team.id; // Make 6 users

    const users = await Promise.all(Array(6).fill().map(() => {
      return (0, _factories.buildUser)({
        teamId
      });
    }));
    const collection = await (0, _factories.buildCollection)({
      userId: users[0].id,
      private: true,
      teamId
    });
    const group1 = await (0, _factories.buildGroup)({
      teamId
    });
    const group2 = await (0, _factories.buildGroup)({
      teamId
    });
    const createdById = users[0].id;
    await group1.addUser(users[0], {
      through: {
        createdById
      }
    });
    await group1.addUser(users[1], {
      through: {
        createdById
      }
    });
    await group2.addUser(users[2], {
      through: {
        createdById
      }
    });
    await group2.addUser(users[3], {
      through: {
        createdById
      }
    });
    await collection.addUser(users[4], {
      through: {
        createdById
      }
    });
    await collection.addUser(users[5], {
      through: {
        createdById
      }
    });
    await collection.addGroup(group1, {
      through: {
        createdById
      }
    });
    await collection.addGroup(group2, {
      through: {
        createdById
      }
    });
    const membershipUserIds = await _models.Collection.membershipUserIds(collection.id);
    expect(membershipUserIds.length).toBe(6);
  });
});