import mongoose,{isValidObjectId }from 'mongoose';
import {asyncHandler} from  "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {Video} from "../models/video.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const { ObjectId } = mongoose.Types;

//https://github.com/Vaibhav-Pant/Youtube-Backend/blob/main/src/controllers/video.controller.js

const getAllVideos = asyncHandler(async (req, res) =>
{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pipeline=[];
    if(!isValidObjectId(userId))
    {
        throw new ApiError(401,"UserId is invalid");
    }

    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(userId),
        },
    });

    // fetch videos only that are set isPublished as true
    pipeline.push({
        $match: {
            isPublished: true,
        },
    });

    // sortBy can be views, createdAt, duration
    // sortType can be ascending(-1) or descending(1)
    if(sortBy && sortType)
    {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        });
    }
    else
    {
        pipeline.push(
            {
                $sort:
                {
                    createdAt: -1,
                }
            }
        )
    }

    pipeline.push
    (
        {
            $lookup:
            {
                from: "videos",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            },
            pipeline: 
            [
                {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                    },
                },
            ],
        },
        {
            $unwind: "$ownerDetails",// Converts the ownerDetails array into a single object 
        }
    );
    const videoAggregate = Video.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

const getPublishedAVideo=asyncHandler(async(req,res)=>
{
    const {description,title}=req.body

    if(description=="")
    {
        throw new ApiError(400,"description is required");
    }
    if(title=="")
    {
        throw new ApiError(400,"title is required");
    }

    const videoLocalPath=req.files?.videoFile[0]?.path;
    const thumbnailLocalPath=req.files?.thumnail[0]?.path;

    if(!videoLocalPath)
    {
        throw new ApiError(400,"video is required");
    }
    if(!thumbnailLocalPath)
    {
        throw new ApiError(400,"Thumbnail is required");
    }

    const videoFile=await uploadOnCloudinary(videoLocalPath);
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        videoFile: videoFile.url,
        thumnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user?._id,
    });

    if(!video)
    {
        throw new ApiError( 500,"Something went wrong while uploading the video.")
    }
    return res
    .status(200)
    .json(
        new ApiResponse (200,video,"Video uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401,"Invalid VideoId")
    }
    const video = await Video.findById(videoId)
    if(!video)
    {
        throw new ApiError(401,"Failed to get video details")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,video,"current user fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;

    if(description=="")
    {
        throw new ApiError(400,"description is required");
    }
    if(title=="")
    {
        throw new ApiError(400,"title is required");
    }

    const thumbnailLocalPath=req.file?.path;

    if(!thumbnailLocalPath)
    {
        throw new ApiError(400,"Thumbnail is not found")
    }
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401,"Invalid VideoId")
    }

    const thumnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumnail)
    {
        throw new ApiError(401,"rror while uploading on thumnail")
    }
    const video= await Video.findByIdAndUpdate(
        videoId,
        {
            $set:
            {
                title,
                description,
                thumnail: thumnail.url
            }
        },
        {new: true}
    )
    //TODO: update video details like title, description, thumbnailLocalPath=req.file?.thumbnail
    return res
    .status(200)
    .json( new ApiResponse(200,video,"Update the thumnail,description,title is successfull"))
})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401,"Invalid VideoId")
    }

    const deleteResponce= await Video.deleteOne({
        _id: new ObjectId(videoId),
    });

    if(!deleteResponce.acknowledged)
    {
        throw new ApiError(401,"Error while deteing video from db")
    }

    res
    .status(200)
    .json(new ApiResponse(200,deleteVideo,"Video deleted Successfully"))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401,"Invalid VideoId")
    }

    const video= await Video.findById(videoId)

    if(!video)
    {
        throw new ApiError(401,"Failed to get video details")
    }

    if(video.isPublished==true)
    {
        video.isPublished=false
        await  video.save({validateBeforeSave : false})
    }
    else
    {
        video.isPublished=true
        await  video.save({validateBeforeSave : false})
    }
})

export {
    getAllVideos,
    getPublishedAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}
