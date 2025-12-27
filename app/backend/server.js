// import { Chat } from "./ws/chat.ts";
const { registerUser, loginUser } = require("./auth/auth.service");

const Fastify = require("fastify");
const websocketPlugin = require("@fastify/websocket");
const fs = require("fs");

// chat: Chat;

async function register(request, reply)
{
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

	return { ok: true }; // result for the front
}

async function login(request, reply)
{
	const { email, password } = request.body;

	if (!email || !password) {
		return reply.status(400).send({ error: "missing field" });
	}

	const result = await loginUser(email, password);

	if (!result.success)
	{
		// it's the same error code, but I let it here if I had other errors leter 
		if (result.reason === "BAD_PASSWORD" || result.reason === "NO_USER")
			return reply.status(401).send({ error: "bad credentials" });
	}

	return { ok: true }; // result for the front
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
}

start();