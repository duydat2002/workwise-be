const admin = require("@/configs/firebase-admin");
const User = require("@/models/user");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // req.userId = token;
  // next();
  // return;

  if (!token) {
    return res.status(403).json({
      success: false,
      result: null,
      message: "Token is required.",
    });
  }

  try {
    const userCred = await admin.auth().verifyIdToken(token);

    if (!userCred) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "Unauthorized.",
      });
    }

    const user = await User.findOne({ uid: userCred.uid });

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      result: null,
      message: "Unauthorized.",
      error,
    });
  }
};

module.exports = {
  verifyToken,
};
