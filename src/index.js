//in package.json file in script i write "dev" and download nodemon ,it reload the index.js file again and again when i write something new

import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>
{
    app.on("error",(error)=>{
        console.log("Error: ",error);
        throw error
    })
    app.listen(process.env.PORT || 8000,()=>
    {
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((error)=>
{
    console.log("MongoDB connection failed !!!",error);
})


/* FIRT APPROACH
import express from "express"
const app=express()

(async ()=> {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>
        {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error)
    {
        console.log("ERROR: ",error)
        throw error
    }
})()
*/