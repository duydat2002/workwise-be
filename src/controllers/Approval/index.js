const Project = require("@/models/project");
const User = require("@/models/user");
const Task = require("@/models/task");
const Approval = require("@/models/approval");
const Activity = require("@/models/activity");
const Attachment = require("@/models/attachment");
const Notification = require("@/models/notification");
const { multipleUpload, deleteFileStorageByUrl } = require("@/handlers/firebaseUpload");
const { checkFilesType, checkFilesSize } = require("@/utils");
const { cloneDeep } = require("lodash");

const approvalController = {
  getTaskApprovals: async (req, res) => {
    const taskId = req.params.taskId;

    const approvals = await Approval.find({ task: taskId });

    return res.status(200).json({
      success: true,
      result: { approvals },
      message: "Successfully add task approvals.",
    });
  },
  createTaskApproval: async (req, res) => {
    const taskId = req.params.taskId;
    const { reviewedBy, description } = req.body;
    const files = req.files;

    const task = await Task.findOne({ _id: taskId, isArchived: false });
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });

    const approval = await new Approval({
      task: taskId,
      requestedBy: req.userId,
      reviewedBy: reviewedBy,
      description: description,
    });

    let attachments = [];
    if (files.length > 0) {
      const checkFileSize = checkFilesSize(files, 10 * 1024 * 1024);
      if (!checkFileSize.success) {
        return res.status(400).json({
          success: false,
          result: null,
          message: checkFileSize.message,
        });
      }

      const results = await multipleUpload(files, `projects/${task.project.id}/tasks/${taskId}`);
      const attachmentsPromise = results.map(async (result) => {
        return await new Attachment({
          createdBy: req.userId,
          task: taskId,
          approval: approval.id,
          name: result.name,
          minetype: result.minetype,
          url: result.url,
        }).save();
      });
      attachments = await Promise.all(attachmentsPromise);
    }

    if (attachments.length > 0) {
      approval.attachments = attachments.map((a) => a.id);
    }

    await approval.save();
    const [_p1, notification] = await Promise.all([
      new Activity({
        user: req.userId,
        project: task.project.id,
        task: taskId,
        type: "create_approval_task",
        datas: { approval },
      }).save(),
      new Notification({
        sender: req.userId,
        receivers: reviewedBy,
        project: task.project.id,
        action: "request_approval",
        datas: {
          task,
          approval,
        },
      }),
    ]);

    global.io.to(reviewedBy).emit("notification:new-notification", notification);

    return res.status(200).json({
      success: true,
      result: { approval },
      message: "Successfully create task approval.",
    });
  },
  updateTaskApproval: async (req, res) => {
    const approvalId = req.params.approvalId;
    const { reviewedBy, description } = req.body;

    const approval = await Approval.findById(approvalId);
    const oldApproval = cloneDeep(approval);

    if (!approval || approval.requestedBy != req.userId)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found approval or you do not have permission to perform this action.",
      });

    const task = await Task.findOne({ _id: approval.task, isArchived: false });
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });

    approval.reviewedBy = reviewedBy;
    approval.description = description;
    await approval.save();

    await new Activity({
      user: req.userId,
      project: task.project.id,
      task: task.id,
      type: "update_approval_task",
      datas: { oldApproval, newApproval: approval },
    }).save();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update approval.",
    });
  },
  deleteTaskApproval: async (req, res) => {
    const approvalId = req.params.approvalId;

    const approval = await Approval.findById(approvalId);
    if (!approval || approval.requestedBy != req.userId)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found approval or you do not have permission to perform this action.",
      });

    const task = await Task.findOne({ _id: approval.task, isArchived: false });
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });

    await new Activity({
      user: req.userId,
      project: task.project.id,
      task: taskId,
      type: "revoked_approval_task",
      datas: { approval },
    }).save();

    await approval.deleteOne();

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete approval.",
    });
  },
  acceptTaskAproval: async (req, res) => {
    const approvalId = req.params.approvalId;
    const { feedback } = req.body;

    const approval = await Approval.findById(approvalId);
    if (!approval || approval.reviewedBy != req.userId)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found approval or you do not have permission to perform this action.",
      });

    const task = await Task.findOne({ _id: approval.task, isArchived: false });
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });

    approval.feedback = feedback;
    approval.status = "approved";
    approval.approvedAt = new Date();

    await approval.save();
    const [_p1, notification] = await Promise.all([
      new Activity({
        user: req.userId,
        project: task.project.id,
        task: task.id,
        type: "accept_approval_task",
        datas: { approval },
      }).save(),
      new Notification({
        sender: req.userId,
        receivers: approval.requestedBy,
        project: task.project.id,
        action: "accept_approval",
        datas: {
          task,
          approval,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully accpet approval.",
    });
  },
  rejectTaskAproval: async (req, res) => {
    const approvalId = req.params.approvalId;
    const { feedback } = req.body;

    const approval = await Approval.findById(approvalId);
    if (!approval || approval.reviewedBy != req.userId)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found approval or you do not have permission to perform this action.",
      });

    const task = await Task.findOne({ _id: approval.task, isArchived: false });
    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task or you do not have permission to perform this action.",
      });

    approval.feedback = feedback;
    approval.status = "rejected";
    approval.approvedAt = new Date();

    await approval.save();
    const [_p1, notification] = await Promise.all([
      new Activity({
        user: req.userId,
        project: task.project.id,
        task: task.id,
        type: "reject_approval_task",
        datas: { approval },
      }).save(),
      new Notification({
        sender: req.userId,
        receivers: approval.requestedBy,
        project: task.project.id,
        action: "reject_approval",
        datas: {
          task,
          approval,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully reject approval.",
    });
  },
};

module.exports = approvalController;
