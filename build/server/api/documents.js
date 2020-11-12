"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDocumentFromContext = createDocumentFromContext;
exports.default = void 0;

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _documentImporter = _interopRequireDefault(require("../commands/documentImporter"));

var _documentMover = _interopRequireDefault(require("../commands/documentMover"));

var _errors = require("../errors");

var _authentication = _interopRequireDefault(require("../middlewares/authentication"));

var _models = require("../models");

var _policies = _interopRequireDefault(require("../policies"));

var _presenters = require("../presenters");

var _sequelize2 = require("../sequelize");

var _pagination = _interopRequireDefault(require("./middlewares/pagination"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Op = _sequelize.default.Op;
const {
  authorize,
  cannot
} = _policies.default;
const router = new _koaRouter.default();
router.post("documents.list", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    sort = "updatedAt",
    template,
    backlinkDocumentId,
    parentDocumentId
  } = ctx.body; // collection and user are here for backwards compatibility

  const collectionId = ctx.body.collectionId || ctx.body.collection;
  const createdById = ctx.body.userId || ctx.body.user;
  let direction = ctx.body.direction;
  if (direction !== "ASC") direction = "DESC"; // always filter by the current team

  const user = ctx.state.user;
  let where = {
    teamId: user.teamId,
    archivedAt: {
      [Op.eq]: null
    }
  };

  if (template) {
    where = { ...where,
      template: true
    };
  } // if a specific user is passed then add to filters. If the user doesn't
  // exist in the team then nothing will be returned, so no need to check auth


  if (createdById) {
    ctx.assertUuid(createdById, "user must be a UUID");
    where = { ...where,
      createdById
    };
  } // if a specific collection is passed then we need to check auth to view it


  if (collectionId) {
    ctx.assertUuid(collectionId, "collection must be a UUID");
    where = { ...where,
      collectionId
    };
    const collection = await _models.Collection.scope({
      method: ["withMembership", user.id]
    }).findByPk(collectionId);
    authorize(user, "read", collection); // otherwise, filter by all collections the user has access to
  } else {
    const collectionIds = await user.collectionIds();
    where = { ...where,
      collectionId: collectionIds
    };
  }

  if (parentDocumentId) {
    ctx.assertUuid(parentDocumentId, "parentDocumentId must be a UUID");
    where = { ...where,
      parentDocumentId
    };
  }

  if (backlinkDocumentId) {
    ctx.assertUuid(backlinkDocumentId, "backlinkDocumentId must be a UUID");
    const backlinks = await _models.Backlink.findAll({
      attributes: ["reverseDocumentId"],
      where: {
        documentId: backlinkDocumentId
      }
    });
    where = { ...where,
      id: backlinks.map(backlink => backlink.reverseDocumentId)
    };
  } // add the users starred state to the response by default


  const starredScope = {
    method: ["withStarred", user.id]
  };
  const collectionScope = {
    method: ["withCollection", user.id]
  };
  const viewScope = {
    method: ["withViews", user.id]
  };
  const documents = await _models.Document.scope("defaultScope", starredScope, collectionScope, viewScope).findAll({
    where,
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.pinned", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    collectionId,
    sort = "updatedAt"
  } = ctx.body;
  let direction = ctx.body.direction;
  if (direction !== "ASC") direction = "DESC";
  ctx.assertUuid(collectionId, "collectionId is required");
  const user = ctx.state.user;
  const collection = await _models.Collection.scope({
    method: ["withMembership", user.id]
  }).findByPk(collectionId);
  authorize(user, "read", collection);
  const starredScope = {
    method: ["withStarred", user.id]
  };
  const collectionScope = {
    method: ["withCollection", user.id]
  };
  const viewScope = {
    method: ["withViews", user.id]
  };
  const documents = await _models.Document.scope("defaultScope", starredScope, collectionScope, viewScope).findAll({
    where: {
      teamId: user.teamId,
      collectionId,
      pinnedById: {
        [Op.ne]: null
      }
    },
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.archived", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    sort = "updatedAt"
  } = ctx.body;
  let direction = ctx.body.direction;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const collectionIds = await user.collectionIds();
  const collectionScope = {
    method: ["withCollection", user.id]
  };
  const viewScope = {
    method: ["withViews", user.id]
  };
  const documents = await _models.Document.scope("defaultScope", collectionScope, viewScope).findAll({
    where: {
      teamId: user.teamId,
      collectionId: collectionIds,
      archivedAt: {
        [Op.ne]: null
      }
    },
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.deleted", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    sort = "deletedAt"
  } = ctx.body;
  let direction = ctx.body.direction;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const collectionIds = await user.collectionIds({
    paranoid: false
  });
  const collectionScope = {
    method: ["withCollection", user.id]
  };
  const viewScope = {
    method: ["withViews", user.id]
  };
  const documents = await _models.Document.scope(collectionScope, viewScope).findAll({
    where: {
      teamId: user.teamId,
      collectionId: collectionIds,
      deletedAt: {
        [Op.ne]: null
      }
    },
    include: [{
      model: _models.User,
      as: "createdBy",
      paranoid: false
    }, {
      model: _models.User,
      as: "updatedBy",
      paranoid: false
    }],
    paranoid: false,
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.viewed", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  let {
    sort = "updatedAt",
    direction
  } = ctx.body;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const collectionIds = await user.collectionIds();
  const views = await _models.View.findAll({
    where: {
      userId: user.id
    },
    order: [[sort, direction]],
    include: [{
      model: _models.Document,
      required: true,
      where: {
        collectionId: collectionIds
      },
      include: [{
        model: _models.Star,
        as: "starred",
        where: {
          userId: user.id
        },
        required: false
      }]
    }],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const documents = views.map(view => {
    const document = view.document;
    document.views = [view];
    return document;
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.starred", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  let {
    sort = "updatedAt",
    direction
  } = ctx.body;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const collectionIds = await user.collectionIds();
  const stars = await _models.Star.findAll({
    where: {
      userId: user.id
    },
    order: [[sort, direction]],
    include: [{
      model: _models.Document,
      where: {
        collectionId: collectionIds
      },
      include: [{
        model: _models.Collection,
        as: "collection"
      }, {
        model: _models.Star,
        as: "starred",
        where: {
          userId: user.id
        }
      }]
    }],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const documents = stars.map(star => star.document);
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.drafts", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  let {
    sort = "updatedAt",
    direction
  } = ctx.body;
  if (direction !== "ASC") direction = "DESC";
  const user = ctx.state.user;
  const collectionIds = await user.collectionIds();
  const collectionScope = {
    method: ["withCollection", user.id]
  };
  const viewScope = {
    method: ["withViews", user.id]
  };
  const documents = await _models.Document.scope("defaultScope", collectionScope, viewScope).findAll({
    where: {
      userId: user.id,
      collectionId: collectionIds,
      publishedAt: {
        [Op.eq]: null
      }
    },
    order: [[sort, direction]],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit
  });
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});

async function loadDocument({
  id,
  shareId,
  user
}) {
  let document;

  if (shareId) {
    const share = await _models.Share.findOne({
      where: {
        revokedAt: {
          [Op.eq]: null
        },
        id: shareId
      },
      include: [{
        // unscoping here allows us to return unpublished documents
        model: _models.Document.unscoped(),
        include: [{
          model: _models.User,
          as: "createdBy",
          paranoid: false
        }, {
          model: _models.User,
          as: "updatedBy",
          paranoid: false
        }],
        required: true,
        as: "document"
      }]
    });

    if (!share || share.document.archivedAt) {
      throw new _errors.InvalidRequestError("Document could not be found for shareId");
    }

    document = share.document;

    if (!share.published) {
      authorize(user, "read", document);
    }
  } else {
    document = await _models.Document.findByPk(id, {
      userId: user ? user.id : undefined,
      paranoid: false
    });

    if (!document) {
      throw new _errors.NotFoundError();
    }

    if (document.deletedAt) {
      authorize(user, "restore", document);
    } else {
      authorize(user, "read", document);
    }
  }

  return document;
}

router.post("documents.info", (0, _authentication.default)({
  required: false
}), async ctx => {
  const {
    id,
    shareId
  } = ctx.body;
  ctx.assertPresent(id || shareId, "id or shareId is required");
  const user = ctx.state.user;
  const document = await loadDocument({
    id,
    shareId,
    user
  });
  const isPublic = cannot(user, "read", document);
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document, {
      isPublic
    }),
    policies: isPublic ? undefined : (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.export", (0, _authentication.default)({
  required: false
}), async ctx => {
  const {
    id,
    shareId
  } = ctx.body;
  ctx.assertPresent(id || shareId, "id or shareId is required");
  const user = ctx.state.user;
  const document = await loadDocument({
    id,
    shareId,
    user
  });
  ctx.body = {
    data: document.toMarkdown()
  };
});
router.post("documents.restore", (0, _authentication.default)(), async ctx => {
  const {
    id,
    collectionId,
    revisionId
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id,
    paranoid: false
  });

  if (!document) {
    throw new _errors.NotFoundError();
  }

  if (collectionId) {
    ctx.assertUuid(collectionId, "collectionId must be a uuid");
    authorize(user, "restore", document);
    const collection = await _models.Collection.scope({
      method: ["withMembership", user.id]
    }).findByPk(collectionId);
    authorize(user, "update", collection);
    document.collectionId = collectionId;
  }

  if (document.deletedAt) {
    authorize(user, "restore", document); // restore a previously deleted document

    await document.unarchive(user.id);
    await _models.Event.create({
      name: "documents.restore",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        title: document.title
      },
      ip: ctx.request.ip
    });
  } else if (document.archivedAt) {
    authorize(user, "unarchive", document); // restore a previously archived document

    await document.unarchive(user.id);
    await _models.Event.create({
      name: "documents.unarchive",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        title: document.title
      },
      ip: ctx.request.ip
    });
  } else if (revisionId) {
    // restore a document to a specific revision
    authorize(user, "update", document);
    const revision = await _models.Revision.findByPk(revisionId);
    authorize(document, "restore", revision);
    document.text = revision.text;
    document.title = revision.title;
    await document.save();
    await _models.Event.create({
      name: "documents.restore",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        title: document.title
      },
      ip: ctx.request.ip
    });
  } else {
    ctx.assertPresent(revisionId, "revisionId is required");
  }

  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.search_titles", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    query
  } = ctx.body;
  const {
    offset,
    limit
  } = ctx.state.pagination;
  const user = ctx.state.user;
  ctx.assertPresent(query, "query is required");
  const collectionIds = await user.collectionIds();
  const documents = await _models.Document.scope({
    method: ["withViews", user.id]
  }, {
    method: ["withCollection", user.id]
  }).findAll({
    where: {
      title: {
        [Op.iLike]: `%${query}%`
      },
      collectionId: collectionIds,
      archivedAt: {
        [Op.eq]: null
      }
    },
    order: [["updatedAt", "DESC"]],
    include: [{
      model: _models.User,
      as: "createdBy",
      paranoid: false
    }, {
      model: _models.User,
      as: "updatedBy",
      paranoid: false
    }],
    offset,
    limit
  });
  const policies = (0, _presenters.presentPolicies)(user, documents);
  const data = await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document)));
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.search", (0, _authentication.default)(), (0, _pagination.default)(), async ctx => {
  const {
    query,
    includeArchived,
    includeDrafts,
    collectionId,
    userId,
    dateFilter
  } = ctx.body;
  const {
    offset,
    limit
  } = ctx.state.pagination;
  const user = ctx.state.user;
  ctx.assertPresent(query, "query is required");

  if (collectionId) {
    ctx.assertUuid(collectionId, "collectionId must be a UUID");
    const collection = await _models.Collection.scope({
      method: ["withMembership", user.id]
    }).findByPk(collectionId);
    authorize(user, "read", collection);
  }

  let collaboratorIds = undefined;

  if (userId) {
    ctx.assertUuid(userId, "userId must be a UUID");
    collaboratorIds = [userId];
  }

  if (dateFilter) {
    ctx.assertIn(dateFilter, ["day", "week", "month", "year"], "dateFilter must be one of day,week,month,year");
  }

  const {
    results,
    totalCount
  } = await _models.Document.searchForUser(user, query, {
    includeArchived: includeArchived === "true",
    includeDrafts: includeDrafts === "true",
    collaboratorIds,
    collectionId,
    dateFilter,
    offset,
    limit
  });
  const documents = results.map(result => result.document);
  const data = await Promise.all(results.map(async result => {
    const document = await (0, _presenters.presentDocument)(result.document);
    return { ...result,
      document
    };
  })); // When requesting subsequent pages of search results we don't want to record
  // duplicate search query records

  if (offset === 0) {
    _models.SearchQuery.create({
      userId: user.id,
      teamId: user.teamId,
      source: ctx.state.authType,
      query,
      results: totalCount
    });
  }

  const policies = (0, _presenters.presentPolicies)(user, documents);
  ctx.body = {
    pagination: ctx.state.pagination,
    data,
    policies
  };
});
router.post("documents.pin", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "pin", document);
  document.pinnedById = user.id;
  await document.save();
  await _models.Event.create({
    name: "documents.pin",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.unpin", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "unpin", document);
  document.pinnedById = null;
  await document.save();
  await _models.Event.create({
    name: "documents.unpin",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.star", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "read", document);
  await _models.Star.findOrCreate({
    where: {
      documentId: document.id,
      userId: user.id
    }
  });
  await _models.Event.create({
    name: "documents.star",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    success: true
  };
});
router.post("documents.unstar", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "read", document);
  await _models.Star.destroy({
    where: {
      documentId: document.id,
      userId: user.id
    }
  });
  await _models.Event.create({
    name: "documents.unstar",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    success: true
  };
});
router.post("documents.create", (0, _authentication.default)(), createDocumentFromContext);
router.post("documents.import", (0, _authentication.default)(), async ctx => {
  const file = Object.values(ctx.request.files)[0];
  const user = ctx.state.user;
  authorize(user, "create", _models.Document);
  const {
    text,
    title
  } = await (0, _documentImporter.default)({
    user,
    file,
    ip: ctx.request.ip
  });
  ctx.body.text = text;
  ctx.body.title = title;
  await createDocumentFromContext(ctx);
});
router.post("documents.templatize", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const original = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "update", original);
  let document = await _models.Document.create({
    editorVersion: original.editorVersion,
    collectionId: original.collectionId,
    teamId: original.teamId,
    userId: user.id,
    publishedAt: new Date(),
    lastModifiedById: user.id,
    createdById: user.id,
    template: true,
    title: original.title,
    text: original.text
  });
  await _models.Event.create({
    name: "documents.create",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title,
      template: true
    },
    ip: ctx.request.ip
  }); // reload to get all of the data needed to present (user, collection etc)

  document = await _models.Document.findByPk(document.id, {
    userId: user.id
  });
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.update", (0, _authentication.default)(), async ctx => {
  const {
    id,
    title,
    text,
    publish,
    autosave,
    done,
    lastRevision,
    templateId,
    append
  } = ctx.body;
  const editorVersion = ctx.headers["x-editor-version"];
  ctx.assertPresent(id, "id is required");
  ctx.assertPresent(title || text, "title or text is required");
  if (append) ctx.assertPresent(text, "Text is required while appending");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "update", document);

  if (lastRevision && lastRevision !== document.revisionCount) {
    throw new _errors.InvalidRequestError("Document has changed since last revision");
  }

  const previousTitle = document.title; // Update document

  if (title) document.title = title;
  if (editorVersion) document.editorVersion = editorVersion;
  if (templateId) document.templateId = templateId;

  if (append) {
    document.text += text;
  } else if (text !== undefined) {
    document.text = text;
  }

  document.lastModifiedById = user.id;
  const {
    collection
  } = document;
  let transaction;

  try {
    transaction = await _sequelize2.sequelize.transaction();

    if (publish) {
      await document.publish({
        transaction
      });
    } else {
      await document.save({
        autosave,
        transaction
      });
    }

    await transaction.commit();
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    throw err;
  }

  if (publish) {
    await _models.Event.create({
      name: "documents.publish",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        title: document.title
      },
      ip: ctx.request.ip
    });
  } else {
    await _models.Event.create({
      name: "documents.update",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        autosave,
        done,
        title: document.title
      },
      ip: ctx.request.ip
    });
  }

  if (document.title !== previousTitle) {
    _models.Event.add({
      name: "documents.title_change",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        previousTitle,
        title: document.title
      },
      ip: ctx.request.ip
    });
  }

  document.updatedBy = user;
  document.collection = collection;
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.move", (0, _authentication.default)(), async ctx => {
  const {
    id,
    collectionId,
    parentDocumentId,
    index
  } = ctx.body;
  ctx.assertUuid(id, "id must be a uuid");
  ctx.assertUuid(collectionId, "collectionId must be a uuid");

  if (parentDocumentId) {
    ctx.assertUuid(parentDocumentId, "parentDocumentId must be a uuid");
  }

  if (index) {
    ctx.assertPositiveInteger(index, "index must be a positive integer");
  }

  if (parentDocumentId === id) {
    throw new _errors.InvalidRequestError("Infinite loop detected, cannot nest a document inside itself");
  }

  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "move", document);
  const collection = await _models.Collection.scope({
    method: ["withMembership", user.id]
  }).findByPk(collectionId);
  authorize(user, "update", collection);

  if (parentDocumentId) {
    const parent = await _models.Document.findByPk(parentDocumentId, {
      userId: user.id
    });
    authorize(user, "update", parent);
  }

  const {
    documents,
    collections
  } = await (0, _documentMover.default)({
    user,
    document,
    collectionId,
    parentDocumentId,
    index,
    ip: ctx.request.ip
  });
  ctx.body = {
    data: {
      documents: await Promise.all(documents.map(document => (0, _presenters.presentDocument)(document))),
      collections: await Promise.all(collections.map(collection => (0, _presenters.presentCollection)(collection)))
    },
    policies: (0, _presenters.presentPolicies)(user, documents)
  };
});
router.post("documents.archive", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "archive", document);
  await document.archive(user.id);
  await _models.Event.create({
    name: "documents.archive",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
});
router.post("documents.delete", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "delete", document);
  await document.delete(user.id);
  await _models.Event.create({
    name: "documents.delete",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    success: true
  };
});
router.post("documents.unpublish", (0, _authentication.default)(), async ctx => {
  const {
    id
  } = ctx.body;
  ctx.assertPresent(id, "id is required");
  const user = ctx.state.user;
  const document = await _models.Document.findByPk(id, {
    userId: user.id
  });
  authorize(user, "unpublish", document);
  await document.unpublish();
  await _models.Event.create({
    name: "documents.unpublish",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title
    },
    ip: ctx.request.ip
  });
  ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
}); // TODO: update to actual `ctx` type

