const { NOTIFICATION_ACTION } = require("@/constant");
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
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: {
        select: "_id name background",
        maxDepth: 1,
      },
    },
    type: {
      type: String,
      enum: {
        values: ["normal", "invitation"],
        message: "Notification type must be in ['normal', 'invitation']",
      },
      default: "normal",
    },
    datas: {
      type: Map,
      of: Object,
    },
    action: {
      type: String,
      enum: NOTIFICATION_ACTION,
      required: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    respondedBy: [
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
