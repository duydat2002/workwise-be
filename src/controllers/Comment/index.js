const Project = require("@/models/project");
const User = require("@/models/user");
const Task = require("@/models/task");
const Activity = require("@/models/activity");
const Comment = require("@/models/comment");

const commentController = {
  getComments: async (req, res) => {
    const comments = await Comment.find({ task: req.params.taskId });

    return res.status(200).json({
      success: true,
      result: { comments },
      message: "Successfully get comments by task id.",
    });
  },
  commentTask: async (req, res) => {
    const { taskId, content } = req.body;

    const task = await Task.findById(taskId);

    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });

    const comment = await new Comment({
      author: req.userId,
      project: task.project._id,
      task: taskId,
      content: content,
    }).save();

    task.comments.unshift(comment._id);
    await Promise.all([
      task.save(),
      new Activity({
        user: req.userId,
        project: task.project._id,
        task: task._id,
        type: "comment_task",
        datas: {
          comment: comment,
        },
      }).save(),
    ]);

    global.io.to(task.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully comment task.",
    });
  },
  updateComment: async (req, res) => {
    const commentId = req.params.commentId;
    const { content } = req.body;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, author: req.userId },
      {
        content: content,
        isUpdated: true,
      }
    );

    if (!comment)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found comment or you do not have permission to perform this action.",
      });

    const task = await Task.findById(comment.task.id);

    global.io.to(comment.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully update comment.",
    });
  },
  deleteComment: async (req, res) => {
    const commentId = req.params.commentId;
    const { taskId } = req.query;
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $pull: { comments: commentId },
      },
      { new: true }
    );

    if (!task)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found task.",
      });

    const comment = await Comment.findOneAndDelete({ _id: req.params.commentId, author: req.userId });

    if (!comment)
      return res.status(400).json({
        success: false,
        result: null,
        message: "Cannot found comment or you do not have permission to perform this action.",
      });

    global.io.to(comment.project.id).emit("task:updated", task);

    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully delete comment.",
    });
  },
};

module.exports = commentController;
