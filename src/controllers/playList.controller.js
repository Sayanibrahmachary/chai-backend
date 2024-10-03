import mongoose, {isValidObjectId} from "mongoose"
import {PlayList} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//TODO: create playlist
const createPlaylist = asyncHandler(async (req, res) => 
{
    const {name, description} = req.body

    if(name=="" || description=="")
    {
        throw new ApiError(401,"Name and Description both is required");
    }

    const playlist= await PlayList.create({
        name,
        description,
        video: req.body.video?._id || null,
        owner:req.user?._id,
    })

    if (!playlist) {
        throw new ApiError(500, "failed to create playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params

    if(!isValidObjectId(userId))
    {
        throw new ApiError(401,"Invalid UserId");
    }
    const playList= await PlayList.aggregate([
        {
            $match:
            {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:
            {
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"playListDetails"
            }
        },
        {
            $lookup:
            {
                from: "videos",
                localField:"videos",
                foreignField:"_id",
                as: "videoDetails"
            }
        },
        {
            $addFields:
            {
                totalVideos:
                {
                    $size: "$videoDetails"
                },
                totalViews:
                {
                    $sum: "$videoDetails.views"
                },
            },
        },
        {
            $project:
            {
                username:"$playListDetails.username",
                fullname:"$playListDetails.fullname",
                description:1,
                name:1,
                totalVideos:1,
                totalViews:1,
            }
        }
    ])

    if(!playList)
    {
        throw new ApiError(401,"playList is not fetched")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playList,"playList is fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(401,"Invalid PlayListId");
    }

    const playlist= await PlayList.findById(playlistId)
    if(!playlist)
    {
        throw new ApiError(401,"playlist is not find")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"PlayList is fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400,"Invalid playListId")
    }
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400,"Invalid videoId")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Cannout find playlist")
    }

    const response =await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $set:
            {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    return res.
    status(200)
    .json(new ApiResponse(200,response,"video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400,"Invalid playListId")
    }
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400,"Invalid videoId")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Can not find playlist")
    }

    const deleteResponce =await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $pull:
            {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!deleteResponce)
    {
        throw new ApiError(401,"Error while deteing video from db")
    }

    res
    .status(200)
    .json(new ApiResponse(200,deleteResponce,"Video deleted Successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid PlayListId")
    }

    const playlist = await PlayList.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Cannout find playlist")
    }

    const deleteResponce = await PlayList.findByIdAndDelete(playlistId);

    if(!deleteResponce)
    {
        throw new ApiError(401,"Error while deleteing video from db")
    }

    res
    .status(200)
    .json (new ApiResponse(200,deleteResponce,"Video deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const {playlistId} = req.params
    const {name, description} = req.body

    if(name=="" || description=="")
    {
        throw new ApiError(400,"Name and Description both are required")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(401,"Invalid playlistId")
    }

    const playList= await PlayList.findById(playlistId)

    if(!playList)
    {
        throw new ApiError(400, "Cannout find playlist")
    }

    const response =await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $set:
            {
                name: name,
                description: description,
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,response, "Name and description is updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
}
