import { Router } from "express";
import { 
    loggoutUser,
    loginUser,
    refreshAccessToken, 
    registerUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory 
    } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured rouths
router.route("/logout").post(verifyJWT,loggoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").post(verifyJWT,getCurrentUser);
router.route("/updateAccount-details").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:user-Channels-profile").get(verifyJWT,getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory);
export default router
