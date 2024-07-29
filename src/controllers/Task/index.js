const Project = require("@/models/project");
const User = require("@/models/user");
const Task = require("@/models/task");
const TaskGroup = require("@/models/taskGroup");
const Activity = require("@/models/activity");
const Attachment = require("@/models/attachment");
const Approval = require("@/models/approval");
const Comment = require("@/models/comment");
const { singleUpload, multipleUpload } = require("@/handlers/firebaseUpload");
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

const checkUserIsMember = async (projectId, userId) => {
  return true;
  const isMember = await Project.findOne({
    _id: projectId,
    isArchived: false,
    members: { $elemMatch: { user: userId, status: "accepted" } },
  });

  return isMember;
};

const taskController = {
  getTasksByProjectId: async (req, res) => {
    const projectId = req.params.projectId;

    const tasks = await Task.find({ project: projectId });

    return res.status(200).json({
      success: true,
      result: { tasks },
      message: "Successfully get tasks.",
    });
  },
  getTaskById: async (req, res) => {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });
    }

    return res.status(200).json({
      success: true,
      result: { task },
      message: "Successfully get task by id.",
    });
  },
  createTask: async (req, res) => {
    const { projectId, taskGroupId, name } = req.body;

    const isAdmin = await checkUserIsAdmin(projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const task = await new Task({
      name,
      project: projectId,
      taskGroup: taskGroupId,
      createdBy: req.userId,
      description: "",
    }).save();

    const taskGroup = await TaskGroup.findByIdAndUpdate(taskGroupId, { $addToSet: { tasks: task._id } }, { new: true });

    await new Activity({
      user: req.userId,
      project: projectId,
      task: task._id,
      type: "create_task",
      datas: {
        taskGroup: taskGroup,
      },
    }).save();

    global.io.to(projectId).emit("task:created", task);

    return res.status(200).json({
      success: true,
      result: { task: null },
      message: "Successfully create tasks.",
    });
  },
  reorderTask: async (req, res) => {
    const taskId = req.params.taskId;
    let { fromTaskGroupId, toTaskGroupId, orders } = req.body;

    const task = await Task.findByIdAndUpdate(taskId, {
      taskGroup: toTaskGroupId,
    });

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const isAdmin = await checkUserIsAdmin(task.project, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    let fromTaskGroup = null;

    if (fromTaskGroupId != toTaskGroupId) {
      fromTaskGroup = await TaskGroup.findByIdAndUpdate(
        fromTaskGroupId,
        {
          $pull: {
            tasks: taskId,
          },
        },
        { new: true }
      );
    }

    const toTaskGroup = await TaskGroup.findByIdAndUpdate(
      toTaskGroupId,
      {
        tasks: orders,
      },
      { new: true }
    );

    if (!toTaskGroup) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task group.",
      });
    }

    if (fromTaskGroupId != toTaskGroupId) {
      await new Activity({
        user: req.userId,
        project: task.project,
        task: taskId,
        type: "move_task",
        datas: {
          oldTaskGroup: fromTaskGroup,
          newTaskGroup: toTaskGroup,
        },
      }).save();
    }

    global.io.to(task.project.id).except(req.userId).emit("task:ordered", fromTaskGroup, toTaskGroup);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully reorder task.",
    });
  },
  updateTask: async (req, res) => {
    const taskId = req.params.taskId;
    let { name, description, priority, labels, startDate, dueDate, finishDate } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      isArchived: false,
    });

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const isAdmin = await checkUserIsAdmin(task.project.id, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const newTask = await Task.findByIdAndUpdate(
      taskId,
      {
        name,
        description,
        priority,
        labels: labels ? JSON.parse(labels) : undefined,
        startDate,
        dueDate,
        finishDate,
      },
      { new: true }
    );

    await new Activity({
      user: req.userId,
      project: newTask.project,
      task: taskId,
      type: "update_task",
      datas: {
        oldTask: task,
        newTask: newTask,
      },
    }).save();

    global.io.to(newTask.project.id).emit("task:updated", newTask);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update task.",
    });
  },
  changeStatusTask: async (req, res) => {
    const taskId = req.params.taskId;
    let { status } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      isArchived: false,
    });

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const oldTask = cloneDeep(task);

    const isMember = await checkUserIsMember(task.project.id, req.userId);
    if (!isMember) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    task.status = status;
    if (status == "completed") task.finishDate = new Date();
    else task.finishDate = null;
    await task.save();

    await new Activity({
      user: req.userId,
      project: task.project,
      task: taskId,
      type: "update_task",
      datas: {
        oldTask: oldTask,
        newTask: task,
      },
    }).save();

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update task status.",
    });
  },
  assignTask: async (req, res) => {
    const taskId = req.params.taskId;
    let { assignee } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      isArchived: false,
    });

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const oldTask = cloneDeep(task);

    const project = await Project.findById(task.project.id);
    const isAdmin = project.members.some((m) => m.user.id == req.userId && m.role == "admin" && m.status == "accepted");
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    const isMember = project.members.some((m) => m.user.id == assignee && m.status == "accepted");
    if (assignee && !isMember) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found member assign.",
      });
    }

    task.assignee = assignee;
    await task.save();

    const activity = new Activity({
      user: req.userId,
      project: task.project,
      task: taskId,
    });

    if (assignee) {
      activity.type = "assign_task";
      activity.datas = {
        oldAssignee: oldTask.assignee,
        newAssignee: task.assignee,
      };
    } else {
      activity.type = "unassign_task";
      activity.datas = {
        oldAssignee: oldTask.assignee,
        newAssignee: null,
      };
    }

    await activity.save();

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update task status.",
    });
  },
  archiveTask: async (req, res) => {
    const taskId = req.params.taskId;

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        isArchived: true,
      },
      { new: true }
    );

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const isAdmin = await checkUserIsAdmin(task.project.id, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    await new Activity({
      user: req.userId,
      project: task.project,
      task: taskId,
      type: "archive_task",
    }).save();

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully archive task.",
    });
  },
  unarchiveTask: async (req, res) => {
    const taskId = req.params.taskId;

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        isArchived: false,
      },
      { new: true }
    );

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const isAdmin = await checkUserIsAdmin(task.project.id, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    await new Activity({
      user: req.userId,
      project: task.project,
      task: taskId,
      type: "archive_task",
    }).save();

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully unarchive task.",
    });
  },
  deleteTask: async (req, res) => {
    const taskId = req.params.taskId;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const projectId = task.project.id;
    const taskGroupId = task.taskGroup.id;

    const isAdmin = await checkUserIsAdmin(projectId, req.userId);
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found project or you do not have permission to perform this action.",
      });
    }

    await Promise.all([
      task.deleteOne(),
      new Activity({
        user: req.userId,
        project: projectId,
        type: "remove_task",
        datas: {
          task,
        },
      }).save(),
    ]);

    global.io.to(projectId).emit("task:deleted", projectId, taskGroupId, taskId);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete task.",
    });
  },

  // Task Activities
  getTaskActivities: async (req, res) => {
    const taskId = req.params.taskId;
    let { page, pageSize, sortNewest } = req.query;
    page = isNaN(parseInt(page)) ? 1 : parseInt(page);
    pageSize = isNaN(parseInt(pageSize)) ? 10 : parseInt(pageSize);
    const skip = (page - 1) * pageSize;

    const task = await Task.findById(taskId);

    const isMember = task?.project?.members?.some((m) => m.user == req.userId && m.status == "accepted");

    if (!task || !isMember) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });
    }

    const activities = await Activity.find({ task: taskId })
      .sort({ createdAt: sortNewest == "true" ? -1 : 1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      result: { activities, sortNewest: sortNewest },
      message: "Successfully get task activities.",
    });
  },
};

module.exports = taskController;
