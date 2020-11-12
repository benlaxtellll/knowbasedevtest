"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _models = require("../models");

class Revisions {
  async on(event) {
    switch (event.name) {
      case "documents.publish":
      case "documents.update.debounced":
        {
          const document = await _models.Document.findByPk(event.documentId);
          if (!document) return;
          const previous = await _models.Revision.findLatest(document.id); // we don't create revisions if identical to previous revision, this can
          // happen if a manual revision was created from another service or user.

          if (previous && document.text === previous.text && document.title === previous.title) {
            return;
          }

          await _models.Revision.createFromDocument(document);
          break;
        }

      default:
    }
  }

}

exports.default = Revisions;