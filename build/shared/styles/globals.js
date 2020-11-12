"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.object.freeze");

require("core-js/modules/es6.string.link");

var _styledComponents = require("styled-components");

var _styledNormalize = _interopRequireDefault(require("styled-normalize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  ", "\n\n  * {\n    box-sizing: border-box;\n  }\n\n  html,\n  body {\n    width: 100%;\n    min-height: 100vh;\n    margin: 0;\n    padding: 0;\n  }\n\n  body,\n  button,\n  input,\n  optgroup,\n  select,\n  textarea {\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,\n      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n  }\n\n  body {\n    font-size: 16px;\n    line-height: 1.5;\n    color: ", ";\n\n    -moz-osx-font-smoothing: grayscale;\n    -webkit-font-smoothing: antialiased;\n    text-rendering: optimizeLegibility;\n  }\n\n  a {\n    color: ", ";\n    text-decoration: none;\n    cursor: pointer;\n  }\n\n  h1,\n  h2,\n  h3,\n  h4,\n  h5,\n  h6 {\n    font-weight: 500;\n    line-height: 1.25;\n    margin-top: 1em;\n    margin-bottom: 0.5em;\n  }\n  h1 { font-size: 2.25em; }\n  h2 { font-size: 1.5em; }\n  h3 { font-size: 1.25em; }\n  h4 { font-size: 1em; }\n  h5 { font-size: 0.875em; }\n  h6 { font-size: 0.75em; }\n\n  p,\n  dl,\n  ol,\n  ul,\n  pre,\n  blockquote {\n    margin-top: 1em;\n    margin-bottom: 1em;\n  }\n\n  hr {\n    border: 0;\n    height: 0;\n    border-top: 1px solid ", ";\n  }\n\n  .js-focus-visible :focus:not(.focus-visible) {\n    outline: none;\n  }\n\n  .js-focus-visible .focus-visible {\n    outline-color: ", ";\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _default = (0, _styledComponents.createGlobalStyle)(_templateObject(), _styledNormalize.default, function (props) {
  return props.theme.text;
}, function (props) {
  return props.theme.link;
}, function (props) {
  return props.theme.divider;
}, function (props) {
  return props.theme.primary;
});

exports.default = _default;