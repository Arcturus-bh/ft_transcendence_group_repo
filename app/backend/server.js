const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");

const { registerUser, loginUser } = require("./auth/auth.service");

async function register(request, reply) {
  const { email, password, nickname } = request.body;

  if (!email || !password || !nickname) {
    return reply.status(400).send({ error: "missing field" });
  }

  const result = await registerUser(email, password, nickname);

  if (!result.success && result.reason === "USER_EXIST") {
    return reply
      .status(400)
      .send({ error: "user already exists, change your infos or try to login." });
  }

  return { ok: true };
}

async function login(request, reply) {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.status(400).send({ error: "missing field" });
  }

  const result = await loginUser(email, password);

  if (!result.success && (result.reason === "BAD_PASSWORD" || result.reason === "NO_USER")) {
    return reply.status(401).send({ error: "bad credentials" });
  }

  // IMPORTANT: il faut renvoyer nickname depuis loginUser (voir plus bas)
  return {
    nickname: result.user.nickname,
    token: "JWT_ICI",
  };
}

async function start() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await fastify.register(websocketPlugin);

  fastify.post("/auth/register", register);
  fastify.post("/auth/login", login);

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on http://localhost:3000");
}

start();