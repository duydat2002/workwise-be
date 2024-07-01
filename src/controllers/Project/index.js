const Project = require("@/models/project");
const User = require("@/models/user");
const { singleUpload, multipleUpload } = require("@/handlers/firebaseUpload");

const projectController = {
  createProject: async (req, res) => {
    const { name, description, labels, members, startDate, dueDate } = req.body;
    const background = req.file;

    if (!name) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Thiếu thông tin.",
      });
    }

    const backgroundUrl = await singleUpload(background, `background`);

    const project = await new Project({
      name,
      description,
      labels,
      members: JSON.parse(members),
      startDate,
      dueDate,
      background: backgroundUrl,
      createdBy: req.userId,
    }).save();

    return res.status(200).json({
      success: true,
      result: { project },
    });
  },
  createProjectLabel: async (req, res) => {
    const { label } = req.body;

    const user = await User.findById(req.userId);

    user.projectLabels.push(label);

    await user.save();

    return res.status(200).json({
      success: true,
      result: { projectLabels: user.projectLabels },
    });
  },
};

module.exports = projectController;
