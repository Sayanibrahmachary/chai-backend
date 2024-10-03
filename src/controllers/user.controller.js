import {asyncHandler} from  "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt from "jsonwebtoken";
import mongoose from "mongoose";


//https://github.com/hiteshchoudhary/chai-backend
//for register the user and here we send 200 means registration is successfull and all okk so we send a json message also "ok"

const generateAccessAndRefreshTokens = async(userId)=>
{
    try{

        const user= await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false});// for saving the refreshtoken in data base or mongooes give you this features to you

        return {accessToken,refreshToken};
    }
    catch(error)
    {

        throw new ApiError(500,"Something went wrong while generating refresh and access token");
    }
}


const registerUser= asyncHandler(async(req,res)=>
{
    // get user details from fronted
    // validation - not empty
    // check if user already exists: through username and email
    // check for images and check for avatar
    // upload them to cloudinery, avatar
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // if create successfully then return response other wish check
    
    const {fullname, email, username, password}=req.body
    
    if(fullname=="")
    {
        throw new ApiError(400,"fullname is required");
    }
    else if(username=="")
    {
        throw new ApiError(400,"username is required");
    }
    else if(email=="")
    {
        throw new ApiError(400,"email is required");
    }
    else if(password=="")
    {
        throw new ApiError(400,"please give a password which protect your account, it is required");
    }
    else if(!email.includes("@") && !email.includes("$") && !email.includes("#") && !email.includes("&") && !email.includes("*"))
    {
        throw new ApiError(400,"pleace put any special character like @,#,$,&,*");
    }

    //you can check validation useing this method also
    // if(
    //     [fullname,email,username,password].some((field)=>
    //     field?.trim()==="")
    // )
    // {
    //     throw new ApiError(400,"All fields are required");
    // }

    //check this user is already present or not
    // const exitedUser =User.findOne({username} || {email})

    const exitedUser = await User.findOne ({
        $or: [{username},{email}]
    })

    if(exitedUser)
    {
        throw new ApiError(409, "User with email or username is already exits");
    }

    //check for images and check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("Sayani");
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    //if avatar is not present then sent a message
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required");
    }

    //upload avatar and coverImage in cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    //if avatar is not present then sent a message
    if(!avatar)
    {
        throw new ApiError(400, "Avatar is required");
    }

    //user create in MongoDb
    const user=await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refreshToken from user
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //if user is not created in db then throw an apierror
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    //if it is successfull run then also send an error
    return res.status(201).json(
        new ApiResponse (200,createdUser,"User registered Successfully")
    )
})


//LOGIN USER......................
const loginUser=asyncHandler(async(req,res)=>
{
    // req body -> data
    // username or email
    // find user
    // password check
    // access and refresh token
    // send cookies
    // login successfully

    const { username , email , password }=req.body;

    if(!(username|| email))
    {
        throw new ApiError(400,"Username or email is required");
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user)
    {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid= await user.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    //send cookies
    const loggedIn=await User.findById(user._id).
    select("-password -refreshToken");

    const options={
        httpOnly: true,
        secure: true,
    }
    return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{user: loggedIn, accessToken,refreshToken},"User logged in successfully",))
})

//LOGOUT USER.....................
const loggoutUser = asyncHandler(async(req,res)=>
{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document
            }
        },
        {
            new: true
        }
    )
    const options={
        httpOnly: true,
        secure: true,
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User Logedout successfully")
    )
    
})

//GENERATE ACCESS AND REFRESH TOKEN................
const refreshAccessToken = asyncHandler(async(req,res)=>
{
    const incomingRfreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRfreshToken)
    {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken=jwt.verify(
            incomingRfreshToken, process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user=await User.findById(decodedToken?._id)
        if(!user)
        {
            throw new ApiError(401, "Invalid token");
        }
    
        if(user?.refreshToken!==incomingRfreshToken)
        {
            throw new ApiError(401,"Refresh Token is expired or used");
        }
    
        const options={
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,newRefreshToken}=await user.generateRefreshToken(user._id)
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            200,
            {
                accessToken,newRefreshToken
            },
            "Access token refreshed successfully",
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

//Change Current Password
const changeCurrentPassword = asyncHandler(async(req,res)=>
{
    const {oldPassword , newPassword} = req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new ApiError(400 , "Invalid old password")
    }
    user.password=newPassword;
    await user.save({validateBeforeSave : false})

    return res.
    status(200)
    .json(new ApiResponse(200,{},"Password changed SuccessFull"))
})

const getCurrentUser= asyncHandler(async(req,res)=>
{
    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>
{
    const {fullname,email}=req.body
    if(!(fullname || email))
    {
        throw new ApiError(400, "Both field are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: 
            {
                fullname,
                email: email,
            }
        },
        {new :true}).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user, "Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(req,res)=>
{
    const avatarLocalPath=req.file?.path
    
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing")
    }
    
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:
            {
                avatar: avatar.url
            }
        },
        {new :true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200,user,"Avatar Image updated successfully")
        )
})

const updateUserCoverImage= asyncHandler(async(req,res)=>
    {
        const coverImageLocalPath = req.file?.path
    
        if(!coverImageLocalPath)
        {
            throw new ApiError(400,"Cover Image file is missing")
        }
    
        const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
        if(!coverImage.url)
        {
            throw new ApiError(400, "Error while uploading on coverImage")
        }
        const user=await User.findByIdAndUpdate(req.user?._id,
            {
                $set:
                {
                    coverImage: coverImage.url
                }
            },
            {new :true}
        ).select("-passord")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"cover Image updated successfully")
        )
})

const getUserChannelProfile= asyncHandler(async(req,res)=>
{
    const {username}=req.params //params means url

    if(!username?.trim())
    {
        throw new ApiError(400,"username is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            },
        },
        {
            $lookup:
            {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },//my channel subscribers
        {
            $lookup:
            {
                from: "subscriptions",
                localField: "_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },//those channels i subscribed 
        {
            $addFields:
            {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:
                {
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.$subscriber"]},
                        then:true,
                        else:false
                    }
                },// this pipeline checks that am i subscribe chai or code channel or not
                // so we give a if condiniton and i checks that in subscribers am i subscribe or not so "$in" checks is from req.user i try to find my "_id" from $subscribers object
            }
        },
        {
            $project:
            {
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount: 1,
                isSubscribed:1,
                coverImage:1,
                avatar:1,
                email:1,
            }
        }//we pass our data which i wnat to show in the fronted part so i pass 1
    ])

    if(!channel?.length)
    {
        throw new ApiError(404,"channel does not exists")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"New APi fetched successfully"))
})

const getWatchHistory=asyncHandler(async(req,res)=>
{
    const user= await User.aggregate([
        {
            $match:
            {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:
            {
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:
                        {
                            from: "users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",

                            pipeline:[
                                {
                                    $project:
                                    {
                                        username:1,
                                        fullname:1,
                                        avatar:1,
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:
                                        {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                    
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    loggoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};