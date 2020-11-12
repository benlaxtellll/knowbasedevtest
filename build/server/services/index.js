"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _debug = _interopRequireDefault(require("debug"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)("services");
const services = {};

_fsExtra.default.readdirSync(__dirname).filter(file => file.indexOf(".") !== 0 && file !== _path.default.basename(__filename) && !file.includes(".test")).forEach(fileName => {
  const servicePath = _path.default.join(__dirname, fileName);

  const name = _path.default.basename(servicePath.replace(/\.js$/, "")); // $FlowIssue


  const Service = require(servicePath).default;

  services[name] = new Service();
  log(`loaded ${name} service`);
});

var _default = services;
exports.default = _default;