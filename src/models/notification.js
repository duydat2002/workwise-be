const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema, Types } = mongoose;

const NotificationSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
    },
    receivers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    type: {
      type: String,
      enum: {
        values: ["normal", "invitation"],
        message: "Notification type must be in ['normal', 'invitation']",
      },
      required: true,
    },
    entityType: {
      type: String,
      enum: {
        values: ["project", "taskgroup", "task"],
        message: "Entity type must be in ['project', 'taskgroup', 'task']",
      },
      required: true,
    },
    entity: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
      autopopulate: {
        maxDepth: 1,
      },
    },
    content: {
      type: String,
      required: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

NotificationSchema.plugin(autopopulate);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
