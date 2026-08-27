import { IqPuzzleRecord } from "../models/iq_puzzle.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// --- DYNAMIC RATING CALCULATOR ---
export const calculateNewRating = (playerRating, puzzleRating, isCorrect) => {
    const K = 32; // Volatility multiplier (max rating change per puzzle)
    const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
    const actualScore = isCorrect ? 1 : 0;
    
    // Calculate new rating and round to nearest whole number
    const newRating = playerRating + K * (actualScore - expectedScore);
    return Math.round(newRating);
};

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

    // 2. Determine Puzzle Rating based on difficulty
    const difficultyRatings = { easy: 1000, medium: 1300, hard: 1600 };
    const puzzleRating = difficultyRatings[difficulty] || 1200;

    // 3. Fetch User's current rating
    const user = await User.findById(studentId).select("stats");
    const currentRating = user.stats?.rating || 1200;

    // 4. Calculate new Rating and Shop Points
    // Assuming a score > 0 is considered a "success" for Elo calculation purposes
    const isCorrect = score > 0; 
    const newRating = calculateNewRating(currentRating, puzzleRating, isCorrect);
    
    const multiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const pointsEarned = score * multiplier;

    // 5. Update everything in ONE database sweep
    const updateQuery = {
        $set: { "stats.rating": newRating },
        $push: { [`completions.iqPuzzles.${difficulty}`]: record._id }
    };
    
    // Only increment shop points if they actually earned any
    if (pointsEarned > 0) {
        updateQuery.$inc = { "stats.shopPoints": pointsEarned };
    }

    await User.findByIdAndUpdate(studentId, updateQuery);

    // 6. Check for a new personal high score
    const bestRecord = await IqPuzzleRecord.findOne({ student: studentId, mode, difficulty })
        .sort({ score: -1 })
        .select('score');

    const isNewHighScore = bestRecord && bestRecord._id.toString() === record._id.toString();

    return res.status(200).json(
        new ApiResponse(200, {
            record,
            pointsEarned,
            newRating,             // Passing this back so frontend can animate rating changes!
            ratingChange: newRating - currentRating,
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