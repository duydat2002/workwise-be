const express = require("express");
const attachmentController = require("@/controllers/Attachment");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.post("/tasks/:taskId", verifyToken, upload.any("files"), handleErrors(attachmentController.addTaskAttachment));
router.patch("/:attachmentId", verifyToken, handleErrors(attachmentController.updateTaskAttachment));
router.delete("/:attachmentId", verifyToken, handleErrors(attachmentController.deleteTaskAttachment));

module.exports = router;
