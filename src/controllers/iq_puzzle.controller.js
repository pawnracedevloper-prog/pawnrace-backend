import { IqPuzzleRecord } from "../models/iq_puzzle.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import  asyncHandler  from "../utils/asyncHandler.js";

// --- SUBMIT SCORE & AWARD POINTS ---
export const submitIqScore = asyncHandler(async (req, res) => {
    const { mode, difficulty, score, timeSpent } = req.body;
    const studentId = req.user._id;

    if (!mode || !difficulty || score === undefined) {
        throw new ApiError(400, "Mode, difficulty, and score are required");
    }

    // 1. Save the game record
    const record = await IqPuzzleRecord.create({
        student: studentId,
        mode,
        difficulty,
        score,
        timeSpent
    });

    // 2. Calculate Global Points (Gamification hook)
    const multiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const pointsEarned = score * multiplier;

    if (pointsEarned > 0) {
        await User.findByIdAndUpdate(studentId, {
            $inc: { totalPoints: pointsEarned }
        });
    }

    // 3. Check for a new personal high score
    const bestRecord = await IqPuzzleRecord.findOne({ student: studentId, mode, difficulty })
        .sort({ score: -1 })
        .select('score');

    const isNewHighScore = bestRecord && bestRecord._id.toString() === record._id.toString();

    return res.status(200).json(
        new ApiResponse(200, {
            record,
            pointsEarned,
            isNewHighScore,
            highScore: bestRecord ? bestRecord.score : score
        }, "IQ score submitted successfully")
    );
});

// --- GET PERSONAL STATS ---
export const getMyIqStats = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const stats = await IqPuzzleRecord.aggregate([
        { $match: { student: studentId } },
        { 
            $group: {
                _id: { mode: "$mode", difficulty: "$difficulty" },
                highScore: { $max: "$score" },
                totalGamesPlayed: { $sum: 1 }
            }
        },
        { 
            $project: {
                _id: 0,
                mode: "$_id.mode",
                difficulty: "$_id.difficulty",
                highScore: 1,
                totalGamesPlayed: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, stats, "IQ stats fetched successfully")
    );
});