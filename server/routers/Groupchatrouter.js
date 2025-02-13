const express = require("express");
const router = express.Router();
const validateForm= require("../controllers/validateForm.js")
const {createGroup, joinGroup} = require("../controllers/GroupChatController.js")

router.post("/create",createGroup)

module.exports = router;