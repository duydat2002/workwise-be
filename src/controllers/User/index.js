const User = require("@/models/user");
const Label = require("@/models/label");
const { singleUpload, deleteFileStorageByUrl } = require("@/handlers/firebaseUpload");
const { checkFilesType, checkFilesSize } = require("@/utils");
const admin = require("@/configs/firebase-admin");
const { Types } = require("mongoose");

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
        message: "Missing information.",
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

  //ProjectLabels
  getUserProjectLabels: async (req, res) => {
    const user = await User.findById(req.userId);

    const createdProjectLabels = user.createdProjectLabels.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    return res.status(200).json({
      success: true,
      result: { createdProjectLabels },
      message: "Successfully get user project labels.",
    });
  },
  createUserProjectLabel: async (req, res) => {
    const { name, color } = req.body;

    const checkExist = await Label.findOne({
      ownerId: req.userId,
      name: name,
    });

    if (checkExist) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Label already exist.",
      });
    }

    const newLabel = await new Label({
      name: name,
      color: color,
      ownerType: "user",
      ownerId: req.userId,
    }).save();

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $addToSet: { createdProjectLabels: newLabel.id },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: { label: newLabel },
      message: "Successfully create user project label.",
    });
  },
  updateUserProjectLabel: async (req, res) => {
    const { name, color } = req.body;
    const labelId = req.params.labelId;
    const userId = new Types.ObjectId(req.userId);

    const checkExist = await Label.findOne({
      _id: { $ne: labelId },
      ownerId: userId,
      name: name,
    });

    if (checkExist) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Label already exist.",
      });
    }

    const updatedLabel = await Label.findByIdAndUpdate(
      labelId,
      {
        name: name,
        color: color,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: { label: updatedLabel },
      message: "Successfully update user project label.",
    });
  },
  deleteUserProjectLabel: async (req, res) => {
    const labelId = req.params.labelId;

    const label = await Label.findOneAndDelete({ _id: labelId });

    if (!label) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found this label.",
      });
    }

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete user project label.",
    });
  },
};

module.exports = userController;
