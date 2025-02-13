const redisClient = require("../redis");
const { connect } = require("../routers/Authrouter");

module.exports.authorizeUser = async (socket, next) => {
  if (!socket.request.session || !socket.request.session.user) {
    console.log("Bad request!");
    next(new Error("Not authorized"));
  } else {
    next();
  }
};

module.exports.initializeUser = async (socket) => {
  socket.user = { ...socket.request.session.user };
  socket.join(socket.user.userid);
  await redisClient.hset(
    `userid:${socket.user.username}`,
    "userid",
    socket.user.userid,
    "connected",
    true
  );
  // console.log("USERID:",socket.user.userid);
  const friendList = await redisClient.lrange(
    `friends:${socket.user.username}`,
    0,
    -1
  );
  const parsedFriendList = await parseFriendList(friendList);
  const friendRooms = parsedFriendList.map((friend) => friend.userid);
  if (friendRooms.length > 0) {
    socket.to(friendRooms).emit("connected", "true", socket.user.username);
  }
  emitfriends(parsedFriendList, socket);
  emitgroups(socket);
  emitmessages(socket);
  console.log(socket.user)

};

const emitfriends = async (parsedFriendList, socket) => {
  socket.emit("friends", parsedFriendList);
};

const emitgroups = async (socket) => {
  try {
    const userId = socket.user.userid;

    // Get all groups where the user is a member
    const groupKeys = await redisClient.keys("group_members:*");

    const userGroups = [];
    for (const groupKey of groupKeys) {
      const groupId = groupKey.split(":")[1];
      const members = await redisClient.smembers(groupKey);

      if (members.includes(userId)) {
        const groupDetails = await redisClient.hgetall(`group:${groupId}`);
        userGroups.push({
          groupId,
          groupName: groupDetails.name,
          createdBy: groupDetails.createdBy,
          members,
        });
      }
    }

    // Emit the list of groups to the user
    socket.emit("groups", userGroups);
    console.log(`Emitted groups for ${socket.user.username}`, userGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
};

const emitmessages = async (socket) => {
  const msgQuery = await redisClient.lrange(
    `chat:${socket.user.userid}`,
    0,
    -1
  );
  const messages = msgQuery.map((msgStr) => {
    const parsedStr = msgStr.split(".");
    return {
      to: parsedStr[0],
      from: parsedStr[1],
      content: parsedStr[2],
      timestamp: parsedStr[3],
    };
  });
  if (messages && messages.length > 0) socket.emit("messages", messages);
  // console.log(`${socket.user.username} messages:`,messages);
};

module.exports.addFriend = async (friendName, cb, socket) => {
  console.log(`Attempting to add friend: ${friendName}`);

  // Check if friendName is the same as the user's username
  if (friendName === socket.user.username) {
    cb({ done: false, errorMsg: "Cannot add yourself as a friend!" });
    return;
  }

  // Fetch the friend's details from Redis
  const friend = await redisClient.hgetall(`userid:${friendName}`);

  const currentFriendslist = await redisClient.lrange(
    `friends:${socket.user.username}`,
    0,
    -1
  );
  // If the friend's user ID is not found, return an error
  if (!friend || !friend.userid) {
    console.log(`No user found with the username: ${friendName}`);
    cb({ done: false, errorMsg: "No such user found!" });
    return;
  }

  // If the friend's user ID is found, proceed with adding the friend
  console.log(`Friend's user ID found: ${friend.userid}`);
  // Add your logic to add the friend here

  if (
    currentFriendslist &&
    currentFriendslist.indexOf(`${friendName}.${friend.userid}`) !== -1
  ) {
    cb({ done: false, errorMsg: "User is already your friend!" });
    return;
  }
  console.log(currentFriendslist.indexOf(friendName));
  await redisClient.lpush(
    `friends:${socket.user.username}`,
    [friendName, friend.userid].join(".")
  );

  const newFriend = {
    username: friendName,
    userid: friend.userid,
    connected: friend.connected,
  };
  cb({ done: true, newFriend });
};

module.exports.onDisconnect = async (socket) => {
  await redisClient.hset(`userid:${socket.user.username}`, "connected", false);
  const friendList = await redisClient.lrange(
    `friends:${socket.user.username}`,
    0,
    -1
  );
  //get friends
  const parsedFriendList = await parseFriendList(friendList);
  const friendRooms = parsedFriendList.map((friend) => friend.userid);
  socket.to(friendRooms).emit("connected", "false", socket.user.username);
  const lastOnline = new Date().toISOString();

  await redisClient.hset(
    `userid:${socket.user.username}`,
    "lastOnline",
    lastOnline
  );
  socket.to(friendRooms).emit("lastOnline", lastOnline, socket.user.username);
  //emit to friends that we are offline
};

module.exports.dm = async (socket, message) => {
  message.from = socket.user.userid;
  const timestamp = Date.now();
  message.timestamp = timestamp;
  console.log("DM:", message);
  const messagestring = [
    message.to,
    message.from,
    message.content,
    timestamp,
  ].join(".");
  await redisClient.lpush(`chat:${message.from}`, messagestring);
  await redisClient.lpush(`chat:${message.to}`, messagestring);
  socket.to(message.to).emit("dm", message);
};

module.exports.addGroup = async (socket, groupName, selectedFriends, groupId, cb) => {
  try {
      if (!socket.user) {
          console.error("Error: socket.user is undefined!");
          return cb && cb({ done: false, errorMsg: "User not authenticated!" });
      }

      console.log(`Creating group: ${groupName} with ID: ${groupId}`);

      if (!groupName || !selectedFriends.length) {
          return cb && cb({ done: false, errorMsg: "Group name and members are required!" });
      }

      // Ensure creator is included in the group
      const groupMembers = [socket.user.userid, ...selectedFriends];

      // Save group details in Redis (for caching)
      const pipeline = redisClient.multi();
      pipeline.hset(`group:${groupId}`, "name", groupName, "createdBy", socket.user.userid);
      pipeline.sadd(`group_members:${groupId}`, ...groupMembers);
      await pipeline.exec();

      const newGroup = {
          groupId,
          groupName,
          members: groupMembers,
          createdBy: socket.user.userid
      };

      // Emit event to all selected friends
      selectedFriends.forEach((friendId) => {
          socket.to(friendId).emit("new_groups", newGroup);
      });

      cb({ done: true, newGroup });

  } catch (error) {
      console.error("Error creating group:", error);
      cb({ done: false, errorMsg: "Failed to create group. Try again." });
  }
};


const parseFriendList = async (friendList) => {
  const newFriendList = [];
  for (let friend of friendList) {
    const parsedFriend = friend.split(".");
    const friendConnected = await redisClient.hget(
      `userid:${parsedFriend[0]}`,
      "connected"
    );
    const friendlastOnline = await redisClient.hget(
      `userid:${parsedFriend[0]}`,
      "lastOnline"
    );
    newFriendList.push({
      username: parsedFriend[0],
      userid: parsedFriend[1],
      connected: friendConnected,
      lastOnline: friendlastOnline,
    });
  }
  return newFriendList;
};
