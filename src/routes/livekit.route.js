import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/token', verifyJWT, async (req, res) => {
    try {
        const { roomId } = req.query;
        const user = req.user; 

        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }

        // 1. Define the User's Identity in the Video Room
        const participantName = user.name || user.username || "User";
        const participantIdentity = user._id.toString();

        // 2. Create Access Token
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: participantIdentity,
                name: participantName,
            }
        );

        // 3. Grant Permissions (Join, Publish Camera, Subscribe to others)
        at.addGrant({ 
            roomJoin: true, 
            room: roomId,
            canPublish: true, 
            canSubscribe: true 
        });

        // 4. Generate JWT
        const token = await at.toJwt();

        res.status(200).json({ token });

    } catch (error) {
        console.error("LiveKit Token Error:", error);
        res.status(500).json({ message: "Could not generate video token" });
    }
});

export default router;