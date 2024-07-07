const Project = require("@/models/project");
const User = require("@/models/user");
const TaskGroup = require("@/models/taskGroup");
const Task = require("@/models/task");
const Activity = require("@/models/activity");
const { singleUpload, multipleUpload } = require("@/handlers/firebaseUpload");

const checkMemberIsAdmin = (project, userId) => {
  return !!project.members.find((m) => m.user._id == userId && m.role == "admin");
};

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
    const project = await Project.findById(req.params.projectId);

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
      members: [{ user: req.userId, role: "admin" }],
      startDate,
      dueDate,
      background: backgroundUrl,
      createdBy: req.userId,
    }).save();

    return res.status(200).json({
      success: true,
      result: { project },
      message: "Successfully create project.",
    });
  },
  updateProject: async (req, res) => {
    let { name, description, labels, startDate, dueDate, backgroundUrl } = req.body;
    const background = req.file;
    const cac = req.userId;

    if (!backgroundUrl && background) {
      backgroundUrl = await singleUpload(background, `background`);
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    if (!checkMemberIsAdmin(project, req.userId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User does not have permissions to perform this action.",
      });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (labels) project.labels = JSON.parse(labels);
    if (startDate) project.startDate = startDate;
    if (backgroundUrl) project.background = backgroundUrl;

    await project.save();

    return res.status(200).json({
      success: true,
      result: { project },
      message: "Successfully update project.",
    });
  },
  archiveProject: async (req, res) => {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    if (!checkMemberIsAdmin(project, req.userId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User does not have permissions to perform this action.",
      });
    }

    project.status = "archived";

    await project.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully archive project.",
    });
  },
  unarchiveProject: async (req, res) => {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    if (!checkMemberIsAdmin(project, req.userId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User does not have permissions to perform this action.",
      });
    }

    project.status = "active";

    await project.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully unarchive project.",
    });
  },
  deleteProject: async (req, res) => {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    if (!checkMemberIsAdmin(project, req.userId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User does not have permissions to perform this action.",
      });
    }

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete project.",
    });
  },
};

module.exports = projectController;
