const User = require("@/models/user");
const Project = require("@/models/project");
const Label = require("@/models/label");
const Activity = require("@/models/activity");
const Notification = require("@/models/notification");
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
  findUsersByNameOrEmail: async (req, res) => {
    const { search } = req.query;

    const users = await User.find({
      $or: [{ fullname: { $regex: search, $options: "mi" } }, { email: { $regex: search, $options: "mi" } }],
      emailVerified: true,
    });

    return res.status(200).json({
      success: true,
      result: { users },
      message: "Successfully find users by fullname and email.",
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

    let avatarUrl = await singleUpload(req.file, `users/${req.userId}/avatar`);
    avatarUrl = avatarUrl.url;

    const user = await User.findById(req.userId);

    const oldAvatar = user.avatar;
    user.avatar = avatarUrl;

    await Promise.all[(user.save(), deleteFileStorageByUrl(oldAvatar))];

    const projects = await Project.find({ members: { $elemMatch: { user: req.userId } } }).distinct("id");

    global.io.to(projects).emit("user:updated", user);

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

    const projects = await Project.find({ members: { $elemMatch: { user: req.userId } } }).distinct("id");

    global.io.to(projects).emit("user:updated", user);

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

  //Project members
  acceptInviteProject: async (req, res) => {
    const { projectId, senderId, notificationId } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isArchived: false,
        "members.user": req.userId,
      },
      {
        $set: {
          "members.$.status": "accepted",
        },
      },
      { new: true }
    );

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const receivers = project.members.filter((m) => m.user.id != req.userId).map((m) => m.user.id);

    const [_p1, _p2, updatedNotification, notification] = await Promise.all([
      User.findByIdAndUpdate(req.userId, {
        $addToSet: { projects: project._id },
      }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "member_join_project",
      }).save(),
      Notification.findByIdAndUpdate(
        notificationId,
        { $addToSet: { respondedBy: req.userId, readBy: req.userId } },
        { new: true }
      ),
      new Notification({
        sender: req.userId,
        receivers: receivers,
        project: projectId,
        action: "accept_join_project",
        datas: {
          project,
        },
      }).save(),
    ]);

    global.io.to(req.userId).emit("project:join", project.id);
    global.io.to(req.userId).emit("project:created", project);
    global.io.to(req.userId).emit("notification:updated", updatedNotification);
    global.io.to(projectId).except(req.userId).emit("notification:new-notification", notification);
    global.io.to(projectId).to(req.userId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully accept invite project.",
    });
  },
  unacceptInviteProject: async (req, res) => {
    const { projectId, senderId, notificationId } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isArchived: false,
        "members.user": req.userId,
      },
      {
        $pull: {
          members: { user: req.userId },
        },
      },
      { new: true }
    );

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const [updatedNotification, notification] = await Promise.all([
      Notification.findByIdAndUpdate(
        notificationId,
        { $addToSet: { respondedBy: req.userId }, readBy: req.userId },
        { new: true }
      ),
      new Notification({
        sender: req.userId,
        receivers: [senderId],
        project: projectId,
        action: "unaccept_join_project",
        datas: {
          project,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("project:updated", project);
    global.io.to(req.userId).emit("notification:updated", updatedNotification);
    global.io.to(senderId).emit("notification:new-notification", notification);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully accept invite project.",
    });
  },
  leaveProject: async (req, res) => {
    const { projectId } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isArchived: false,
        "members.user": req.userId,
      },
      {
        $pull: {
          members: { user: req.userId },
        },
      },
      { new: true }
    );

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const receivers = project.members.filter((m) => m.role == "admin" && m.user.id != req.userId).map((m) => m.user.id);

    const [_p1, _p2, notification] = await Promise.all([
      User.findByIdAndUpdate(req.userId, { $pull: { projects: project._id } }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "member_left_project",
      }).save(),
      new Notification({
        sender: req.userId,
        receivers: receivers,
        project: projectId,
        action: "left_project",
        datas: {
          project,
        },
      }).save(),
    ]);

    global.io.to(req.userId).emit("project:deleted", project.id);
    global.io.to(projectId).except(req.userId).emit("notification:new-notification", notification);
    global.io.to(projectId).except(req.userId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully leaving project.",
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
      ownerType: "User",
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

  //Notification
  getNotifications: async (req, res) => {
    const notifications = await Notification.find({ receivers: req.userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      result: { notifications },
      message: "Successfully get user notifications.",
    });
  },
  readAllNotification: async (req, res) => {
    const notifications = await Notification.updateMany(
      {
        receivers: req.userId,
      },
      {
        $addToSet: { readBy: req.userId },
      }
    );

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully read all notification.",
    });
  },
  readNotification: async (req, res) => {
    const notificationId = req.params.notificationId;
    const notification = await Notification.findByIdAndUpdate(notificationId, {
      $addToSet: { readBy: req.userId },
    });

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully read notification.",
    });
  },
  unreadNotification: async (req, res) => {
    const notificationId = req.params.notificationId;
    const notification = await Notification.findByIdAndUpdate(notificationId, {
      $pull: { readBy: req.userId },
    });

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully unread notifications.",
    });
  },
};

module.exports = userController;
