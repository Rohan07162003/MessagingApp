const express = require("express");
const router = express.Router();
const {createGroup,sendMessage,getMembers, joinGroup} = require("../controllers/GroupChatController.js")
const upload = require("../config/Uploadfile.js").upload;

router.post("/create",createGroup)
router.get("/get-members/:groupId",getMembers)
router.post("/send-message", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(); // Proceed to sendMessage controller if no errors
    });
  }, sendMessage);

module.exports = router;