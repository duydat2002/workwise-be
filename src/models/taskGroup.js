const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema } = mongoose;

const TaskGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        autopopulate: {
          maxDepth: 4,
        },
      },
    ],
  },
  { timestamps: true }
);

TaskGroupSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const Project = mongoose.model("Project");
  const Task = mongoose.model("Task");

  const deletedTaskGroup = await TaskGroup.findOne(this.getFilter()).lean();
  if (!deletedTaskGroup) next();

  await Promise.all([
    Project.updateOne({ _id: deletedTaskGroup.projectId }, { $pull: { taskGroups: deletedTaskGroup._id } }),
    Task.deleteMany({ taskGroup: deletedTaskGroup._id }),
  ]);

  next();
});

TaskGroupSchema.plugin(autopopulate);

const TaskGroup = mongoose.model("TaskGroup", TaskGroupSchema);

module.exports = TaskGroup;
