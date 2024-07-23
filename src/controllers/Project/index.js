const Project = require("@/models/project");
const User = require("@/models/user");
const TaskGroup = require("@/models/taskGroup");
const Task = require("@/models/task");
const Label = require("@/models/label");
const Activity = require("@/models/activity");
const Notification = require("@/models/notification");
const { singleUpload, multipleUpload } = require("@/handlers/firebaseUpload");

const projectController = {
  getProjects: async (req, res) => {
    const projects = await Project.find({ "members.user": req.userId });

    return res.status(200).json({
      success: true,
      result: { projects },
      message: "Successfully get projects.",
    });
  },
  getProjectById: async (req, res) => {
    const project = await Project.findOne({ _id: req.params.projectId, isArchived: false });

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    return res.status(200).json({
      success: true,
      result: { project },
      message: "Successfully get project by id.",
    });
  },
  createProject: async (req, res) => {
    let { name, description, labels, startDate, dueDate, backgroundUrl } = req.body;
    const background = req.file;

    if (!name && !backgroundUrl && !background) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Missing information.",
      });
    }

    if (!backgroundUrl) {
      backgroundUrl = await singleUpload(background, `background`);
    }

    const project = await new Project({
      name,
      description,
      labels: labels ? JSON.parse(labels) : undefined,
      members: [{ user: req.userId, role: "admin", status: "accepted" }],
      startDate,
      dueDate,
      background: backgroundUrl,
      createdBy: req.userId,
    }).save();

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { projects: project._id },
    });

    return res.status(200).json({
      success: true,
      result: { project },
      message: "Successfully create project.",
    });
  },
  updateProject: async (req, res) => {
    const projectId = req.params.projectId;
    let { name, description, labels, startDate, dueDate, backgroundUrl } = req.body;
    const background = req.file;

    if (!backgroundUrl && background) {
      backgroundUrl = await singleUpload(background, `background`);
    }

    const oldProject = await Project.findOne({
      _id: projectId,
      isArchived: false,
      members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
    });

    if (!oldProject) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const project = await Project.findByIdAndUpdate(
      oldProject._id,
      {
        name,
        description,
        labels: labels ? JSON.parse(labels) : undefined,
        startDate,
        dueDate,
        background: backgroundUrl,
      },
      { new: true }
    );

    await new Activity({
      user: req.userId,
      project: projectId,
      type: "update_project",
      datas: {
        oldProject: oldProject,
        newProject: project,
      },
    }).save();

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update project.",
    });
  },
  archiveProject: async (req, res) => {
    const projectId = req.params.projectId;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
      },
      {
        isArchived: true,
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

    await Promise.all([
      // TaskGroup.updateMany({ projectId: projectId }, { isArchived: true }),
      // Task.updateMany({ projectId: projectId }, { isArchived: true }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "archive_project",
      }).save(),
    ]);

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully archive project.",
    });
  },
  unarchiveProject: async (req, res) => {
    const projectId = req.params.projectId;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
      },
      {
        isArchived: false,
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

    await Promise.all([
      // TaskGroup.updateMany({ projectId: projectId }, { isArchived: false }),
      // Task.updateMany({ projectId: projectId }, { isArchived: false }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "unarchive_project",
      }).save(),
    ]);

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully unarchive project.",
    });
  },
  deleteProject: async (req, res) => {
    const projectId = req.params.projectId;

    const project = await Project.findOneAndDelete({
      _id: projectId,
      members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
    });

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    global.io.to(projectId).emit("project:deleted", projectId);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete project.",
    });
  },

  // Project members
  inviteProjectMember: async (req, res) => {
    const projectId = req.params.projectId;
    const { members, role } = req.body;

    const newMembers = members.map((member) => ({
      user: member,
      role: role,
      status: "pending",
    }));

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isArchived: false,
        members: {
          $elemMatch: { user: req.userId, role: "admin", status: "accepted" },
        },
      },
      {
        $addToSet: { members: { $each: newMembers } },
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

    const notification = await new Notification({
      sender: req.userId,
      receivers: members,
      type: "invitation",
      action: "invite_to_project",
      datas: {
        project,
      },
    }).save();

    global.io.to(members).emit("notification:new-notification", notification);
    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: { members: project.members },
      message: "Successfully invite members to project.",
    });
  },
  changeProjectMemberRole: async (req, res) => {
    const projectId = req.params.projectId;
    const { member, role } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      isArchived: false,
      members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
      "members.user": member,
    });

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const checkAtLeastOneAdmin = project.members.filter((m) => m.role == "admin" && m.status == "accepted").length > 1;

    if (role == "admin" || (role == "member" && checkAtLeastOneAdmin)) {
      project.members.find((m) => m.user.id == member).role = role;
      await project.save();
    }

    global.io.to(projectId).emit("project:updated", project);

    const memberInfo = await User.findById(member);

    new Activity({
      user: req.userId,
      project: projectId,
      type: "change_role_member_project",
      datas: {
        member: { id: member, role: role, fullname: memberInfo.fullname, email: memberInfo.email },
      },
    }).save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully change member role.",
    });
  },
  deleteProjectMember: async (req, res) => {
    const projectId = req.params.projectId;
    const { member } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        isArchived: false,
        members: { $elemMatch: { user: req.userId, role: "admin", status: "accepted" } },
        "members.user": member,
      },
      {
        $pull: {
          members: { user: member },
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

    const userInfo = await User.findByIdAndUpdate(member, { $pull: { projects: projectId } });
    const [_p1, notification] = await Promise.all([
      new Activity({
        user: req.userId,
        project: projectId,
        type: "remove_member_project",
        datas: {
          member: { id: member, fullname: userInfo.fullname, email: userInfo.email },
        },
      }).save(),
      new Notification({
        sender: req.userId,
        receivers: member,
        project: projectId,
        action: "was_kicked_project",
        datas: {
          project,
        },
      }).save(),
    ]);

    global.io.to(member).emit("project:deleted", project.id);
    global.io.to(member).emit("notification:new-notification", notification);
    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: { members: project.members },
      message: "Successfully delete member.",
    });
  },

  // Task labels
  getCreatedTaskLabels: async (req, res) => {
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);

    const createdTaskLabels = project.createdTaskLabels.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    return res.status(200).json({
      success: true,
      result: { createdTaskLabels },
      message: "Successfully get created task labels.",
    });
  },
  createCreatedTaskLabel: async (req, res) => {
    const projectId = req.params.projectId;
    const { name, color } = req.body;

    const checkExist = await Label.findOne({
      ownerId: projectId,
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
      ownerType: "Project",
      ownerId: projectId,
    }).save();

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $addToSet: { createdTaskLabels: newLabel.id },
      },
      { new: true }
    );

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: { label: newLabel },
      message: "Successfully create created task label.",
    });
  },
  updateCreatedTaskLabel: async (req, res) => {
    const projectId = req.params.projectId;
    const labelId = req.params.labelId;
    const { name, color } = req.body;

    const checkExist = await Label.findOne({
      _id: { $ne: labelId },
      ownerId: projectId,
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

    const project = await Project.findById(projectId);

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: { label: updatedLabel },
      message: "Successfully update created task label.",
    });
  },
  deleteCreatedTaskLabel: async (req, res) => {
    const projectId = req.params.projectId;
    const labelId = req.params.labelId;

    const label = await Label.findOne({
      _id: labelId,
      ownerId: projectId,
    });

    if (!label) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found this label.",
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $pull: { createdTaskLabels: label.id },
      },
      { new: true }
    );
    await label.deleteOne();

    global.io.to(projectId).emit("project:updated", project);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete created task label.",
    });
  },

  // Project activities
  getProjectActivities: async (req, res) => {
    const projectId = req.params.projectId;

    const project = await Project.findOne({
      _id: projectId,
      isArchived: false,
      members: {
        $elemMatch: { user: req.userId, status: "accepted" },
      },
    });

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const activities = await Activity.find({ project: projectId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      result: { activities },
      message: "Successfully get project activities.",
    });
  },
};

module.exports = projectController;
