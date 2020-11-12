"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _url = require("url");

var _util = _interopRequireDefault(require("util"));

var _uuid = _interopRequireDefault(require("uuid"));

var _domains = require("../../shared/utils/domains");

var _errors = require("../errors");

var _sequelize = require("../sequelize");

var _s = require("../utils/s3");

var _Collection = _interopRequireDefault(require("./Collection"));

var _Document = _interopRequireDefault(require("./Document"));

var _User = _interopRequireDefault(require("./User"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const readFile = _util.default.promisify(_fs.default.readFile);

const Team = _sequelize.sequelize.define("team", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  name: _sequelize.DataTypes.STRING,
  subdomain: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true,
    validate: {
      isLowercase: true,
      is: {
        args: [/^[a-z\d-]+$/, "i"],
        msg: "Must be only alphanumeric and dashes"
      },
      len: {
        args: [4, 32],
        msg: "Must be between 4 and 32 characters"
      },
      notIn: {
        args: [_domains.RESERVED_SUBDOMAINS],
        msg: "You chose a restricted word, please try another."
      }
    },
    unique: true
  },
  slackId: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  googleId: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  avatarUrl: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  sharing: {
    type: _sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  guestSignin: {
    type: _sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  documentEmbeds: {
    type: _sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  slackData: _sequelize.DataTypes.JSONB
}, {
  getterMethods: {
    url() {
      if (!this.subdomain || process.env.SUBDOMAINS_ENABLED !== "true") {
        return process.env.URL;
      }

      const url = new _url.URL(process.env.URL);
      url.host = `${this.subdomain}.${(0, _domains.stripSubdomain)(url.host)}`;
      return url.href.replace(/\/$/, "");
    },

    logoUrl() {
      return this.avatarUrl || (this.slackData ? this.slackData.image_88 : null);
    }

  }
});

Team.associate = models => {
  Team.hasMany(models.Collection, {
    as: "collections"
  });
  Team.hasMany(models.Document, {
    as: "documents"
  });
  Team.hasMany(models.User, {
    as: "users"
  });
};

const uploadAvatar = async model => {
  const endpoint = (0, _s.publicS3Endpoint)();
  const {
    avatarUrl
  } = model;

  if (avatarUrl && !avatarUrl.startsWith("/api") && !avatarUrl.startsWith(endpoint)) {
    try {
      const newUrl = await (0, _s.uploadToS3FromUrl)(avatarUrl, `avatars/${model.id}/${_uuid.default.v4()}`, "public-read");
      if (newUrl) model.avatarUrl = newUrl;
    } catch (err) {
      // we can try again next time
      console.error(err);
    }
  }
};

Team.prototype.provisionSubdomain = async function (subdomain) {
  if (this.subdomain) return this.subdomain;
  let append = 0;

  while (true) {
    try {
      await this.update({
        subdomain
      });
      break;
    } catch (err) {
      // subdomain was invalid or already used, try again
      subdomain = `${subdomain}${++append}`;
    }
  }

  return subdomain;
};

Team.prototype.provisionFirstCollection = async function (userId) {
  const collection = await _Collection.default.create({
    name: "Welcome",
    description: "This collection is a quick guide to what Outline is all about. Feel free to delete this collection once your team is up to speed with the basics!",
    teamId: this.id,
    creatorId: userId
  }); // For the first collection we go ahead and create some intitial documents to get
  // the team started. You can edit these in /server/onboarding/x.md

  const onboardingDocs = ["Support", "Integrations & API", "Our Editor", "What is Outline"];

  for (const title of onboardingDocs) {
    const text = await readFile(_path.default.join(__dirname, "..", "..", "..", "server", "onboarding", `${title}.md`), "utf8");
    const document = await _Document.default.create({
      version: 1,
      isWelcome: true,
      parentDocumentId: null,
      collectionId: collection.id,
      teamId: collection.teamId,
      userId: collection.creatorId,
      lastModifiedById: collection.creatorId,
      createdById: collection.creatorId,
      title,
      text
    });
    await document.publish();
  }
};

Team.prototype.addAdmin = async function (user) {
  return user.update({
    isAdmin: true
  });
};

Team.prototype.removeAdmin = async function (user) {
  const res = await _User.default.findAndCountAll({
    where: {
      teamId: this.id,
      isAdmin: true,
      id: {
        [_sequelize.Op.ne]: user.id
      }
    },
    limit: 1
  });

  if (res.count >= 1) {
    return user.update({
      isAdmin: false
    });
  } else {
    throw new _errors.ValidationError("At least one admin is required");
  }
};

Team.prototype.suspendUser = async function (user, admin) {
  if (user.id === admin.id) throw new _errors.ValidationError("Unable to suspend the current user");
  return user.update({
    suspendedById: admin.id,
    suspendedAt: new Date()
  });
};

Team.prototype.activateUser = async function (user, admin) {
  return user.update({
    suspendedById: null,
    suspendedAt: null
  });
};

Team.prototype.collectionIds = async function (paranoid = true) {
  let models = await _Collection.default.findAll({
    attributes: ["id", "private"],
    where: {
      teamId: this.id,
      private: false
    },
    paranoid
  });
  return models.map(c => c.id);
};

Team.beforeSave(uploadAvatar);
var _default = Team;
exports.default = _default;