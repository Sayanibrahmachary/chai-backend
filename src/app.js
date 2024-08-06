import express from "express"
import cors from "cors"
import cookieParser  from "cookie-parser"
// "cookies" are small pieces of data that a server sends to a user's web browser.
//The browser stores these cookies and sends them back to the server with each subsequent request. This allows the server to recognize the user and remember their preferences or actions across different sessions. 
const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//onakei onak vabe data pathabe tai json araklam ar akta limit dilam karon basi unlimited data allow korle seta server crash kore jabe
app.use(express.json({
    limit: "16kb"
}))
//url thake data ale satake encode korte hobe tai ai ai vabe kora hoy
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))
app.use(cookieParser())


export {app}