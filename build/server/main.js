"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.socketio = void 0;

var _http = _interopRequireDefault(require("http"));

var _socket = _interopRequireDefault(require("socket.io"));

var _socket2 = _interopRequireDefault(require("socket.io-redis"));

var _socketioAuth = _interopRequireDefault(require("socketio-auth"));

var _app = _interopRequireDefault(require("./app"));

var _models = require("./models");

var _policies = _interopRequireDefault(require("./policies"));

var _redis = require("./redis");

var _jwt = require("./utils/jwt");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const server = _http.default.createServer(_app.default.callback());

let io;
const {
  can
} = _policies.default;
io = (0, _socket.default)(server, {
  path: "/realtime",
  serveClient: false,
  cookie: false
});
io.adapter((0, _socket2.default)({
  pubClient: _redis.client,
  subClient: _redis.subscriber
}));
io.of("/").adapter.on("error", err => {
  if (err.name === "MaxRetriesPerRequestError") {
    console.error(`Redis error: ${err.message}. Shutting down now.`);
    throw err;
  } else {
    console.error(`Redis error: ${err.message}`);
  }
});
(0, _socketioAuth.default)(io, {
  authenticate: async (socket, data, callback) => {
    const {
      token
    } = data;

    try {
      const user = await (0, _jwt.getUserForJWT)(token);
      socket.client.user = user; // store the mapping between socket id and user id in redis
      // so that it is accessible across multiple server nodes

      await _redis.client.hset(socket.id, "userId", user.id);
      return callback(null, true);
    } catch (err) {
      return callback(err);
    }
  },
  postAuthenticate: async (socket, data) => {
    const {
      user
    } = socket.client; // the rooms associated with the current team
    // and user so we can send authenticated events

    let rooms = [`team-${user.teamId}`, `user-${user.id}`]; // the rooms associated with collections this user
    // has access to on connection. New collection subscriptions
    // are managed from the client as needed through the 'join' event

    const collectionIds = await user.collectionIds();
    collectionIds.forEach(collectionId => rooms.push(`collection-${collectionId}`)); // join all of the rooms at once

    socket.join(rooms); // allow the client to request to join rooms

    socket.on("join", async event => {
      // user is joining a collection channel, because their permissions have
      // changed, granting them access.
      if (event.collectionId) {
        const collection = await _models.Collection.scope({
          method: ["withMembership", user.id]
        }).findByPk(event.collectionId);

        if (can(user, "read", collection)) {
          socket.join(`collection-${event.collectionId}`);
        }
      } // user is joining a document channel, because they have navigated to
      // view a document.


      if (event.documentId) {
        const document = await _models.Document.findByPk(event.documentId, {
          userId: user.id
        });

        if (can(user, "read", document)) {
          const room = `document-${event.documentId}`;
          await _models.View.touch(event.documentId, user.id, event.isEditing);
          const editing = await _models.View.findRecentlyEditingByDocument(event.documentId);
          socket.join(room, () => {
            // let everyone else in the room know that a new user joined
            io.to(room).emit("user.join", {
              userId: user.id,
              documentId: event.documentId,
              isEditing: event.isEditing
            }); // let this user know who else is already present in the room

            io.in(room).clients(async (err, sockets) => {
              if (err) throw err; // because a single user can have multiple socket connections we
              // need to make sure that only unique userIds are returned. A Map
              // makes this easy.

              let userIds = new Map();

              for (const socketId of sockets) {
                const userId = await _redis.client.hget(socketId, "userId");
                userIds.set(userId, userId);
              }

              socket.emit("document.presence", {
                documentId: event.documentId,
                userIds: Array.from(userIds.keys()),
                editingIds: editing.map(view => view.userId)
              });
            });
          });
        }
      }
    }); // allow the client to request to leave rooms

    socket.on("leave", event => {
      if (event.collectionId) {
        socket.leave(`collection-${event.collectionId}`);
      }

      if (event.documentId) {
        const room = `document-${event.documentId}`;
        socket.leave(room, () => {
          io.to(room).emit("user.leave", {
            userId: user.id,
            documentId: event.documentId
          });
        });
      }
    });
    socket.on("disconnecting", () => {
      const rooms = Object.keys(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith("document-")) {
          const documentId = room.replace("document-", "");
          io.to(room).emit("user.leave", {
            userId: user.id,
            documentId
          });
        }
      });
    });
    socket.on("presence", async event => {
      const room = `document-${event.documentId}`;

      if (event.documentId && socket.rooms[room]) {
        const view = await _models.View.touch(event.documentId, user.id, event.isEditing);
        view.user = user;
        io.to(room).emit("user.presence", {
          userId: user.id,
          documentId: event.documentId,
          isEditing: event.isEditing
        });
      }
    });
  }
});
server.on("error", err => {
  throw err;
});
server.on("listening", () => {
  const address = server.address();
  console.log(`\n> Listening on http://localhost:${address.port}\n`);
});
server.listen(process.env.PORT || "3000");
const socketio = io;
exports.socketio = socketio;
var _default = server;
exports.default = _default;