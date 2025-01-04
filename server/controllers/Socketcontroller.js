const redisClient = require('../redis');
const { connect } = require('../routers/Authrouter');

module.exports.authorizeUser = async (socket, next) => {
    if (!socket.request.session || !socket.request.session.user) {
      console.log("Bad request!");
      next(new Error("Not authorized"));
    } else {
        next();
    }
  };

  module.exports.initializeUser = async (socket) => {
    socket.user = {...socket.request.session.user};
    socket.join(socket.user.userid)
    await redisClient.hset(`userid:${socket.user.username}`, "userid",socket.user.userid,"connected",true);
    // console.log("USERID:",socket.user.userid);
    // console.log(socket.request.session.user.username);
    const friendList = await redisClient.lrange(`friends:${socket.user.username}`,0,-1);
    const parsedFriendList = await parseFriendList(friendList);
    const friendRooms = parsedFriendList.map(friend=>friend.userid);
    console.log(friendRooms);
    if(friendRooms.length>0)socket.to(friendRooms).emit("connected",true,socket.user.username);
    console.log(`${socket.user.username} friends:`,parsedFriendList);
    socket.emit("friends",parsedFriendList);
  }

  module.exports.addFriend = async (friendName, cb,socket) => {
    console.log(`Attempting to add friend: ${friendName}`);
    
    // Check if friendName is the same as the user's username
    if (friendName === socket.user.username) {
        cb({ done: false, errorMsg: "Cannot add yourself as a friend!" });
        return;
    }

    // Fetch the friend's details from Redis
    const friend = await redisClient.hgetall(`userid:${friendName}`);

    const currentFriendslist = await redisClient.lrange(`friends:${socket.user.username}`, 0,-1);
    // If the friend's user ID is not found, return an error
    if (!friend || !friend.userid) {
        console.log(`No user found with the username: ${friendName}`);
        cb({ done: false, errorMsg: "No such user found!" });
        return;
    }

    // If the friend's user ID is found, proceed with adding the friend
    console.log(`Friend's user ID found: ${friend.userid}`);
    // Add your logic to add the friend here
    if(currentFriendslist && currentFriendslist.indexOf(friendName) !== -1){
        cb({ done: false, errorMsg: "User is already your friend!" });
        return;
    }
    console.log(currentFriendslist.indexOf(friendName));
    await redisClient.lpush(`friends:${socket.user.username}`, [friendName,friend.userid].join("."));

    const newFriend = {
      username: friendName,
      userid: friend.userid,
      connected: friend.connected
    }
    cb({done: true,newFriend});
};

module.exports.onDisconnect = async (socket) => {
  await redisClient.hset(`userid:${socket.user.username}`, "connected", false);
  const friendList = await redisClient.lrange(`friends:${socket.user.username}`,0,-1);
  //get friends
  const parsedFriendList = await parseFriendList(friendList); 
  const friendRooms = parsedFriendList.map(friend=>friend.userid);
  socket.to(friendRooms).emit("connected",false,socket.user.username);
  //emit to friends that we are offline
}

const parseFriendList = async friendList => {
  const newFriendList = [];
  for (let friend of friendList) {
    const parsedFriend = friend.split(".");
    const friendConnected = await redisClient.hget(
      `userid:${parsedFriend[0]}`,
      "connected"
    );
    newFriendList.push({
      username: parsedFriend[0],
      userid: parsedFriend[1],
      connected: friendConnected,
    });
  }
  return newFriendList;
};