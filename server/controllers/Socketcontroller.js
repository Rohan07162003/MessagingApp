const redisClient = require('../redis')

module.exports.authorizeUser = async (socket, next) => {
    if (!socket.request.session || !socket.request.session.user) {
      console.log("Bad request!");
      next(new Error("Not authorized"));
    } else {
        socket.user = {...socket.request.session.user};
        await redisClient.hset(`userid:${socket.user.username}`, "userid",socket.user.userid);
        const friendsList = await redisClient.lrange(`friends:${socket.user.username}`,0,-1);
        console.log("Friends list:",friendsList);
        socket.emit("friends",friendsList);
        console.log("USERID:",socket.user.userid);
        console.log(socket.request.session.user.username);
        next();
    }
  };

  module.exports.addFriend = async (friendName, cb,socket) => {
    console.log(`Attempting to add friend: ${friendName}`);
    
    // Check if friendName is the same as the user's username
    if (friendName === socket.user.username) {
        cb({ done: false, errorMsg: "Cannot add yourself as a friend!" });
        return;
    }

    // Fetch the friend's user ID from Redis
    const friendUserID = await redisClient.hget(`userid:${friendName}`, "userid");

    const currentFriendslist = await redisClient.lrange(`friends:${socket.user.username}`, 0,-1);
    
    // If the friend's user ID is not found, return an error
    if (!friendUserID) {
        console.log(`No user found with the username: ${friendName}`);
        cb({ done: false, errorMsg: "No such user found!" });
        return;
    }

    // If the friend's user ID is found, proceed with adding the friend
    console.log(`Friend's user ID found: ${friendUserID}`);
    // Add your logic to add the friend here
    if(currentFriendslist && currentFriendslist.indexOf(friendName) !== -1){
        cb({ done: false, errorMsg: "User is already your friend!" });
        return;
    }
    console.log(currentFriendslist.indexOf(friendName));
    await redisClient.lpush(`friends:${socket.user.username}`, friendName);
    cb({done: true});
};