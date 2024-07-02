const checkFilesType = (files, types) => {
  if (!files || files.length == 0)
    return {
      success: false,
      message: "Không tìm thấy file nào.",
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
      message: `Các file phải là ${types.join(",")}.`,
    };

  return {
    success: true,
    message: "Thành công.",
  };
};

const checkFilesSize = (files, maxSize) => {
  if (!files || files.length == 0)
    return {
      success: false,
      message: "Không tìm thấy file nào.",
    };

  let isValidType = true;
  files.forEach((file) => {
    if (file.size > maxSize) {
      isValidType = false;
      return;
    }
  });

  if (!isValidType)
    return {
      success: false,
      message: `Các file phải có kích thước tối đa ${maxSize}kb.`,
    };

  return {
    success: true,
    message: "Thành công.",
  };
};

module.exports = {
  checkFilesType,
  checkFilesSize,
};
