import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId))
    {
        throw new ApiError(401,"Invalid channelId")
    }

    const subscribe = await Subscription.findOne(
        {
            subscriber: req.user?._id,
            channel: channelId,
        }
    )
    if(!subscribe)
    {
        const subscribeDone=await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId,
        })

        res
        .status(200)
        .json(new ApiResponse(200,subscribeDone,"subscribe successfully"))
    }

    else
    {
        const unsubscribe=await subscribe.findByIdAndDelete(subscribe?._id)
        res
        .status(200)
        .json(new ApiResponse(200,unsubscribe,"Unsubscribe successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params 

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscribers= await Subscription.aggregate([
        {
            $match:
            {
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup:
            {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            }
        },
        {
            $unwind: "$subscriberDetails",
        },
        {
            $project:
            {
                _id:0,
                subscriber:
                {
                    fullname:"$subscriberDetails.fullname",
                    username:"$subscriberDetails.username",
                    avatar:"$subscriberDetails.avatar",
                } 
            }
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {subscribers,
                totalSubscribers:subscribers.length,},
                "subscribers fetched successfully"
            )
        );


        // const getUserChannelSubscribers = asyncHandler(async (req, res) => {
        //     const {channelId} = req.params
        
        //     if (!isValidObjectId(channelId)) {
        //         throw new ApiError(400, "Invalid channelId");
        //     }
        
        //     const subscribers= await Subscription.aggregate([
        //         {
        //             $match:
        //             {
        //                 channel: new mongoose.Types.ObjectId(channelId),
        //             }
        //         },
        //         {
        //             $lookup:
        //             {
        //                 from: "users",
        //                 localField: "subscriber",
        //                 foreignField: "_id",
        //                 as: "subscriberDetails",
        //                 pipeline:[
        //                     {
        //                         $lookup:
        //                         {
        //                             from: "Subscriptions",
        //                             localField: "_id",
        //                             foreignField: "subscriber",
        //                             as: "subscribedToSubscriber",
        //                         }
        //                     },
        //                     {
        //                         $addFields:
        //                         {
        //                             subscribersCount:{
        //                                 $size: "$subscribedToSubscriber",
        //                             },
        //                             subscribedToSubscriber:
        //                             {
        //                                 $cond:{
        //                                     if: {$in: [req.user?._id,"$subscribedToSubscriber.channel"]},
        //                                     then:true,
        //                                     else:false
        //                                 }
        //                             },
        //                         }
        //                     },
        //                 ]
        //             }
        //         },
        //         {
        //             $unwind: "$subscriberDetails",
        //         },
        //         {
        //             $project:
        //             {
        //                 _id:0,
        //                 subscriber:
        //                 {
        //                     fullname:"$subscriberDetails.fullname",
        //                     username:"$subscriberDetails.username",
        //                     subscribersCount:"$subscriberDetails.subscribersCount",
        //                     isSubscribed:"$subscriberDetails.isSubscribed",
        //                     avatar:"$subscriberDetails.avatar",
        //                 } 
        //             }
        //         }
        //     ])
        
        //     console.log($subscriberDetails);
        //     return res
        //         .status(200)
        //         .json(
        //             new ApiResponse(
        //                 200,
        //                 subscribers,
        //                 "subscribers fetched successfully"
        //             )
        //         );
        // })
        // suppose i have a channel name abc and i have 3 subscriber a,b, and c so explain the code using the basis of example

        // explaination of the code
        //The code then performs an aggregation query on the Subscription collection to find all documents where channel matches channelId.
        // This will filter the subscriptions to include only those where the user has subscribed to the channel abc.
        // [
        //     { subscriber: "a", channel: "abc" },
        //     { subscriber: "b", channel: "abc" },
        //     { subscriber: "c", channel: "abc" }
        // ]

        // The lookup stage fetches the corresponding subscriberDetails from the users collection. This step enriches the subscription data with information about each subscriber.
        // [
        //     { _id: "a", fullname: "Alice", username: "alice123", avatar: "avatar_a" },
        //     { _id: "b", fullname: "Bob", username: "bob123", avatar: "avatar_b" },
        //     { _id: "c", fullname: "Charlie", username: "charlie123", avatar: "avatar_c" }
        // ]

        //For each subscriber (a, b, c), the code does another lookup in the Subscription collection to find out how many channels they are subscribed to.
        // It also checks if the current user (req.user) is subscribed to any of those channels.

        // [
        //     { subscriber: "a", channel: "def" },
        //     { subscriber: "a", channel: "ghi" }
        // ]

        // The subscribersCount field is computed as the size of the subscribedToSubscriber array, so a has a subscribersCount of 2.

        // The isSubscribed field checks if the current user is subscribed to any of the channels that a is subscribed to.

        //The $unwind stage flattens the array of subscriberDetails so that each subscriber's details are a separate document.

        // [
        //     { subscriber: { fullname: "Alice", username: "alice123", subscribersCount: 2, isSubscribed: true, avatar: "avatar_a" } },
        //     { subscriber: { fullname: "Bob", username: "bob123", subscribersCount: 1, isSubscribed: false, avatar: "avatar_b" } },
        //     { subscriber: { fullname: "Charlie", username: "charlie123", subscribersCount: 3, isSubscribed: false, avatar: "avatar_c" } }
        // ]
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId))
    {
        throw new ApiError(400,"Invalid subscriberId")
    }

    const channels = await Subscription.aggregate([
        {
            $match:
            {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup:
            {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as:"channelDetails",//to retrive details about the channel
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project:
            {
                fullname:"$channelDetails.fullname",
                username:"$channelDetails.username",
                avatar:"$channelDetails.avatar",
            },
        },
    ])

    return res.status(200).json(
        new ApiResponse (
            200,
            {channels, TotalChannels:channels.length},
            "channels which i subscribed fetched successfully"
        )
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}