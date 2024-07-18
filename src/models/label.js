const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const { Schema, Types } = mongoose;

const LabelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  ownerType: {
    type: String,
    enum: {
      values: ["User", "Project"],
      message: "Owner Type must be in ['User', 'Project']",
    },
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "ownerType",
  },
});

LabelSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const User = mongoose.model("User");
  const Project = mongoose.model("Project");

  const deletedLabel = await Label.findOne(this.getFilter()).lean();

  if (!deletedLabel) next();

  if (deletedLabel.ownerType == "User") {
    await Promise.all([
      User.updateOne({ _id: deletedLabel.ownerId }, { $pull: { createdProjectLabels: deletedLabel._id } }),
      Project.updateMany(
        { labels: { $elemMatch: { $eq: deletedLabel._id } } },
        { $pull: { labels: deletedLabel._id } }
      ),
    ]);
  } else if (deletedLabel.ownerType == "Project") {
    await Project.updateMany({ _id: deletedLabel.ownerId }, { $pull: { createdTaskLabels: deletedLabel._id } });
  }

  next();
});

LabelSchema.plugin(autopopulate);

const Label = mongoose.model("Label", LabelSchema);

module.exports = Label;
