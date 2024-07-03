const {
  singleUpload,
  deleteFileStorageByUrl,
} = require("@/handlers/firebaseUpload");
const User = require("@/models/user");
const { checkFilesType, checkFilesSize } = require("@/utils");
const admin = require("@/configs/firebase-admin");

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
      message: "Successfully get user.",
    });
  },
  findUserByUid: async (req, res) => {
    const { uid } = req.query;

    const user = await User.findOne({ uid: uid });

    if (!user)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found user.",
      });

    return res.status(200).json({
      success: true,
      result: { user },
      message: "Successfully find user by uid.",
    });
  },
  findUsersByEmail: async (req, res) => {
    const { email } = req.query;

    const users = await User.find({ email: email, emailVerified: true });

    return res.status(200).json({
      success: true,
      result: { users },
      message: "Successfully find users by email.",
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

    await user.save();

    return res.status(200).json({
      success: true,
      result: { user },
      message: "Successfully create user.",
    });
  },
  updateUserInfo: async (req, res) => {
    const { fullname, emailVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        fullname,
        emailVerified,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: { user },
      message: "Successfully update user info.",
    });
  },
  updateAvatar: async (req, res) => {
    const checkFileType = checkFilesType([req.file], ["image"]);

    if (!checkFileType.success) {
      return res.status(400).json({
        success: false,
        result: null,
        message: checkFileType.message,
      });
    }

    const checkFileSize = checkFilesSize([req.file], 5 * 1024 * 1024);
    if (!checkFileSize.success) {
      return res.status(400).json({
        success: false,
        result: null,
        message: checkFileSize.message,
      });
    }

    const avatarUrl = await singleUpload(req.file, `${req.userId}/avatar`);

    const user = await User.findById(req.userId);

    const oldAvatar = user.avatar;
    user.avatar = avatarUrl;

    await Promise.all[(user.save(), deleteFileStorageByUrl(oldAvatar))];

    return res.status(200).json({
      success: true,
      result: { avatar: avatarUrl },
      message: "Successfully update user avatar.",
    });
  },
  deleteAvatar: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.userId, {
      avatar: "",
    });

    await deleteFileStorageByUrl(user.avatar);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete user avatar.",
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
    await admin.auth().updateUser(user.uid, { emailVerified: true });

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully verify email.",
    });
  },
};

module.exports = userController;
