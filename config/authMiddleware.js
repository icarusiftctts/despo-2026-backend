const { auth } = require("./firebase");

async function verifyFirebaseToken(req, res, next) {
  // DEV MODE BYPASS
  if (process.env.DEV_MODE === "true") {
    req.user = {
      uid: "dev-user",
      email: "dev@example.com",
      isAdmin: true,
    };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization header",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = verifyFirebaseToken;
