const handleErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch((error) => {
      // Cast error
      if (error.name == "CastError") {
        return res.status(400).json({
          success: false,
          result: null,
          message: "Id is invalid.",
          keyValue: "id",
          error: error,
        });
      }

      // Custom error
      if (error.name == "MyError") {
        return res.status(400).json({
          success: false,
          result: null,
          message: error.message,
          error: error,
          keyValue: error.keyValue,
        });
      }

      //Validation error
      if (error.name == "ValidationError") {
        const keyValue = Object.keys(error.errors);
        const messages = Object.values(error.errors).map((err) => ({
          name: err.path,
          message: err.name == "CastError" ? "Id is invalid." : err.message,
        }));

        return res.status(400).json({
          success: false,
          result: null,
          message: messages,
          keyValue,
          error: error,
        });
      }

      // Duplicate error
      if (error.code == 11000) {
        const keyValue = Object.keys(error.keyValue || {})[0];
        return res.status(500).json({
          success: false,
          result: null,
          message: `This ${keyValue} already exists.`,
          keyValue,
          error: error,
        });
      }

      console.log(error);
      // Server error
      return res.status(500).json({
        success: false,
        result: null,
        message: "Something went wrong.",
        error: error,
      });
    });
  };
};

const checkFiles = (files, types) => {
  if (!files || files.length == 0)
    return {
      success: false,
      message: "No files found.",
    };

  let isValidType = true;
  files.forEach((file) => {
    if (!types.some((type) => file.mimetype.includes(type))) {
      isValidType = false;
      return;
    }
  });

  if (!isValidType)
    return {
      success: false,
      message: `File must be ${types.join(",")}.`,
    };

  return {
    success: true,
    message: "Check done.",
  };
};

module.exports = {
  handleErrors,
  checkFiles,
};
