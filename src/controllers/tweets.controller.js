import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweets.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} =req.body

    if(content=="")
    {
        throw new ApiError(400,"Content is required")
    }

    const tweet = await Tweet.create({
        content:content,
        owner: req.user?._id
    })

    if(!tweet)
    {
        throw new ApiError(400,"tweet is not created")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"The tweet is successfully uploaded"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId} = req.params
    
    if(!isValidObjectId(userId))
    {
        throw new ApiError(400,"userId is invalid")
    }

    const allTweetsSingleUser = await Tweet.aggregate([
        {
            $match:
            {
                owner: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup:
            {
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"TweetsDetails"
            }
        },
        {
            $lookup:
            {
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"LikesDetails",
                pipeline:[
                    {
                        $project:
                        {
                            likeBy:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:
            {
                totalLikes:
                {
                    $size:"$LikesDetails"
                }
            }
        },
        {
            $unwind:"$TweetsDetails",
        },
        {
            $project:
            {
                username:"$TweetsDetails.username",
                fullname:"$TweetsDetails.fullname",
                avatar:"$TweetsDetails.avatar",
                totalLikes:1,
                content:1,
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200,allTweetsSingleUser,"all tweets is fetched successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} =req.params
    const {content}=req.body

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400,"Invalid tweet")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:
            {
                content:content,
            }
        },{new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet is successfully updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} =req.params

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400,"Invalid tweet")
    }

    const tweetDelete = await Tweet.findByIdAndDelete(tweetId)

    if(!tweetDelete)
    {
        throw new ApiError(401,"Error while deleteing tweet from db")
    }

    res
    .status(200)
    .json (new ApiResponse(200,tweetDelete,"Video deleted Successfully"))
})

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}