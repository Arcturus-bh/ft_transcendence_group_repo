const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/* ===========================
   ONLINE / WEBSOCKET STATE
   =========================== */

// socket -> userId
const onlineSockets = new Map();

function broadcastUsers() {
  const onlineUserIds = [...new Set(onlineSockets.values())];

  const payload = JSON.stringify({
    type: "USERS_STATUS",
    onlineUsers: onlineUserIds,
  });

  for (const socket of onlineSockets.keys()) {
    if (socket.readyState === 1) {
      socket.send(payload);
    }
  }
}

/* ===========================
   AUTH SERVICES
   =========================== */

const { registerUser, loginUser } = require("./auth/auth.service");

/* ===========================
   SERVER BOOTSTRAP
   =========================== */

async function start() {
  const fastify = Fastify({
    logger: true,
    https: {
      key: fs.readFileSync("/app/backend/certs/key.pem"),
      cert: fs.readFileSync("/app/backend/certs/cert.pem"),
    },
  });

  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(websocketPlugin);

  /* ===========================
     HTTP AUTH
     =========================== */

  fastify.post("/auth/register", async (req, reply) => {
    const { email, password, nickname } = req.body;

    const result = await registerUser(email, password, nickname);
    if (!result.success) {
      return reply.status(400).send({ error: result.reason });
    }

    return { ok: true };
  });

  fastify.post("/auth/login", async (req, reply) => {
    const { email, password } = req.body;

    const result = await loginUser(email, password);
    if (!result.success) {
      return reply.status(401).send({ error: "bad credentials" });
    }

    return {
      userId: result.user.id,
      nickname: result.user.nickname,
      token: `DEV_TOKEN_${result.user.id}`,
    };
  });

  fastify.post("/auth/logout", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === userId) {
        socket.close();
        onlineSockets.delete(socket);
      }
    }

    broadcastUsers();
    return { ok: true };
  });

  /* ===========================
     WEBSOCKET
     =========================== */

  fastify.get("/ws", { websocket: true }, (connection, req) => {
    const token = req.headers["sec-websocket-protocol"];

    if (!token || !token.startsWith("DEV_TOKEN_")) {
      connection.socket.close();
      return;
    }

    const userId = Number(token.replace("DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      connection.socket.close();
      return;
    }

    onlineSockets.set(connection.socket, userId);
    broadcastUsers();

    connection.socket.on("close", () => {
      onlineSockets.delete(connection.socket);
      broadcastUsers();
    });
  });

  /* ===========================
     USER DATA
     =========================== */

  fastify.post("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: req.body.avatar },
    });

    return { ok: true };
  });

  fastify.get("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return { avatar: user?.avatarUrl ?? null };
  });

  fastify.get("/users", async () => {
    const users = await prisma.user.findMany({
      select: { id: true, nickname: true },
      orderBy: { nickname: "asc" },
    });

    const onlineIds = new Set(onlineSockets.values());

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      online: onlineIds.has(u.id),
    }));
  });

  /* ===========================
      START
     =========================== */

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on https://localhost:3000");
}

start();
