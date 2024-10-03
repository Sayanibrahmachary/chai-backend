import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400,"Invalid videoId")
    }

    const like=await Like.findOne({
        likedBy:req.user?._id,
        video:videoId,
    })

    if(!like)
    {
        const likeDone= await Like.create({
            video:videoId,
            likedBy:req.user?._id
        })

        res
        .status(200)
        .json(new ApiResponse(200,likeDone,"like  successfull"))
    }
    else
    {
        const disLike=await Like.findByIdAndDelete(like?._id)
        res
        .status(200)
        .json(new ApiResponse(200,disLike,"disLike successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400,"Invalid commentId")
    }

    const like=await Like.findOne({
        likedBy:req.user?._id,
        comment:commentId,
    })
    if(!like)
    {
        const likeDone= await Like.create({
            comment:commentId,
            likedBy:req.user?._id
        })

        res
        .status(200)
        .json(new ApiResponse(200,likeDone,"like  successfull on comment"))
    }
    else
    {
        const disLike=await Like.findByIdAndDelete(like?._id)
        res
        .status(200)
        .json(new ApiResponse(200,disLike,"Unsubscribe successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400,"Invalid tweetId")
    }

    const like=await Like.findOne({
        likedBy:req.user?._id,
        tweet:tweetId,
    })

    if(!like)
    {
        const likeDone= await Like.create({
            tweet:tweetId,
            likeBy:req.user?._id
        })

        res
        .status(200)
        .json(new ApiResponse(200,likeDone,"like  successfull on tweet"))
    }
    else
    {
        const disLike=await Like.findByIdAndDelete(like?._id)
        res
        .status(200)
        .json(new ApiResponse(200,disLike,"Unsubscribe successfully"))
    }
    
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId}=req.params

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400,"Invalid userId")
    }

    const user=await User.findById(userId)

    if(!user)
    {
        throw new ApiError(400,"user is not found")
    }

    const allLikedVideos= await Like.aggregate([
        {
            $match:
            {
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:
            {
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideos"
            }
        },
        {
            $unwind:"$likedVideos"
        },
        {
            $project:
            {
                video:"$likedVideos.videoFile",
                thumnail:"$likedVideos.thumnail",
                title:"$likedVideos.title",
                description:"$likedVideos.description",
            }
        }
    ])

    if(!allLikedVideos)
    {
        throw new ApiError(400,"Error while fetching the liked videos from data base")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,allLikedVideos,"all liked videos fetched successfully"))
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
}