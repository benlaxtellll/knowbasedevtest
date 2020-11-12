"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pulsate = exports.bounceIn = exports.fadeAndSlideIn = exports.fadeAndScaleIn = exports.fadeIn = void 0;

var _styledComponents = require("styled-components");

var fadeIn = (0, _styledComponents.keyframes)(["from{opacity:0;}to{opacity:1;}"]);
exports.fadeIn = fadeIn;
var fadeAndScaleIn = (0, _styledComponents.keyframes)(["from{opacity:0;transform:scale(.98);}to{opacity:1;transform:scale(1);}"]);
exports.fadeAndScaleIn = fadeAndScaleIn;
var fadeAndSlideIn = (0, _styledComponents.keyframes)(["from{opacity:0;transform:scale(.98) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0px);}"]);
exports.fadeAndSlideIn = fadeAndSlideIn;
var bounceIn = (0, _styledComponents.keyframes)(["from,20%,40%,60%,80%,to{-webkit-animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);}0%{opacity:0;-webkit-transform:scale3d(0.3,0.3,0.3);transform:scale3d(0.3,0.3,0.3);}20%{-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1);}40%{-webkit-transform:scale3d(0.9,0.9,0.9);transform:scale3d(0.9,0.9,0.9);}60%{opacity:1;-webkit-transform:scale3d(1.03,1.03,1.03);transform:scale3d(1.03,1.03,1.03);}80%{-webkit-transform:scale3d(0.97,0.97,0.97);transform:scale3d(0.97,0.97,0.97);}to{opacity:1;-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1);}"]);
exports.bounceIn = bounceIn;
var pulsate = (0, _styledComponents.keyframes)(["0%{opacity:1;}50%{opacity:0.5;}100%{opacity:1;}"]);
exports.pulsate = pulsate;