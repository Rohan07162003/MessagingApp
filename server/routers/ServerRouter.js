const session = require("express-session")
const Redis = require("ioredis");
const redisClient =require("../redis")
const {RedisStore} = require("connect-redis");
require("dotenv").config();

let redisStore = new RedisStore({
    client: redisClient,
    prefix: "myapp:",
  })

const sessionMiddleware= session({
    secret: process.env.COOKIE_SECRET,
    credentials: true,
    name: "sid",
    store: redisStore,
    resave: false,
    saveUninitialized:false,
    cookie:{
        secure: process.env.NODE_ENV === "production"?"true":"auto",
        httpOnly: true,
        expires: 1000 * 60 * 60 * 24 * 7,
        sameSite: process.env.NODE_ENV === "production"?"none":"lax",

    }
})

const wrap = expressMiddleware => (socket, next) =>
    expressMiddleware(socket.request, {}, next);

const corsConfig = {
    origin: "http://localhost:3000",
    credentials: true,
  };

module.exports = {sessionMiddleware,wrap,corsConfig}