const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: {
        maxDepth: 1,
      },
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      autopopulate: {
        maxDepth: 1,
      },
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CommentSchema.plugin(autopopulate);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
