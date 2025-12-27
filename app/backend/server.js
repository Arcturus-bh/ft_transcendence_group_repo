const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");
const fs = require("fs");

// chat: Chat;

async function register(request, reply)
{
	const { email, password, nickname } = request.body;
const { registerUser, loginUser } = require("./auth/auth.service");

async function register(request, reply) {
  const { email, password, nickname } = request.body;

  if (!email || !password || !nickname) {
    return reply.status(400).send({ error: "missing field" });
  }

  const result = await registerUser(email, password, nickname);

	if (!result.success)
	{
		let errmsg = "register error";

		if (result.reason === "BAD_EMAIL_FORMAT")
			errmsg = "bad email format.";
	
		else if (result.reason === "BAD_NICK_FORMAT")
			errmsg = "bad nickname format. Need to use only alphanumeric characters.";

		else if (result.reason === "USER_EXIST")
			errmsg = "user already exists, change your infos or try to login.";
		
		return reply.status(400).send({ error: errmsg });
	}
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

	const fastify = Fastify({
	logger: true,
	https: {
		key: fs.readFileSync("certs/key.pem"),
		cert: fs.readFileSync("certs/cert.pem"),
		},
	});


	// ENABLE WEBSOCKET
	await fastify.register(websocketPlugin);


	// LISTEN ROUTES
	fastify.post("/auth/register", register);
	fastify.post("/auth/login", login);

	// Liste des clients connectés
	// const clients = new Set();

	// // Endpoint WebSocket
	// fastify.get("/ws", { websocket: true }, (connection, req) => {
	//   clients.add(connection);
	//   chat.addClient("test");

	//   // Broadcast connexion
	//   for (const client of clients) {
	//     client.socket.send(`A user connected. Total: ${clients.size}`);
	//     chat.broadcastClientIn(client.getName());
	//   }

	//   // Message entrant
	//   connection.socket.on("message", (message) => {
	//     for (const client of clients) {
	//       client.socket.send(`User says: ${message}`);
	//     }
	//   });

	//   // Déconnexion
	//   connection.socket.on("close", () => {
	//     clients.delete(connection);
	//     for (const client of clients) {
	//       client.socket.send(`A user disconnected. Total: ${clients.size}`);
	//     }
	//   });
	// });

	// Lancer serveur
	fastify.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
		if (err) {
			fastify.log.error(err);
			process.exit(1);
		}
		console.log("Backend running on https://localhost:3000");
	});
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