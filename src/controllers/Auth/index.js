const User = require("@/models/user");
const firebase = require("@/configs/firebase-admin");

const authController = {
  register: async (req, res) => {
    const { email, password, fullname } = req.body;

    if (!fullname || fullname?.trim() == "") {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Họ tên không được để trống.",
      });
    }

    try {
      const userCred = await firebase.auth.cre;

      const user = new User({
        uid: userCred.user.uid,
        email,
        fullname: fullname ?? userCred.user.displayName,
        avatar: userCred.user.photoURL,
      });

      user.save();

      // const token = userCred.user.

      return res.status(200).json({
        success: true,
        result: {},
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        result: error.code,
        cac: error,
      });
    }
  },
  login: async (req, res) => {
    return res.status(200).json({
      success: true,
      result: true,
    });
  },
};

module.exports = authController;
