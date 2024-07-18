const Project = require("@/models/project");
const User = require("@/models/user");
const Task = require("@/models/task");
const TaskGroup = require("@/models/taskGroup");
const Activity = require("@/models/activity");
const Attachment = require("@/models/attachment");
const Approval = require("@/models/approval");
const Comment = require("@/models/comment");
const { singleUpload, multipleUpload } = require("@/handlers/firebaseUpload");

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

const taskController = {
  getTasksByProjectId: async (req, res) => {
    const projectId = req.params.projectId;

    const tasks = await Task.find({ projectId: projectId });

    return res.status(200).json({
      success: true,
      result: { tasks },
      message: "Successfully get tasks.",
    });
  },
  createTask: async (req, res) => {
    const { projectId, taskGroupId, name } = req.body;

    console.log(taskGroupId);

    await checkUserIsAdmin(projectId, req.userId);

    const task = await new Task({
      name,
      projectId,
      taskGroupId,
      createdBy: req.userId,
    }).save();

    await Promise.all([
      TaskGroup.findByIdAndUpdate(taskGroupId, { $addToSet: { tasks: task._id } }),
      new Activity({
        user: req.userId,
        project: projectId,
        task: task._id,
        type: "create_task",
      }).save(),
    ]);

    global.io.to(projectId).emit("task:created", task);

    return res.status(200).json({
      success: true,
      result: { task: null },
      message: "Successfully create tasks.",
    });
  },
  updateTask: async (req, res) => {},
  testActivity: async (req, res) => {
    // const activity = await new Activity({
    //   user: req.userId,
    //   project: "669159743f45d083ae4b24a8",
    //   type: "update_project",
    //   datas: {
    //     a: "aaaa",
    //     b: "bbbb",
    //   },
    // }).save();
    await new Attachment({
      name: "123",
    }).save();
    await new Comment({
      content: "abc",
    }).save();

    await new Approval({
      feekback: "123",
    }).save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully create activity.",
    });
  },
};

module.exports = taskController;
