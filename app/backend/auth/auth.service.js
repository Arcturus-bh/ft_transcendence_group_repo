const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

function isAlphaNum(str)
{
    for (const c of str)
    {
        if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9' )))
            return false;
    }

    return true;
}

async function registerUser(email, pass, nickname)
{
    let email_len = email.length;

    if (email.indexOf('@') === -1 ||
        ((email.substr(email_len - 4) !== ".com") && (email.substr(email_len - 3) !== ".fr")) ||
        (email.substr(email_len - 5) === "@.com") ||
        (email.substr(email_len - 4) === "@.fr"))
        return {success: false, reason: "BAD_EMAIL_FORMAT"};

    if (isAlphaNum(nickname) === false)
        return {success: false, reason: "BAD_NICK_FORMAT"};

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