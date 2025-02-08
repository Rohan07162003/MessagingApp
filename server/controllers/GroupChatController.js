const redisClient = require("../redis");
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

module.exports.createGroup = async (res,req) => {
    try {
        const {groupName,members}= req.body;
        const groupId = uuidv4();
        const createdBy = req.session.user.userid;
        const existingGroup = await pool.query(
            "SELECT * FROM group_chat WHERE name = $1",
            [groupName]
        );

        if (existingGroup.rows.length > 0) {
            socket.emit("error", { message: "Group name already exists." });
            return;
        }
        await pool.query(
            "INSERT INTO group_chat(id, name, created_by) VALUES($1, $2, $3)",
            [groupId, groupName, createdBy]
        );

        // Insert group creator into group_members table
        await pool.query(
            "INSERT INTO group_members(group_id, user_id, role) VALUES($1, $2, 'admin')",
            [groupId, createdBy]
        );
        // Here, we add each selected member to the group
        for (let memberId of members) {
            // Ensure you don’t insert the creator again
            if (memberId !== createdBy) {
                await pool.query(
                    "INSERT INTO group_members(group_id, user_id, role) VALUES($1, $2, 'member')",
                    [groupId, memberId]
                );
            }
        }
        res.json({ success: true, groupId });
        // Emit event to notify client
        socket.emit("groupCreated", { groupId, groupName });
    } catch (error) {
        console.error("Error creating group:", error);
        res.json({status:"Failed to create group. Try again later."});
        socket.emit("error", { message: "Failed to create group. Try again later." });
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

module.exports.sendMessage = async (socket, message) => {
    const { groupId, content } = message;
    const fromUserId = socket.user.userid;
    const timestamp = Date.now();
    const messageId = uuidv4();
    
    const newMessage = { messageId, groupId, fromUserId, content, timestamp };
    await redisClient.lpush(`group_messages:${groupId}`, JSON.stringify(newMessage));
    await redisClient.ltrim(`group_messages:${groupId}`, 0, 99);
    
    await pool.query(
        "INSERT INTO group_messages(id, group_id, from_user_id, content, timestamp) VALUES($1, $2, $3, $4, to_timestamp($5 / 1000.0))",
        [messageId, groupId, fromUserId, content, timestamp]
    );
    
    socket.to(groupId).emit("groupMessage", newMessage);
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
    socket.emit("loadGroupMessages", { groupId, messages });
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
