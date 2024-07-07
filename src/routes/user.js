const express = require("express");
const userController = require("@/controllers/User");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/get", verifyToken, handleErrors(userController.getUser));
router.get("/find-by-uid", handleErrors(userController.findUserByUid));
router.get("/find-by-email", handleErrors(userController.findUsersByEmail));
router.post("/create", handleErrors(userController.createUser));
router.patch("/update-info", verifyToken, handleErrors(userController.updateUserInfo));
router.patch("/update-avatar", verifyToken, upload.single("avatar"), handleErrors(userController.updateAvatar));
router.delete("/delete-avatar", verifyToken, handleErrors(userController.deleteAvatar));
router.post("/verify-email", verifyToken, handleErrors(userController.verifyEmail));

//User ProjectLabels
router.get("/created-labels", verifyToken, handleErrors(userController.getUserProjectLabels));
router.post("/created-labels", verifyToken, handleErrors(userController.createUserProjectLabel));
router.patch("/created-labels/:labelId", verifyToken, handleErrors(userController.updateUserProjectLabel));
router.delete("/created-labels/:labelId", verifyToken, handleErrors(userController.deleteUserProjectLabel));

module.exports = router;
