"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = present;

var _naturalSort = _interopRequireDefault(require("../../shared/utils/naturalSort"));

var _models = require("../models");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sortDocuments = documents => {
  const orderedDocs = (0, _naturalSort.default)(documents, "title");
  return orderedDocs.map(document => ({ ...document,
    children: sortDocuments(document.children)
  }));
};

function present(collection) {
  const data = {
    id: collection.id,
    url: collection.url,
    name: collection.name,
    description: collection.description,
    icon: collection.icon,
    color: collection.color || "#4E5C6E",
    private: collection.private,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    deletedAt: collection.deletedAt,
    documents: undefined
  }; // Force alphabetical sorting

  data.documents = sortDocuments(collection.documentStructure);
  return data;
}