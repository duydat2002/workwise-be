const express = require("express");
const userController = require("@/controllers/User");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");
const { upload } = require("@/handlers/firebaseUpload");

const router = express.Router();

router.get("/get", verifyToken, handleErrors(userController.getUser));
router.get("/find-by-uid", handleErrors(userController.findUserByUid));
router.get("/find-by-email", handleErrors(userController.findUsersByEmail));
router.get("/find-by-name-or-email", handleErrors(userController.findUsersByNameOrEmail));
router.post("/create", handleErrors(userController.createUser));
router.patch("/update-info", verifyToken, handleErrors(userController.updateUserInfo));
router.patch("/update-avatar", verifyToken, upload.single("avatar"), handleErrors(userController.updateAvatar));
router.delete("/delete-avatar", verifyToken, handleErrors(userController.deleteAvatar));
router.post("/verify-email", verifyToken, handleErrors(userController.verifyEmail));

//Project Members
router.post("/accept-join-project", verifyToken, handleErrors(userController.acceptInviteProject));
router.post("/unaccept-join-project", verifyToken, handleErrors(userController.unacceptInviteProject));
router.post("/leave-project", verifyToken, handleErrors(userController.leaveProject));

//User ProjectLabels
router.get("/created-labels", verifyToken, handleErrors(userController.getUserProjectLabels));
router.post("/created-labels", verifyToken, handleErrors(userController.createUserProjectLabel));
router.patch("/created-labels/:labelId", verifyToken, handleErrors(userController.updateUserProjectLabel));
router.delete("/created-labels/:labelId", verifyToken, handleErrors(userController.deleteUserProjectLabel));

//Notifications
router.get("/notifications", verifyToken, handleErrors(userController.getNotifications));
router.post("/notifications/read-all", verifyToken, handleErrors(userController.readAllNotification));
router.post("/notifications/:notificationId/read", verifyToken, handleErrors(userController.readNotification));
router.post("/notifications/:notificationId/unread", verifyToken, handleErrors(userController.unreadNotification));

module.exports = router;
