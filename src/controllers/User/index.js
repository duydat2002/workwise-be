const User = require("@/models/user");

const userController = {
  getUser: async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found user.",
      });

    return res.status(200).json({
      success: true,
      result: { user },
    });
  },
  createUser: async (req, res) => {
    const { uid, email, fullname, avatar, emailVerified } = req.body;

    if (!uid || !email || !fullname) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Thiếu thông tin.",
      });
    }

    const user = new User({
      uid,
      email,
      fullname,
      avatar,
      emailVerified: emailVerified ?? false,
    });

    user.save();

    return res.status(200).json({
      success: true,
      result: { user },
    });
  },
  updateUser: async (req, res) => {
    const { fullname, avatar, emailVerified } = req.body;

    return res.status(200).json({
      success: true,
      result: null,
    });
  },
  verifyEmail: async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found user.",
      });

    user.emailVerified = true;

    await user.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully verify email.",
    });
  },
};

module.exports = userController;
