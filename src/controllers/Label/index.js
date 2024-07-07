const Label = require("@/models/label");

const labelController = {
  createLabel: async (req, res) => {
    return res.status(200).json({
      success: true,
      result: {},
      message: "Successfully create project.",
    });
  },
};

module.exports = labelController;
