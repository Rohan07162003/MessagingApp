const redisClient = require("../redis");
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const {upload,cloudinary}= require("../config/Uploadfile.js")
const fs = require("fs");

// BullMQ Queue for story expiry
const storyQueue = new Queue("story-expiry");

module.exports.uploadStory = async (req, res) => {
    const client = await pool.connect();

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const userId = req.session.user.userid;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later

        // Upload media to Cloudinary
        const cloudinaryRes = await cloudinary.uploader.upload(req.file.path, { resource_type: "auto" });
        fs.unlinkSync(req.file.path); // Remove temp file

        await client.query("BEGIN");

        // Insert story into DB
        const { rows } = await client.query(
            "INSERT INTO stories (user_id, media_url, expires_at) VALUES ($1, $2, $3) RETURNING id",
            [userId, cloudinaryRes.secure_url, expiresAt]
        );

        const storyId = rows[0].id;

        // Schedule story deletion with BullMQ
        await storyQueue.add("delete-story", { storyId }, { delay: 60 * 60 * 1000 });

        await client.query("COMMIT");

        res.status(201).json({ success: true, storyId, mediaUrl: cloudinaryRes.secure_url });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error uploading story:", error);
        res.status(500).json({ success: false, message: "Failed to upload story." });
    } finally {
        client.release();
    }
};

// BullMQ Worker to Delete Story
new Worker("story-expiry", async (job) => {
    const { storyId } = job.data;
    await pool.query("DELETE FROM stories WHERE id = $1", [storyId]);
    console.log(`Deleted expired story ID: ${storyId}`);
});

module.exports.trackStoryView = async (req, res) => {
    try {
        const { storyId } = req.params;
        const viewerId = req.session.user.userid;

        // Prevent duplicate views
        await pool.query(
            "INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [storyId, viewerId]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error tracking story view:", error);
        res.status(500).json({ success: false, message: "Failed to track view." });
    }
};
module.exports.likeStory = async (req, res) => {
    const client = await pool.connect();
    try {
        const { storyId } = req.body;
        const userId = req.session.user.userid;

        await client.query("BEGIN");

        // Insert into story_likes
        const result = await client.query(
            "INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id",
            [storyId, userId]
        );

        if (result.rowCount > 0) {
            // Update the like count
            await client.query("UPDATE stories SET likes_count = likes_count + 1 WHERE id = $1", [storyId]);
        }

        await client.query("COMMIT");
        res.status(200).json({ success: true, message: "Story liked!" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error liking story:", error);
        res.status(500).json({ success: false, message: "Failed to like story." });
    } finally {
        client.release();
    }
};
module.exports.unlikeStory = async (req, res) => {
    const client = await pool.connect();
    try {
        const { storyId } = req.body;
        const userId = req.session.user.userid;

        await client.query("BEGIN");

        // Delete from story_likes
        const result = await client.query(
            "DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2 RETURNING id",
            [storyId, userId]
        );

        if (result.rowCount > 0) {
            // Decrement the like count
            await client.query("UPDATE stories SET likes_count = likes_count - 1 WHERE id = $1 AND likes_count > 0", [storyId]);
        }

        await client.query("COMMIT");
        res.status(200).json({ success: true, message: "Story unliked!" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error unliking story:", error);
        res.status(500).json({ success: false, message: "Failed to unlike story." });
    } finally {
        client.release();
    }
};
module.exports.getStoryLikes = async (req, res) => {
    try {
        const { storyId } = req.params;
        const result = await pool.query(
            "SELECT likes_count FROM stories WHERE id = $1",
            [storyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Story not found" });
        }

        res.status(200).json({ success: true, likes: result.rows[0].likes_count });
    } catch (error) {
        console.error("Error fetching story likes:", error);
        res.status(500).json({ success: false, message: "Failed to fetch story likes." });
    }
};
