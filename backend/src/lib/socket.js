const { Server } = require("socket.io");
const User = require("../models/user.model");
const Chat = require("../models/chat.model");

let io;

// store online users
const userSocketMap = new Map(); // {userID: socketID}

// initialize the web socket server
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
        },
    });

    // register user connection to socket
    io.on("connection", (socket) => {
        console.log("a user has connected", socket.id);

        const userID = socket.handshake.query.userID;
        if(userID) {
            userSocketMap.set(userID, socket.id);
            io.emit("onlineUsers", getOnlineUsers());
        } 

        // listen and emit when user starts typing 
        socket.on("typingOn", async({chatID, userID}) => {
            try {
                const chat = await Chat.findOne({ chatID : Number(chatID)}).select("chatID participants").lean();
                if(!chat) return;

                chat.participants.forEach(p => {
                    if(p == Number(userID)) return;

                    const socketID = getSocketID(p);
                    if(socketID) {
                        io.to(socketID).emit("typingOn", { chatID, userID });
                    }
                })

            } catch (error) {
                console.log("error in emitting typing on", error);
            }
        });

        // listen and emit when user stops typing
        socket.on("typingOff", async({chatID, userID}) => {
            try {
                const chat = await Chat.findOne({ chatID : Number(chatID)}).select("chatID participants").lean();
                if(!chat) return;

                chat.participants.forEach(p => {
                    if(p == Number(userID)) return;

                    const socketID = getSocketID(p);
                    if(socketID) {
                        io.to(socketID).emit("typingOff", { chatID, userID });
                    }
                })

            } catch (error) {
                console.log("error in emitting typing on", error);
            }
        });

        // listen and emit when user disconnects from socket
        socket.on("disconnect", async() => {
            console.log("a user has disconnected", socket.id);
            try {
                const lastSeen = new Date();
                await User.findOneAndUpdate({ userID }, { lastSeen });

                userSocketMap.delete(userID);
                io.emit("userOffline", { userID, lastSeen });
                io.emit("onlineUsers", getOnlineUsers());
            } catch (error) {
                console.error("Failed to update lastSeen:", error.message);
            }
        });
    });    
}

// return the io server initialized 
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

// return the list of online userIDs
const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys()).map(id => Number(id));
}

// return the socketID of a specefic userID
const getSocketID = (userID) => {
    return userSocketMap.get(String(userID)) || null;
}

module.exports = { initSocket, getIO, getOnlineUsers, getSocketID }