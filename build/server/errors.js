"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthenticationError = AuthenticationError;
exports.AuthorizationError = AuthorizationError;
exports.AdminRequiredError = AdminRequiredError;
exports.UserSuspendedError = UserSuspendedError;
exports.InvalidRequestError = InvalidRequestError;
exports.NotFoundError = NotFoundError;
exports.ParamRequiredError = ParamRequiredError;
exports.ValidationError = ValidationError;
exports.EditorUpdateError = EditorUpdateError;
exports.FileImportError = FileImportError;

var _httpErrors = _interopRequireDefault(require("http-errors"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function AuthenticationError(message = "Invalid authentication") {
  return (0, _httpErrors.default)(401, message, {
    id: "authentication_required"
  });
}

function AuthorizationError(message = "You do not have permission to access this resource") {
  return (0, _httpErrors.default)(403, message, {
    id: "permission_required"
  });
}

function AdminRequiredError(message = "An admin role is required to access this resource") {
  return (0, _httpErrors.default)(403, message, {
    id: "admin_required"
  });
}

function UserSuspendedError({
  adminEmail
}) {
  return (0, _httpErrors.default)(403, "Your access has been suspended by the team admin", {
    id: "user_suspended",
    errorData: {
      adminEmail
    }
  });
}

function InvalidRequestError(message = "Request invalid") {
  return (0, _httpErrors.default)(400, message, {
    id: "invalid_request"
  });
}

function NotFoundError(message = "Resource not found") {
  return (0, _httpErrors.default)(404, message, {
    id: "not_found"
  });
}

function ParamRequiredError(message = "Required parameter missing") {
  return (0, _httpErrors.default)(400, message, {
    id: "param_required"
  });
}

function ValidationError(message = "Validation failed") {
  return (0, _httpErrors.default)(400, message, {
    id: "validation_error"
  });
}

function EditorUpdateError(message = "The client editor is out of date and must be reloaded") {
  return (0, _httpErrors.default)(400, message, {
    id: "editor_update_required"
  });
}

function FileImportError(message = "The file could not be imported") {
  return (0, _httpErrors.default)(400, message, {
    id: "import_error"
  });
}