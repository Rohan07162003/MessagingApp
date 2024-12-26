const redisClient = require('../redis')

module.exports.authorizeUser = (socket, next) => {
    if (!socket.request.session || !socket.request.session.user) {
      console.log("Bad request!");
      next(new Error("Not authorized"));
    } else {
        socket.user = {...socket.request.session.user};
        redisClient.hset(`userid:${socket.user.username}`, "userid",socket.user.userid);
        console.log("USERID:",socket.user.userid);
        console.log(socket.request.session.user.username);
        next();
    }
  };

 module.exports.addFriend = async (friendName,cb) => {
    console.log(friendName);
    const friendUserID = await redisClient.hget(`userid:${friendName}`,"userid");
    // cb({done: true, errorMsg: "no valid"});
    console.log("cs",friendUserID);
 } 