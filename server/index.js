const express = require("express");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");
const authRouter = require("./routers/Authrouter.js");
const { sessionMiddleware, wrap, corsConfig} = require("./controllers/ServerController.js");
const { authorizeUser, addFriend, initializeUser, onDisconnect } = require("./controllers/Socketcontroller.js");

require("dotenv").config();


const app = express();
const server = require("http").createServer(app);

const io = new Server(server, {
    cors: corsConfig
});

app.use(helmet());
app.use(express.json());
app.use(sessionMiddleware)

app.use(cors(corsConfig));

// Add a middleware to set the necessary headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use("/auth", authRouter);

io.use(wrap(sessionMiddleware));
io.use(authorizeUser);
io.on("connect", (socket) => {
    initializeUser(socket);
    socket.on("add_friend",(friendName,cb)=>{
        addFriend(friendName,cb,socket);
    } )
    socket.on("disconnecting",()=> onDisconnect(socket));
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
