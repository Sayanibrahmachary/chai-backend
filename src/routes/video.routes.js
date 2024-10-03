import { Router } from 'express';
import {
    getAllVideos,
    getPublishedAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middlewares.js";

const router = Router();
router.use(verifyJWT); //Apply verifyJWT middleware to all routes in this file //.get(getAllVideos)
router.route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumnail",
                maxCount: 1,
            },
            
        ]),
        getPublishedAVideo
    );
router.route("/:videoId").get(getVideoById).patch(upload.single("thumnail"), updateVideo).delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router