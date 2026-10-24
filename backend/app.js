require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");
const chatRouter = require("./routes/chatRouter");

app.use(cors(
    {
        origin:[
            "https://localhost:5173",
        ],
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error)=>{
    if(error){
        console.log(error);
    }
    console.log(`App is listening on port ${PORT}`);
})