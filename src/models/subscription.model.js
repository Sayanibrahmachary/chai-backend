import { Schema } from "mongoose";
import mongoose from "mongoose";

const subscriptionSchema =new Schema(
    {
        subscriber:
        {
            type: Schema.Types.ObjectId,//one who is subscriber
            ref:"User",
        },
        channel:
        {
            type: Schema.Types.ObjectId,//one who is "subscriber" is subscribing
            ref:"User",
        }
    },{timestamps:true})

export const Subscription= mongoose.model("Subscription",subscriptionSchema);

