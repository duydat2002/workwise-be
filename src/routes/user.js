const express = require("express");
const userController = require("@/controllers/User");
const { verifyToken } = require("@/middlewares/auth");
const { handleErrors } = require("@/handlers/errorHandler");

const router = express.Router();

router.get("/get", verifyToken, handleErrors(userController.getUser));
router.post("/create", handleErrors(userController.createUser));
router.post(
  "/verify-email",
  verifyToken,
  handleErrors(userController.verifyEmail)
);

router.get("/test", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    result: "test",
  });
});

module.exports = router;
