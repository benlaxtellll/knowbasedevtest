"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _sub_minutes = _interopRequireDefault(require("date-fns/sub_minutes"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _uuid = _interopRequireDefault(require("uuid"));

var _errors = require("../errors");

var _mailer = require("../mailer");

var _sequelize = require("../sequelize");

var _s = require("../utils/s3");

var _ = require(".");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_AVATAR_HOST = "https://tiley.herokuapp.com";

const User = _sequelize.sequelize.define("user", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: _sequelize.DataTypes.STRING
  },
  username: {
    type: _sequelize.DataTypes.STRING
  },
  name: _sequelize.DataTypes.STRING,
  avatarUrl: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  isAdmin: _sequelize.DataTypes.BOOLEAN,
  service: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  serviceId: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  slackData: _sequelize.DataTypes.JSONB,
  jwtSecret: (0, _sequelize.encryptedFields)().vault("jwtSecret"),
  lastActiveAt: _sequelize.DataTypes.DATE,
  lastActiveIp: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  lastSignedInAt: _sequelize.DataTypes.DATE,
  lastSignedInIp: {
    type: _sequelize.DataTypes.STRING,
    allowNull: true
  },
  lastSigninEmailSentAt: _sequelize.DataTypes.DATE,
  suspendedAt: _sequelize.DataTypes.DATE,
  suspendedById: _sequelize.DataTypes.UUID
}, {
  paranoid: true,
  getterMethods: {
    isSuspended() {
      return !!this.suspendedAt;
    },

    avatarUrl() {
      const original = this.getDataValue("avatarUrl");

      if (original) {
        return original;
      }

      const hash = _crypto.default.createHash("md5").update(this.email || "").digest("hex");

      return `${DEFAULT_AVATAR_HOST}/avatar/${hash}/${this.name[0]}.png`;
    }

  }
}); // Class methods


User.associate = models => {
  User.hasMany(models.ApiKey, {
    as: "apiKeys",
    onDelete: "cascade"
  });
  User.hasMany(models.NotificationSetting, {
    as: "notificationSettings",
    onDelete: "cascade"
  });
  User.hasMany(models.Document, {
    as: "documents"
  });
  User.hasMany(models.View, {
    as: "views"
  });
  User.belongsTo(models.Team);
}; // Instance methods


User.prototype.collectionIds = async function (options = {}) {
  const collectionStubs = await _.Collection.scope({
    method: ["withMembership", this.id]
  }).findAll({
    attributes: ["id", "private"],
    where: {
      teamId: this.teamId
    },
    paranoid: true,
    ...options
  });
  return collectionStubs.filter(c => !c.private || c.memberships.length > 0 || c.collectionGroupMemberships.length > 0).map(c => c.id);
};

User.prototype.updateActiveAt = function (ip) {
  const fiveMinutesAgo = (0, _sub_minutes.default)(new Date(), 5); // ensure this is updated only every few minutes otherwise
  // we'll be constantly writing to the DB as API requests happen

  if (this.lastActiveAt < fiveMinutesAgo) {
    this.lastActiveAt = new Date();
    this.lastActiveIp = ip;
    return this.save({
      hooks: false
    });
  }
};

User.prototype.updateSignedIn = function (ip) {
  this.lastSignedInAt = new Date();
  this.lastSignedInIp = ip;
  return this.save({
    hooks: false
  });
};

User.prototype.getJwtToken = function () {
  return _jsonwebtoken.default.sign({
    id: this.id
  }, this.jwtSecret);
};

User.prototype.getEmailSigninToken = function () {
  if (this.service && this.service !== "email") {
    throw new Error("Cannot generate email signin token for OAuth user");
  }

  return _jsonwebtoken.default.sign({
    id: this.id,
    createdAt: new Date().toISOString()
  }, this.jwtSecret);
};

const uploadAvatar = async model => {
  const endpoint = (0, _s.publicS3Endpoint)();
  const {
    avatarUrl
  } = model;

  if (avatarUrl && !avatarUrl.startsWith("/api") && !avatarUrl.startsWith(endpoint) && !avatarUrl.startsWith(DEFAULT_AVATAR_HOST)) {
    try {
      const newUrl = await (0, _s.uploadToS3FromUrl)(avatarUrl, `avatars/${model.id}/${_uuid.default.v4()}`, "public-read");
      if (newUrl) model.avatarUrl = newUrl;
    } catch (err) {
      // we can try again next time
      console.error(err);
    }
  }
};

const setRandomJwtSecret = model => {
  model.jwtSecret = _crypto.default.randomBytes(64).toString("hex");
};

const removeIdentifyingInfo = async (model, options) => {
  await _.NotificationSetting.destroy({
    where: {
      userId: model.id
    },
    transaction: options.transaction
  });
  await _.ApiKey.destroy({
    where: {
      userId: model.id
    },
    transaction: options.transaction
  });
  await _.Star.destroy({
    where: {
      userId: model.id
    },
    transaction: options.transaction
  });
  model.email = null;
  model.name = "Unknown";
  model.avatarUrl = "";
  model.serviceId = null;
  model.username = null;
  model.slackData = null;
  model.lastActiveIp = null;
  model.lastSignedInIp = null; // this shouldn't be needed once this issue is resolved:
  // https://github.com/sequelize/sequelize/issues/9318

  await model.save({
    hooks: false,
    transaction: options.transaction
  });
};

const checkLastAdmin = async model => {
  const teamId = model.teamId;

  if (model.isAdmin) {
    const userCount = await User.count({
      where: {
        teamId
      }
    });
    const adminCount = await User.count({
      where: {
        isAdmin: true,
        teamId
      }
    });

    if (userCount > 1 && adminCount <= 1) {
      throw new _errors.ValidationError("Cannot delete account as only admin. Please transfer admin permissions to another user and try again.");
    }
  }
};

User.beforeDestroy(checkLastAdmin);
User.beforeDestroy(removeIdentifyingInfo);
User.beforeSave(uploadAvatar);
User.beforeCreate(setRandomJwtSecret);
User.afterCreate(async user => {
  const team = await _.Team.findByPk(user.teamId); // From Slack support:
  // If you wish to contact users at an email address obtained through Slack,
  // you need them to opt-in through a clear and separate process.

  if (user.service && user.service !== "slack") {
    (0, _mailer.sendEmail)("welcome", user.email, {
      teamUrl: team.url
    });
  }
}); // By default when a user signs up we subscribe them to email notifications
// when documents they created are edited by other team members and onboarding

User.afterCreate(async (user, options) => {
  await Promise.all([_.NotificationSetting.findOrCreate({
    where: {
      userId: user.id,
      teamId: user.teamId,
      event: "documents.update"
    },
    transaction: options.transaction
  }), _.NotificationSetting.findOrCreate({
    where: {
      userId: user.id,
      teamId: user.teamId,
      event: "emails.onboarding"
    },
    transaction: options.transaction
  })]);
});
var _default = User;
exports.default = _default;