async function createDocumentFromContext(ctx) {
  const {
    title = "",
    text = "",
    publish,
    collectionId,
    parentDocumentId,
    templateId,
    template,
    index
  } = ctx.body;
  const editorVersion = ctx.headers["x-editor-version"];
  ctx.assertUuid(collectionId, "collectionId must be an uuid");

  if (parentDocumentId) {
    ctx.assertUuid(parentDocumentId, "parentDocumentId must be an uuid");
  }

  if (index) ctx.assertPositiveInteger(index, "index must be an integer (>=0)");
  const user = ctx.state.user;
  authorize(user, "create", _models.Document);
  const collection = await _models.Collection.scope({
    method: ["withMembership", user.id]
  }).findOne({
    where: {
      id: collectionId,
      teamId: user.teamId
    }
  });
  authorize(user, "publish", collection);
  let parentDocument;

  if (parentDocumentId) {
    parentDocument = await _models.Document.findOne({
      where: {
        id: parentDocumentId,
        collectionId: collection.id
      }
    });
    authorize(user, "read", parentDocument, {
      collection
    });
  }

  let templateDocument;

  if (templateId) {
    templateDocument = await _models.Document.findByPk(templateId, {
      userId: user.id
    });
    authorize(user, "read", templateDocument);
  }

  let document = await _models.Document.create({
    parentDocumentId,
    editorVersion,
    collectionId: collection.id,
    teamId: user.teamId,
    userId: user.id,
    lastModifiedById: user.id,
    createdById: user.id,
    template,
    templateId: templateDocument ? templateDocument.id : undefined,
    title: templateDocument ? templateDocument.title : title,
    text: templateDocument ? templateDocument.text : text
  });
  await _models.Event.create({
    name: "documents.create",
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: document.teamId,
    actorId: user.id,
    data: {
      title: document.title,
      templateId
    },
    ip: ctx.request.ip
  });

  if (publish) {
    await document.publish();
    await _models.Event.create({
      name: "documents.publish",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      data: {
        title: document.title
      },
      ip: ctx.request.ip
    });
  } // reload to get all of the data needed to present (user, collection etc)
  // we need to specify publishedAt to bypass default scope that only returns
  // published documents


  document = await _models.Document.findOne({
    where: {
      id: document.id,
      publishedAt: document.publishedAt
    }
  });
  document.collection = collection;
  return ctx.body = {
    data: await (0, _presenters.presentDocument)(document),
    policies: (0, _presenters.presentPolicies)(user, [document])
  };
}

var _default = router;
exports.default = _default;