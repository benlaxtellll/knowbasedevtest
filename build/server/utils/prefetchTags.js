"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var React = _interopRequireWildcard(require("react"));

var _webpack = _interopRequireDefault(require("../../webpack.config"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PUBLIC_PATH = _webpack.default.output.publicPath;
const prefetchTags = [/*#__PURE__*/React.createElement("link", {
  rel: "dns-prefetch",
  href: process.env.AWS_S3_UPLOAD_BUCKET_URL,
  key: "dns"
})];

try {
  const manifest = _fs.default.readFileSync(_path.default.join(__dirname, "../../app/manifest.json"), "utf8");

  const manifestData = JSON.parse(manifest);
  Object.values(manifestData).forEach(filename => {
    if (typeof filename !== "string") return;

    if (filename.endsWith(".js")) {
      prefetchTags.push( /*#__PURE__*/React.createElement("link", {
        rel: "prefetch",
        href: `${PUBLIC_PATH}${filename}`,
        key: filename,
        as: "script"
      }));
    } else if (filename.endsWith(".css")) {
      prefetchTags.push( /*#__PURE__*/React.createElement("link", {
        rel: "prefetch",
        href: `${PUBLIC_PATH}${filename}`,
        key: filename,
        as: "style"
      }));
    }
  });
} catch (_e) {// no-op
}

var _default = prefetchTags;
exports.default = _default;