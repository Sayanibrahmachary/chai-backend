import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => 
{

    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400,"Invalid videoId")
    }

    const video= await Video.findById(videoId)

    if(!video)
    {
        throw new ApiError(400,"video is not found")
    }

    const allComments= Comment.aggregate([
        {
            $match:
            {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:
            {
                from:"users",
                localField: "owner",
                foreignField:"_id",
                as:"usersDetails"
            }
        },
        {
            $lookup:
            {
                from:"likes",
                localField: "_id",
                foreignField:"comment",
                as:"likesDetails"
            }
        },
        {
            $addFields:
            {
                totalLikes:
                {
                    $size:"$likesDetails"
                },
            }
        },
        {
            $unwind:"$usersDetails"
        },
        {
            $project:
            {
                content:1,
                totalLikes:1,
                username:"$usersDetails.username",
                fullname:"$usersDetails.fullname",
                avatar:"$usersDetails.avatar"
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    // Use aggregatePaginate to handle pagination
    const comments = await Comment.aggregatePaginate(
        allComments,
        options
    );

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"fetched all commments successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {content}= req.body;
    const {videoId} = req.params;
    if(content=="")
    {
        throw new ApiError(400,"Content is required")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid videoId")
    }

    const comment= await Comment.create({
        content,
        video: videoId, 
        owner: req.user?._id
    })

    if(!comment)
    {
        throw new ApiError(400,"comment is not created")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "the User create a comment successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content}=req.body

    if(content=="")
    {
        throw new ApiError(400,"Content is required for updation")
    }
    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid CommentId")
    }

    const commentUpdate= await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:
            {
                content: content
            }
        }
    )

    if(!commentUpdate)
    {
        throw new ApiError(400,"comment is not update")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,commentUpdate,"comment is update successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid CommentId")
    }

    const comment= await Comment.findById(commentId)
    if(!comment)
    {
        throw new ApiError(400,"Can not find the comment by its id")
    }
    const commentDelete= await Comment.findOneAndDelete(comment)

    if(!commentDelete)
    {
        throw new ApiError(400,"Error while deleteing video from db")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,commentDelete,"Comment deleted successfully"))
})


export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}