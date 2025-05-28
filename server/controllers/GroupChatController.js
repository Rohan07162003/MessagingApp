const redisClient = require("../redis");
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const {upload,cloudinary}= require("../config/Uploadfile.js")

module.exports.createGroup = async (req, res) => {
    const client = await pool.connect(); // Get DB connection for transaction

    try {
        console.log("Received Body:", req.body);

        const { groupName, members} = req.body;
        const groupId = uuidv4();
        const createdBy = req.session.user.userid;

        console.log("createdBy:", createdBy);

        // Check if group name already exists
        const existingGroup = await pool.query(
            "SELECT id FROM group_chat WHERE name = $1",
            [groupName]
        );

        if (existingGroup.rows.length > 0) {
            // socket.emit("error", { message: "Group name already exists." });
            return res.status(400).json({ success: false, message: "Group name already exists." });
        }

        // Begin transaction
        await client.query("BEGIN");

        // Insert new group
        await client.query(
            "INSERT INTO group_chat(id, name, created_by) VALUES($1, $2, $3)",
            [groupId, groupName, createdBy]
        );

        // Insert group creator as admin
        await client.query(
            "INSERT INTO group_members(group_id, user_id, role) VALUES($1, $2, 'admin')",
            [groupId, createdBy]
        );

        // Add members to the group (excluding creator)
        for (let memberId of members) {
            if (memberId !== createdBy) {
                await client.query(
                    "INSERT INTO group_members(group_id, user_id, role) VALUES($1, $2, 'member')",
                    [groupId, memberId]
                );
            }
        }

        // Commit transaction
        await client.query("COMMIT");

        res.status(201).json({ success: true, groupId });

        // Emit event to notify client
        // socket.emit("groupCreated", { groupId, groupName });

    } catch (error) {
        await client.query("ROLLBACK"); // Rollback transaction on error
        console.error("Error creating group:", error);

        res.status(500).json({ success: false, message: "Failed to create group. Try again later." });

        // socket.emit("error", { message: "Failed to create group. Try again later." });
    } finally {
        client.release(); // Release DB connection
    }
};


module.exports.joinGroup = async (socket, groupId) => {
    try {
        const userId = socket.user.userid;

        // Check if user is already a member
        const memberCheck = await pool.query(
            "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
            [groupId, userId]
        );

        if (memberCheck.rows.length > 0) {
            socket.emit("error", { message: "You are already a member of this group." });
            return;
        }

        // Insert the user into the group_members table
        await pool.query(
            "INSERT INTO group_members(group_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
            [groupId, userId]
        );

        // Join the socket to the group room
        socket.join(groupId);

        // Emit event to notify client
        socket.emit("joinedGroup", { groupId });
    } catch (error) {
        console.error("Error joining group:", error);
        socket.emit("error", { message: "Failed to join group. Try again later." });
    }
};

module.exports.sendMessage = async (req, res) => {
    const client = await pool.connect(); // Get DB connection for transaction

    try {
        const { groupId, content } = req.body;
        const fromUserId = req.session.user.userid;
        const fromUsername = req.session.user.username;
        const timestamp = Date.now();
        let isMedia = false;
        let mediaUrl = content; // Default to content unless it's a media file

        // Begin transaction
        await client.query("BEGIN");

        // Handle media upload if a file is attached
        if (req.file) {
            const cloudinaryRes = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
            });

            mediaUrl = cloudinaryRes.secure_url; // Store Cloudinary URL
            isMedia = true;

            fs.unlinkSync(req.file.path); // Delete temp file
        } else if (content.startsWith("http")) {
            isMedia = true; // If content is already a URL, consider it media
        }

        // Insert message into database and return the generated message ID
        const result = await client.query(
            "INSERT INTO group_messages(group_id, from_user_id, content, is_media, timestamp) VALUES($1, $2, $3, $4, to_timestamp($5 / 1000.0)) RETURNING id",
            [groupId, fromUserId, mediaUrl, isMedia, timestamp]
        );

        const messageId = result.rows[0].id; // Get the auto-generated message ID

        // Commit transaction
        await client.query("COMMIT");

        // Store in Redis (last 100 messages for caching)
        const newMessage = {
            messageId,
            groupId,
            fromUserId,
            fromUsername,
            content: mediaUrl,
            isMedia,
            timestamp,
        };
        await redisClient.lpush(`group_messages:${groupId}`, JSON.stringify(newMessage));
        await redisClient.ltrim(`group_messages:${groupId}`, 0, 99);

        res.status(201).json({ success: true, message: newMessage });

        // Emit real-time message event
        // req.app.get("socketio").to(groupId).emit("groupMessage", newMessage);
    } catch (error) {
        await client.query("ROLLBACK"); // Rollback transaction on error
        console.error("Error sending message:", error);
        res.status(500).json({ success: false, message: "Failed to send message. Try again later." });
    } finally {
        client.release(); // Release DB connection
    }
};


module.exports.loadMessages = async (socket, groupId) => {
    let messages = await redisClient.lrange(`group_messages:${groupId}`, 0, -1);
    messages = messages.map(msg => JSON.parse(msg));
    
    if (messages.length < 100) {
        const offset = messages.length;
        const dbMessages = await pool.query(
            "SELECT id AS messageId, group_id, from_user_id, content, extract(epoch FROM timestamp) * 1000 AS timestamp FROM group_messages WHERE group_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3",
            [groupId, 100 - offset, offset]
        );
        messages = [...messages, ...dbMessages.rows];
    }
    socket.emit("groupMessage", { groupId, messages });
};

module.exports.getMembers = async (req, res) => {
    const { groupId } = req.params;
    try {
      const group_members = await pool.query(
        `SELECT u.username, m.user_id, m.role 
         FROM group_members m 
         INNER JOIN users u ON m.user_id = u.userid 
         WHERE m.group_id = $1`,
        [groupId]
      );
  
      res.status(200).json(group_members.rows);
      console.log(group_members.rows);
    } catch (err) {
      console.error("Error fetching group members:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

module.exports.addReaction = async (socket, reaction) => {
    const { messageId, emoji } = reaction;
    const userId = socket.user.userid;
    await pool.query(
        "INSERT INTO message_reactions(message_id, user_id, emoji) VALUES($1, $2, $3) ON CONFLICT(message_id, user_id) DO UPDATE SET emoji = $3",
        [messageId, userId, emoji]
    );
    socket.to(reaction.groupId).emit("messageReaction", { messageId, userId, emoji });
};
