const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const admin = require("@/configs/firebase-admin");

const upload = multer({ storage: multer.memoryStorage() });
const bucket = admin.storage().bucket();

const singleUpload = async (file, destination) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    let originalname = decodeURIComponent(file.originalname);

    const blob = bucket.file(
      `${destination}/${originalname.split(".")[0]}_${new Date().getTime()}.${originalname.split(".").reverse()[0]}`
    );
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error(err);
      reject(err);
    });

    blobStream.on("finish", async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve({
        name: originalname,
        minetype: file.mimetype,
        url: publicUrl,
      });
    });

    blobStream.end(file.buffer);
  });
};

const multipleUpload = async (files, destination) => {
  const promises = files.map(async (file) => {
    return await singleUpload(file, destination);
  });

  const urls = await Promise.all(promises);

  return urls;
};

const deleteFileStorageByFileName = async (destination, fileName) => {
  try {
    await bucket.file(`${destination}/${fileName}`).delete();
  } catch (error) {
    console.log(error.message);
  }
};

const deleteFileStorageByUrl = async (url) => {
  try {
    const filePath = url.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
    await bucket.file(filePath).delete();
  } catch (error) {
    console.log(error.message);
  }
};

const deleteFolderStorage = async (destination) => {
  try {
    await bucket.deleteFiles({ prefix: destination });
  } catch (error) {
    console.log(error.message);
  }
};

const getFileUrls = async (destination) => {
  try {
    const [files] = await bucket.getFiles({
      prefix: destination,
      // delimiter: "/",
    });

    const imageUrls = [];

    for (const file of files) {
      const [metadata] = await file.getMetadata();

      if (metadata.contentType && metadata.contentType.startsWith("image/")) {
        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        imageUrls.push(publicUrl);
      }
    }

    return imageUrls;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  upload,
  singleUpload,
  multipleUpload,
  deleteFileStorageByFileName,
  deleteFileStorageByUrl,
  deleteFolderStorage,
  getFileUrls,
};
