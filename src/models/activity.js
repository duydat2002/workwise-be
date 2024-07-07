const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema, Types } = mongoose;

const ActivitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    type: {
      type: String,
      enum: {
        values: ["create", "update", "delete", "comment", "upload", "assign", "join", "leave"],
        message:
          "Activity type must be in ['create', 'update', 'delete', 'comment', 'upload', 'assign', 'join', 'leave']",
      },
      required: true,
    },
    entityType: {
      type: String,
      enum: {
        values: ["project", "taskgroup", "task", "user"],
        message: "Entity type must be in ['project', 'taskgroup', 'task',  'user']",
      },
      required: true,
    },
    entity: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
      autopopulate: function (opts) {
        opts.maxDepth = 1;
        if (this.entityType == "user") opts.select = "_id uid fullname email avatar";
        return opts;
      },
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

ActivitySchema.plugin(autopopulate);

const Activity = mongoose.model("Activity", ActivitySchema);

module.exports = Activity;
