"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sequelize = require("../sequelize");

const Authentication = _sequelize.sequelize.define("authentication", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  service: _sequelize.DataTypes.STRING,
  scopes: _sequelize.DataTypes.ARRAY(_sequelize.DataTypes.STRING),
  token: (0, _sequelize.encryptedFields)().vault("token")
});

Authentication.associate = models => {
  Authentication.belongsTo(models.User, {
    as: "user",
    foreignKey: "userId"
  });
  Authentication.belongsTo(models.Team, {
    as: "team",
    foreignKey: "teamId"
  });
};

var _default = Authentication;
exports.default = _default;