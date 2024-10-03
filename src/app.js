import express from "express"//*
import cors from "cors"//*
import cookieParser  from "cookie-parser"
// "cookies" are small pieces of data that a server sends to a user's web browser.
//The browser stores these cookies and sends them back to the server with each subsequent request. This allows the server to recognize the user and remember their preferences or actions across different sessions. 
const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//onakei onak vabe data pathabe tai json a raklam ar akta limit dilam karon basi unlimited data allow korle seta server crash kore jabe
app.use(express.json({
    limit: "16kb"
}))
//url thake data ale satake encode korte hobe tai ai ai vabe kora hoy
app.use(express.urlencoded({
    extended: true, 
    limit: "16kb"
}))

app.use(express.static("public"))
app.use(cookieParser())


//routes import 

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playList.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import dashbordRouter from "./routes/dashbord.routes.js"

//routes declaration

app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/dashboard", dashbordRouter)

//http.//localhost:8000/api/v1/users/register

export {app}



//Example of express 
// import express from "express";

// const app = express();
// const port = 3000;

// // Define a route
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

// import express from "express"; brings the Express library into the file.
// const app = express(); creates an instance of an Express application.
// app.get('/', (req, res) => { ... }); defines a route for the root URL.
// app.listen(port, () => { ... }); starts the server and listens on the specified port.


//why express is so popular?
//1)Express has a minimalistic and straightforward API, making it relatively easy to learn and use, even for developers who are new to Node.js.
//2)It provides a lot of built-in functionalities without requiring extensive configuration, which helps in building applications faster.
//3)xpress uses middleware functions to handle requests and responses. Middleware can be used for various tasks such as authentication, logging, and data parsing, making it easy to add functionality as needed.
//4)Express provides a flexible and powerful routing mechanism to handle different HTTP requests (GET, POST, PUT, DELETE, etc.) and define routes in a clean manner.
//5)Express can easily connect to various databases (SQL and NoSQL) using packages like mongoose for MongoDB
//6)Express allows you to define custom error-handling middleware, making it easier to manage