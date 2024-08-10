const Project = require("@/models/project");
const TaskGroup = require("@/models/taskGroup");
const Task = require("@/models/task");
const Activity = require("@/models/activity");
const { cloneDeep } = require("lodash");

const checkUserIsAdmin = async (projectId, userId) => {
  return true;
  const isAdmin = await Project.findOne({
    _id: projectId,
    isArchived: false,
    members: { $elemMatch: { user: userId, role: "admin", status: "accepted" } },
  });

  return isAdmin;
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

    // const checkExist = await TaskGroup.findOne({ projectId: projectId, name: name });

    // if (checkExist) {
    //   return res.status(400).json({
    //     success: false,
    //     result: null,
    //     message: "Task group already exist in this project.",
    //   });
    // }

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

    const isAdmin = await checkUserIsAdmin(taskGroup.projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    // const checkExist = await TaskGroup.findOne({
    //   _id: { $ne: taskGroupId },
    //   name: name,
    // });

    // if (checkExist) {
    //   return res.status(400).json({
    //     success: false,
    //     result: null,
    //     message: "Task group already exist.",
    //   });
    // }

    const oldTaskGroup = cloneDeep(taskGroup);

    if (name) taskGroup.name = name;
    if (color) taskGroup.color = color;

    await taskGroup.save();
    await new Activity({
      user: req.userId,
      project: taskGroup.projectId,
      type: "update_taskgroup",
      datas: {
        oldTaskGroup: oldTaskGroup,
        newTaskGroup: taskGroup,
      },
    }).save();

    global.io.to(taskGroup.projectId.toString()).emit("taskgroup:updated", taskGroup);

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

    if (!project) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project.",
      });
    }

    global.io.to(projectId).except(req.userId).emit("taskgroup:ordered", projectId, project.taskGroups);

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

    const isAdmin = await checkUserIsAdmin(taskGroup.projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    taskGroup.isArchived = true;

    await Promise.all([
      taskGroup.save(),
      Task.updateMany({ project: taskGroup.projectId, taskGroup: taskGroupId }, { isArchived: true }),
      new Activity({
        user: req.userId,
        project: taskGroup.projectId,
        type: "archive_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    global.io.to(taskGroup.projectId.toString()).emit("taskgroup:updated", taskGroup);

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

    const isAdmin = await checkUserIsAdmin(taskGroup.projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    taskGroup.isArchived = false;

    await Promise.all([
      taskGroup.save(),
      Task.updateMany({ project: taskGroup.projectId, taskGroup: taskGroupId }, { isArchived: false }),
      new Activity({
        user: req.userId,
        project: taskGroup.projectId,
        type: "unarchive_taskgroup",
        datas: {
          taskGroup: taskGroup,
        },
      }).save(),
    ]);

    const newTaskGroup = await TaskGroup.findById(taskGroupId);

    global.io.to(taskGroup.projectId.toString()).emit("taskgroup:updated", newTaskGroup);

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

    const isAdmin = await checkUserIsAdmin(taskGroup.projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    await new Activity({
      user: req.userId,
      project: taskGroup.projectId,
      type: "remove_taskgroup",
      datas: {
        taskGroup: taskGroup,
      },
    }).save();
    await taskGroup.deleteOne();

    global.io.to(taskGroup.projectId.toString()).emit("taskgroup:deleted", taskGroup.projectId, taskGroupId);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete taskGroup.",
    });
  },
};

module.exports = taskGroupController;
