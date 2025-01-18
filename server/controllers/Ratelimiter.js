const { response } = require("express");
const redisClient = require("../redis");

module.exports.rateLimiter =
  (secondsLimit, limitAmount) => async (req, res, next) => {
    const ip = req.connection.remoteAddress;
    const currentTime = Date.now();
    const timestampBin = Math.floor(currentTime / 1000); // Round down to nearest second for bin
    
    // Redis hash key for storing the count of requests for this IP
    const requestKey = `rate-limit:${ip}`;
    await redisClient.expire(requestKey, secondsLimit);

    // Use Redis HINCRBY to increment the count of requests for this timestamp bin
    await redisClient.hincrby(requestKey, timestampBin, 1);

    // Determine the window start timestamp (the earliest timestamp in the window)
    const windowStart = Math.floor((currentTime - secondsLimit * 1000) / 1000);

    let totalRequests = 0;
    const timestampBinsInWindow = Array.from({ length: secondsLimit }, (_, i) => windowStart + i);

    // Get the request counts for all bins in the window
    const requestCounts = await redisClient.hmget(requestKey, ...timestampBinsInWindow);

    // Sum the request counts for the timestamp bins within the window
    totalRequests = requestCounts.reduce((sum, count) => sum + (parseInt(count) || 0), 0);

    // Check if the request count exceeds the max requests within the window
    if (totalRequests > limitAmount) {
      console.log("slow down")
      return res.json({
        loggedIn: false,
        status: "Too many requests. Please try again later."
      });
    }
    else next();
  };