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
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

CommentSchema.plugin(autopopulate);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
