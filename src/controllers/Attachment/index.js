const Project = require("@/models/project");
const User = require("@/models/user");
const Task = require("@/models/task");
const Approval = require("@/models/approval");
const Activity = require("@/models/activity");
const Attachment = require("@/models/attachment");
const { multipleUpload, deleteFileStorageByUrl } = require("@/handlers/firebaseUpload");
const { checkFilesType, checkFilesSize } = require("@/utils");

const attachmentController = {
  addTaskAttachment: async (req, res) => {
    const taskId = req.params.taskId;
    const files = req.files;

    const task = await Task.findById(taskId);
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });

    const checkFileSize = checkFilesSize(files, 10 * 1024 * 1024);
    if (!checkFileSize.success) {
      return res.status(400).json({
        success: false,
        result: null,
        message: checkFileSize.message,
      });
    }

    const results = await multipleUpload(files, `projects/${task.project.id}/tasks/${taskId}/attachments`);

    const attachmentsPromise = results.map(async (result) => {
      return await new Attachment({
        createdBy: req.userId,
        task: taskId,
        name: result.name,
        minetype: result.minetype,
        url: result.url,
      }).save();
    });

    const attachments = await Promise.all(attachmentsPromise);
    task.attachments.unshift(...attachments.map((a) => a.id));
    await task.save();

    const activities = attachments.map(async (attachment) => {
      return await new Activity({
        user: req.userId,
        project: task.project.id,
        task: taskId,
        type: "add_attachment_task",
        datas: { attachment },
      }).save();
    });

    await Promise.all(activities);

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: { attachments },
      message: "Successfully add task attachments.",
    });
  },
  updateTaskAttachment: async (req, res) => {
    const attachmentId = req.params.attachmentId;
    const { name } = req.body;

    const attachment = await Attachment.findOneAndUpdate(
      { _id: commentId, createdBy: req.userId },
      {
        name: name,
      }
    );

    if (!attachment)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found attachment or you do not have permission to perform this action.",
      });

    const task = await Task.findById(attachment.task);

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update attachment.",
    });
  },
  deleteTaskAttachment: async (req, res) => {
    const attachmentId = req.params.attachmentId;

    const attachment = await Attachment.findOne({ _id: attachmentId });
    if (!attachment)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found attachment.",
      });

    const task = await Task.findById(attachment.task);
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });

    const checkPermission =
      attachment.createdBy == req.userId ||
      task.project.members.map((m) => m.user.id == req.userId && m.role == "admin" && m.status == "accepted");
    if (!checkPermission)
      return res.status(400).json({
        success: false,
        result: null,
        message: "You do not have permission to perform this action.",
      });

    task.attachments = task.attachments.filter((a) => a.id != attachmentId);
    const urlAttachment = attachment.url;

    await Promise.all([task.save(), attachment.deleteOne()]);

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete attachment.",
    });
  },
};

module.exports = attachmentController;
