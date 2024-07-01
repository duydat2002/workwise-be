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

    const blob = bucket.file(
      `${destination}/${uuidv4()}.${file.originalname.split(".").reverse()[0]}`
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
      resolve(publicUrl);
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

module.exports = { singleUpload, multipleUpload, upload };
