const express = require("express");
const router = express.Router();
const {uploadStory, trackStoryView} = require("../controllers/StoryController.js");
const upload = require("../config/Uploadfile.js").upload;


router.post("/upload", upload.single("file"), uploadStory);
router.post("/view/:storyId", trackStoryView);

module.exports = router;