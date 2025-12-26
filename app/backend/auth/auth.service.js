const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");


async function registerUser(email, pass, nickname)
{
    // verify if nickname or email already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { nickname }],
        },
    });

    if (existingUser)
        return {success: false, reason: "USER_EXIST"};

    const passwordHash = await bcrypt.hash(pass, 10);

    await prisma.user.create({
			data: {
			email,
			nickname,
			passwordHash,
			},
		});

    return {success: true};
}

async function loginUser(email, pass) {
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!existingUser)
    return { success: false, reason: "NO_USER" };

  const goodPassword = await bcrypt.compare(pass, existingUser.passwordHash);
  if (!goodPassword)
    return { success: false, reason: "BAD_PASSWORD" };

  return { success: true, user: existingUser };
}

module.exports = { registerUser, loginUser };