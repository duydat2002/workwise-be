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
  checkFiles,
};
