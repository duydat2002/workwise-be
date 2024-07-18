const Project = require("@/models/project");
const TaskGroup = require("@/models/taskGroup");
const Task = require("@/models/task");
const Activity = require("@/models/activity");

const checkUserIsAdmin = async (projectId, userId) => {
  const isAdmin = await Project.findOne({
    _id: projectId,
    isArchived: false,
    members: { $elemMatch: { user: userId, role: "admin", status: "accepted" } },
  });

  if (!isAdmin) {
    return res.status(400).json({
      success: false,
      result: null,
      message: "Cannot found project or you do not have permission to perform this action.",
    });
  }
};

const taskGroupController = {
  getTaskGroups: async (req, res) => {
    const taskGroups = await TaskGroup.find({ projectId: req.params.projectId, isArchived: false });

    return res.status(200).json({
      success: true,
      result: { taskGroups },
      message: "Successfully get taskGroups.",
    });
  },
  createTaskGroups: async (req, res) => {
    const { projectId, name, color } = req.body;

    if (!name && !color && !projectId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Missing information.",
      });
    }

    const checkExist = await TaskGroup.findOne({ projectId: projectId, name: name });

    if (checkExist) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Task group already exist in this project.",
      });
    }

    const taskGroup = await new TaskGroup({
      name,
      color,
      projectId,
      createdBy: req.userId,
    }).save();

    await Promise.all([
      Project.findByIdAndUpdate(projectId, { $addToSet: { taskGroups: taskGroup._id } }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "create_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("taskgroup:created", taskGroup);

    return res.status(200).json({
      success: true,
      result: { taskGroup },
      message: "Successfully create taskGroup.",
    });
  },
  updateTaskGroup: async (req, res) => {
    const taskGroupId = req.params.taskGroupId;
    const { name, color } = req.body;

    const taskGroup = await TaskGroup.findOne({ _id: taskGroupId, isArchived: false });

    if (!taskGroup) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task group.",
      });
    }

    await checkUserIsAdmin(taskGroup.projectId, req.userId);

    const checkExist = await TaskGroup.findOne({
      _id: { $ne: taskGroupId },
      name: name,
    });

    if (checkExist) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Task group already exist.",
      });
    }

    const oldTaskGroup = { ...taskGroup };

    if (name) taskGroup.name = name;
    if (color) taskGroup.color = color;

    await Promise.all([
      taskGroup.save(),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "update_taskgroup",
        datas: {
          oldTaskGroup: oldTaskGroup,
          newTaskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("taskgroup:updated", taskGroup);

    return res.status(200).json({
      success: true,
      result: { taskGroup },
      message: "Successfully update task group.",
    });
  },
  reorderTaskGroup: async (req, res) => {
    const projectId = req.params.projectId;
    const { orders } = req.body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        taskGroups: orders,
      },
      { new: true }
    );

    global.io.to(projectId).emit("taskgroup:ordered", projectId, project.taskGroups);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully reorder taskGroup.",
    });
  },
  archiveTaskGroup: async (req, res) => {
    const taskGroupId = req.params.taskGroupId;

    const taskGroup = await TaskGroup.findById(taskGroupId);

    if (!taskGroup) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task group.",
      });
    }

    await checkUserIsAdmin(taskGroup.projectId, req.userId);

    taskGroup.isArchived = true;

    await Promise.all([
      taskGroup.save(),
      Task.updateMany({ projectId: taskGroup.projectId }, { isArchived: true }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "archive_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("taskgroup:updated", taskGroup);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully archive taskGroup.",
    });
  },
  unarchiveTaskGroup: async (req, res) => {
    const taskGroupId = req.params.taskGroupId;

    const taskGroup = await TaskGroup.findById(taskGroupId);

    if (!taskGroup) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task group.",
      });
    }

    await checkUserIsAdmin(taskGroup.projectId, req.userId);

    taskGroup.isArchived = false;

    await Promise.all([
      taskGroup.save(),
      Task.updateMany({ projectId: taskGroup.projectId }, { isArchived: false }),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "unarchive_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("taskgroup:updated", taskGroup);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully unarchive taskGroup.",
    });
  },
  deleteTaskGroup: async (req, res) => {
    const taskGroupId = req.params.taskGroupId;

    const taskGroup = await TaskGroup.findById(taskGroupId);

    if (!taskGroup) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task group.",
      });
    }

    await checkUserIsAdmin(taskGroup.projectId, req.userId);

    await Promise.all([
      taskGroup.deleteOne(),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "remove_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("taskgroup:deleted", taskGroup);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete taskGroup.",
    });
  },
};

module.exports = taskGroupController;
