"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = require("lodash");

var _randomstring = _interopRequireDefault(require("randomstring"));

var _slug = _interopRequireDefault(require("slug"));

var _sequelize = require("../sequelize");

var _CollectionUser = _interopRequireDefault(require("./CollectionUser"));

var _Document = _interopRequireDefault(require("./Document"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_slug.default.defaults.mode = "rfc3986";

const Collection = _sequelize.sequelize.define("collection", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  urlId: {
    type: _sequelize.DataTypes.STRING,
    unique: true
  },
  name: _sequelize.DataTypes.STRING,
  description: _sequelize.DataTypes.STRING,
  icon: _sequelize.DataTypes.STRING,
  color: _sequelize.DataTypes.STRING,
  private: _sequelize.DataTypes.BOOLEAN,
  maintainerApprovalRequired: _sequelize.DataTypes.BOOLEAN,
  documentStructure: _sequelize.DataTypes.JSONB
}, {
  tableName: "collections",
  paranoid: true,
  hooks: {
    beforeValidate: collection => {
      collection.urlId = collection.urlId || _randomstring.default.generate(10);
    }
  },
  getterMethods: {
    url() {
      return `/collections/${this.id}`;
    }

  }
});

Collection.addHook("beforeSave", async model => {
  if (model.icon === "collection") {
    model.icon = null;
  }
}); // Class methods

Collection.associate = models => {
  Collection.hasMany(models.Document, {
    as: "documents",
    foreignKey: "collectionId",
    onDelete: "cascade"
  });
  Collection.hasMany(models.CollectionUser, {
    as: "memberships",
    foreignKey: "collectionId",
    onDelete: "cascade"
  });
  Collection.hasMany(models.CollectionGroup, {
    as: "collectionGroupMemberships",
    foreignKey: "collectionId",
    onDelete: "cascade"
  });
  Collection.belongsToMany(models.User, {
    as: "users",
    through: models.CollectionUser,
    foreignKey: "collectionId"
  });
  Collection.belongsToMany(models.Group, {
    as: "groups",
    through: models.CollectionGroup,
    foreignKey: "collectionId"
  });
  Collection.belongsTo(models.User, {
    as: "user",
    foreignKey: "creatorId"
  });
  Collection.belongsTo(models.Team, {
    as: "team"
  });
  Collection.addScope("withMembership", userId => ({
    include: [{
      model: models.CollectionUser,
      as: "memberships",
      where: {
        userId
      },
      required: false
    }, {
      model: models.CollectionGroup,
      as: "collectionGroupMemberships",
      required: false,
      // use of "separate" property: sequelize breaks when there are
      // nested "includes" with alternating values for "required"
      // see https://github.com/sequelize/sequelize/issues/9869
      separate: true,
      // include for groups that are members of this collection,
      // of which userId is a member of, resulting in:
      // CollectionGroup [inner join] Group [inner join] GroupUser [where] userId
      include: {
        model: models.Group,
        as: "group",
        required: true,
        include: {
          model: models.GroupUser,
          as: "groupMemberships",
          required: true,
          where: {
            userId
          }
        }
      }
    }]
  }));
  Collection.addScope("withAllMemberships", {
    include: [{
      model: models.CollectionUser,
      as: "memberships",
      required: false
    }, {
      model: models.CollectionGroup,
      as: "collectionGroupMemberships",
      required: false,
      // use of "separate" property: sequelize breaks when there are
      // nested "includes" with alternating values for "required"
      // see https://github.com/sequelize/sequelize/issues/9869
      separate: true,
      // include for groups that are members of this collection,
      // of which userId is a member of, resulting in:
      // CollectionGroup [inner join] Group [inner join] GroupUser [where] userId
      include: {
        model: models.Group,
        as: "group",
        required: true,
        include: {
          model: models.GroupUser,
          as: "groupMemberships",
          required: true
        }
      }
    }]
  });
};

Collection.addHook("afterDestroy", async model => {
  await _Document.default.destroy({
    where: {
      collectionId: model.id
    }
  });
});
Collection.addHook("afterCreate", (model, options) => {
  if (model.private) {
    return _CollectionUser.default.findOrCreate({
      where: {
        collectionId: model.id,
        userId: model.creatorId
      },
      defaults: {
        permission: "read_write",
        createdById: model.creatorId
      },
      transaction: options.transaction
    });
  }
}); // Class methods
// get all the membership relationshps a user could have with the collection

Collection.membershipUserIds = async collectionId => {
  const collection = await Collection.scope("withAllMemberships").findByPk(collectionId);
  const groupMemberships = collection.collectionGroupMemberships.map(cgm => cgm.group.groupMemberships).flat();
  const membershipUserIds = (0, _lodash.concat)(groupMemberships, collection.memberships).map(membership => membership.userId);
  return (0, _lodash.uniq)(membershipUserIds);
}; // Instance methods


Collection.prototype.addDocumentToStructure = async function (document, index, options = {}) {
  if (!this.documentStructure) {
    this.documentStructure = [];
  }

  let transaction;

  try {
    // documentStructure can only be updated by one request at a time
    if (options.save !== false) {
      transaction = await _sequelize.sequelize.transaction();
    } // If moving existing document with children, use existing structure


    const documentJson = { ...document.toJSON(),
      ...options.documentJson
    };

    if (!document.parentDocumentId) {
      // Note: Index is supported on DB level but it's being ignored
      // by the API presentation until we build product support for it.
      this.documentStructure.splice(index !== undefined ? index : this.documentStructure.length, 0, documentJson);
    } else {
      // Recursively place document
      const placeDocument = documentList => {
        return documentList.map(childDocument => {
          if (document.parentDocumentId === childDocument.id) {
            childDocument.children.splice(index !== undefined ? index : childDocument.children.length, 0, documentJson);
          } else {
            childDocument.children = placeDocument(childDocument.children);
          }

          return childDocument;
        });
      };

      this.documentStructure = placeDocument(this.documentStructure);
    } // Sequelize doesn't seem to set the value with splice on JSONB field
    // https://github.com/sequelize/sequelize/blob/e1446837196c07b8ff0c23359b958d68af40fd6d/src/model.js#L3937


    this.changed("documentStructure", true);

    if (options.save !== false) {
      await this.save({ ...options,
        fields: ["documentStructure"],
        transaction
      });

      if (transaction) {
        await transaction.commit();
      }
    }
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    throw err;
  }

  return this;
};
/**
 * Update document's title and url in the documentStructure
 */


Collection.prototype.updateDocument = async function (updatedDocument) {
  if (!this.documentStructure) return;
  let transaction;

  try {
    // documentStructure can only be updated by one request at the time
    transaction = await _sequelize.sequelize.transaction();
    const {
      id
    } = updatedDocument;

    const updateChildren = documents => {
      return documents.map(document => {
        if (document.id === id) {
          document = { ...updatedDocument.toJSON(),
            children: document.children
          };
        } else {
          document.children = updateChildren(document.children);
        }

        return document;
      });
    };

    this.documentStructure = updateChildren(this.documentStructure); // Sequelize doesn't seem to set the value with splice on JSONB field
    // https://github.com/sequelize/sequelize/blob/e1446837196c07b8ff0c23359b958d68af40fd6d/src/model.js#L3937

    this.changed("documentStructure", true);
    await this.save({
      fields: ["documentStructure"],
      transaction
    });
    await transaction.commit();
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    throw err;
  }

  return this;
};

Collection.prototype.deleteDocument = async function (document) {
  await this.removeDocumentInStructure(document);
  await document.deleteWithChildren();
};

Collection.prototype.removeDocumentInStructure = async function (document, options) {
  if (!this.documentStructure) return;
  let returnValue;
  let transaction;

  try {
    // documentStructure can only be updated by one request at the time
    transaction = await _sequelize.sequelize.transaction();

    const removeFromChildren = async (children, id) => {
      children = await Promise.all(children.map(async childDocument => {
        return { ...childDocument,
          children: await removeFromChildren(childDocument.children, id)
        };
      }));
      const match = (0, _lodash.find)(children, {
        id
      });

      if (match) {
        if (!returnValue) returnValue = match;
        (0, _lodash.remove)(children, {
          id
        });
      }

      return children;
    };

    this.documentStructure = await removeFromChildren(this.documentStructure, document.id); // Sequelize doesn't seem to set the value with splice on JSONB field
    // https://github.com/sequelize/sequelize/blob/e1446837196c07b8ff0c23359b958d68af40fd6d/src/model.js#L3937

    this.changed("documentStructure", true);
    await this.save({ ...options,
      fields: ["documentStructure"],
      transaction
    });
    await transaction.commit();
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    throw err;
  }

  return returnValue;
};

var _default = Collection;
exports.default = _default;