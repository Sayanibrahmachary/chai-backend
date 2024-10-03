import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400,"Invalid channelId")
    }

    const allDetails= await User.aggregate([
        {
            $match:
            {
                _id: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup:
            {
                from:"videos",
                localField:"_id",
                foreignField: "owner",
                as: "videoInfo",
            }
        },
        {
            $lookup:
            {
                from:"subscriptions",
                localField:"_id",
                foreignField: "channel",
                as: "subscriberInfo",
            }
        },
        {
            $addFields:
            {
                totalvideo:
                {
                    $size:"$videoInfo"
                },
                totalSubscriber:
                {
                    $size:"$subscriberInfo"
                },
                totalViews:
                {
                    $sum:"$videoInfo.viwes"
                }
            }
        },
        {
            $project:
            {
                totalvideo:1,
                totalSubscriber:1,
                totalViews:1,
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,allDetails,"all details fetched successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400,"Invalid channelId")
    }

    const allDetails= await User.aggregate([
        {
            $match:
            {
                _id: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup:
            {
                from:"videos",
                localField:"_id",
                foreignField: "owner",
                as: "videoInfo",
            }
        },
        {
            $addFields:
            {
                totalvideo:
                {
                    $size:"$videoInfo"
                },
            }
        },
        {
            $project:
            {
                totalvideo:1,
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200,allDetails,"all details fetched successfully"))

})

export {getChannelStats,getChannelVideos}