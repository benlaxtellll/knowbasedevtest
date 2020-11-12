"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImageByKey = exports.getSignedImageUrl = exports.deleteFromS3 = exports.uploadToS3FromUrl = exports.uploadToS3FromBuffer = exports.publicS3Endpoint = exports.getSignature = exports.makePolicy = exports.makeCredential = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var Sentry = _interopRequireWildcard(require("@sentry/node"));

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _add_hours = _interopRequireDefault(require("date-fns/add_hours"));

var _format = _interopRequireDefault(require("date-fns/format"));

var _isomorphicFetch = _interopRequireDefault(require("isomorphic-fetch"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_UPLOAD_BUCKET_NAME = process.env.AWS_S3_UPLOAD_BUCKET_NAME || "";
const AWS_S3_FORCE_PATH_STYLE = process.env.AWS_S3_FORCE_PATH_STYLE !== "false";
const s3 = new _awsSdk.default.S3({
  s3ForcePathStyle: AWS_S3_FORCE_PATH_STYLE,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  endpoint: new _awsSdk.default.Endpoint(process.env.AWS_S3_UPLOAD_BUCKET_URL),
  signatureVersion: "v4"
});

const hmac = (key, message, encoding) => {
  return _crypto.default.createHmac("sha256", key).update(message, "utf8").digest(encoding);
};

const makeCredential = () => {
  const credential = AWS_ACCESS_KEY_ID + "/" + (0, _format.default)(new Date(), "YYYYMMDD") + "/" + AWS_REGION + "/s3/aws4_request";
  return credential;
};

exports.makeCredential = makeCredential;

const makePolicy = (credential, longDate, acl) => {
  const tomorrow = (0, _add_hours.default)(new Date(), 24);
  const policy = {
    conditions: [{
      bucket: process.env.AWS_S3_UPLOAD_BUCKET_NAME
    }, ["starts-with", "$key", ""], {
      acl
    }, ["content-length-range", 0, +process.env.AWS_S3_UPLOAD_MAX_SIZE], ["starts-with", "$Content-Type", "image"], ["starts-with", "$Cache-Control", ""], {
      "x-amz-algorithm": "AWS4-HMAC-SHA256"
    }, {
      "x-amz-credential": credential
    }, {
      "x-amz-date": longDate
    }],
    expiration: (0, _format.default)(tomorrow, "YYYY-MM-DDTHH:mm:ss\\Z")
  };
  return new Buffer(JSON.stringify(policy)).toString("base64");
};

exports.makePolicy = makePolicy;

const getSignature = policy => {
  const kDate = hmac("AWS4" + AWS_SECRET_ACCESS_KEY, (0, _format.default)(new Date(), "YYYYMMDD"));
  const kRegion = hmac(kDate, AWS_REGION);
  const kService = hmac(kRegion, "s3");
  const kCredentials = hmac(kService, "aws4_request");
  const signature = hmac(kCredentials, policy, "hex");
  return signature;
};

exports.getSignature = getSignature;

const publicS3Endpoint = isServerUpload => {
  // lose trailing slash if there is one and convert fake-s3 url to localhost
  // for access outside of docker containers in local development
  const isDocker = process.env.AWS_S3_UPLOAD_BUCKET_URL.match(/http:\/\/s3:/);
  const host = process.env.AWS_S3_UPLOAD_BUCKET_URL.replace("s3:", "localhost:").replace(/\/$/, "");
  return `${host}/${isServerUpload && isDocker ? "s3/" : ""}${AWS_S3_UPLOAD_BUCKET_NAME}`;
};

exports.publicS3Endpoint = publicS3Endpoint;

const uploadToS3FromBuffer = async (buffer, contentType, key, acl) => {
  await s3.putObject({
    ACL: acl,
    Bucket: AWS_S3_UPLOAD_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: buffer.length,
    ServerSideEncryption: "AES256",
    Body: buffer
  }).promise();
  const endpoint = publicS3Endpoint(true);
  return `${endpoint}/${key}`;
};

exports.uploadToS3FromBuffer = uploadToS3FromBuffer;

const uploadToS3FromUrl = async (url, key, acl) => {
  try {
    // $FlowIssue https://github.com/facebook/flow/issues/2171
    const res = await (0, _isomorphicFetch.default)(url);
    const buffer = await res.buffer();
    await s3.putObject({
      ACL: acl,
      Bucket: AWS_S3_UPLOAD_BUCKET_NAME,
      Key: key,
      ContentType: res.headers["content-type"],
      ContentLength: res.headers["content-length"],
      ServerSideEncryption: "AES256",
      Body: buffer
    }).promise();
    const endpoint = publicS3Endpoint(true);
    return `${endpoint}/${key}`;
  } catch (err) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    } else {
      throw err;
    }
  }
};

exports.uploadToS3FromUrl = uploadToS3FromUrl;

const deleteFromS3 = key => {
  return s3.deleteObject({
    Bucket: AWS_S3_UPLOAD_BUCKET_NAME,
    Key: key
  }).promise();
};

exports.deleteFromS3 = deleteFromS3;

const getSignedImageUrl = async key => {
  const isDocker = process.env.AWS_S3_UPLOAD_BUCKET_URL.match(/http:\/\/s3:/);
  const params = {
    Bucket: AWS_S3_UPLOAD_BUCKET_NAME,
    Key: key,
    Expires: 60
  };
  return isDocker ? `${publicS3Endpoint()}/${key}` : s3.getSignedUrl("getObject", params);
};

exports.getSignedImageUrl = getSignedImageUrl;

const getImageByKey = async key => {
  const params = {
    Bucket: AWS_S3_UPLOAD_BUCKET_NAME,
    Key: key
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (err) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    } else {
      throw err;
    }
  }
};

exports.getImageByKey = getImageByKey;