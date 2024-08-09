const { deleteFolderStorage } = require("@/handlers/firebaseUpload");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const ApprovalSchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "_id uid fullname email avatar",
        maxDepth: 1,
      },
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    feedback: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Approval status must be in ['pending', 'approved', 'rejected']",
      },
      default: "pending",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
        autopopulate: {
          maxDepth: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

ApprovalSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const Task = mongoose.model("Task");
  const Approval = mongoose.model("Approval");
  const Notification = mongoose.model("Notification");

  const deletedApproval = await Approval.findOne(this.getFilter()).lean();
  if (!deletedApproval) next();

  const task = await Task.findById(deletedApproval.task);

  console.log(`projects/${task.project.id}/tasks/${task.id}/approvals/${deletedApproval._id}`);

  await Notification.deleteMany({ "datas.approval.id": deletedApproval._id });
  await deleteFolderStorage(`projects/${task.project.id}/tasks/${task.id}/approvals/${deletedApproval._id}`);

  next();
});

ApprovalSchema.plugin(autopopulate);

const Approval = mongoose.model("Approval", ApprovalSchema);

module.exports = Approval;
