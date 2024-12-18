const express = require("express");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");
const authRouter = require("./routers/Authrouter.js");
const session = require("express-session")
const Redis = require("ioredis");
const {RedisStore} = require("connect-redis");

require("dotenv").config();


const app = express();
const server = require("http").createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    }
});

const redisClient =require("./redis.js")
let redisStore = new RedisStore({
    client: redisClient,
    prefix: "myapp:",
  })


app.use(helmet());
app.use(express.json());
app.use(session({
    secret: process.env.COOKIE_SECRET,
    credentials: true,
    name: "sid",
    store: redisStore,
    resave: false,
    saveUninitialized:false,
    cookie:{
        secure: process.env.ENVIRONMENT === "production"?"true":"auto",
        httpOnly: true,
        expires: 1000 * 60 * 60 * 24 * 7,
        sameSite: process.env.ENVIRONMENT === "production"?"none":"lax",

    }
}))

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));

// Add a middleware to set the necessary headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use("/auth", authRouter);

io.on("connect", (socket) => {
    console.log('New client connected');
});

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});
//C:\Program Files\PostgreSQL\17
//5432



// Installation Directory: C:\Program Files\PostgreSQL\17
// Server Installation Directory: C:\Program Files\PostgreSQL\17
// Data Directory: C:\Program Files\PostgreSQL\17\data
// Database Port: 5432
// Database Superuser: postgres
// Operating System Account: NT AUTHORITY\NetworkService
// Database Service: postgresql-x64-17
// Command Line Tools Installation Directory: C:\Program Files\PostgreSQL\17
// pgAdmin4 Installation Directory: C:\Program Files\PostgreSQL\17\pgAdmin 4
// Stack Builder Installation Directory: C:\Program Files\PostgreSQL\17
// Installation Log: C:\Users\rohan\AppData\Local\Temp\install-postgresql.log

//new_password