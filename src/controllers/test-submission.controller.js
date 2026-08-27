import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Test } from '../models/test.model.js';
import { TestAttempt } from '../models/test.submission.js'; 
import { Course } from '../models/course.model.js';
import { User } from "../models/user.model.js";

// --- HELPER: Lazy Evaluation for Timeouts ---
// Checks if an attempt is expired. If yes, it auto-grades it, assigns points, and updates the status.
const handleAutoSubmitIfExpired = async (attempt, test) => {
    if (attempt.status !== 'in_progress') return attempt;

    const timeElapsedInSeconds = (Date.now() - attempt.startTime.getTime()) / 1000;
    const gracePeriod = 10; // 10 seconds for network latency

    if (timeElapsedInSeconds > test.timeLimit + gracePeriod) {
        attempt.status = 'timeout';
        // Retroactively set completion time to the exact moment the timer hit zero
        attempt.completedAt = new Date(attempt.startTime.getTime() + (test.timeLimit * 1000));
        const correctCount = (attempt.solvedTasks || []).filter(t => t.isCorrect).length;        
        const totalTasks = test.tasks.length;
        const earnedPoints = totalTasks > 0 ? Math.round((correctCount / totalTasks) * test.rewardPoints) : 0;
        
        attempt.pointsAwarded = true;
        await attempt.save();
        
        // Award points AND log the completion
        const studentId = attempt.student._id || attempt.student;
        
        const updateQuery = {
            $addToSet: { "completions.tests": test._id } // Add to achievements
        };
        
        if (earnedPoints > 0) {
            updateQuery.$inc = { "stats.shopPoints": earnedPoints }; // Add points
        }
        
        await User.findByIdAndUpdate(studentId, updateQuery);
    }
    return attempt;
};

// --- COACH: Create Test ---
export const createTest = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, tasks, timeLimit, rewardPoints } = req.body; 
    const coachId = req.user._id;

    if (!title || !tasks || tasks.length === 0 || !timeLimit) {
        throw new ApiError(400, "Title, at least one task, and a time limit are required.");
    }

    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");

    if (course.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "Unauthorized.");
    }

    const test = await Test.create({
        course: courseId,
        coach: coachId,
        title,
        description,
        tasks,
        timeLimit,
        rewardPoints: rewardPoints || 0
    });

    return res.status(201).json(new ApiResponse(201, test, "Test created successfully."));
});

// --- COACH: Delete Test ---
export const deleteTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const coachId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) throw new ApiError(404, "Test not found.");

    if (test.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "Unauthorized.");
    }
    
    // Cleanup attempts
    await TestAttempt.deleteMany({ test: testId });
    await Test.findByIdAndDelete(testId);

    return res.status(200).json(new ApiResponse(200, {}, "Test deleted."));
});

// --- SHARED: Get Tests (With Student Progress) ---
export const getTestsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role; 

    const tests = await Test.find({ course: courseId }).sort({ createdAt: -1 });

    if (userRole === 'coach') {
        return res.status(200).json(new ApiResponse(200, tests, "Tests retrieved."));
    }

    // Attach student's attempt to determine if they can start/resume/view results
    const result = await Promise.all(tests.map(async (test) => {
        const attempt = await TestAttempt.findOne({ test: test._id, student: userId });
        return {
            ...test.toObject(),
            myAttempt: attempt || null 
        };
    }));

    return res.status(200).json(new ApiResponse(200, result, "Tests retrieved with progress."));
});

export const getTestById = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const userId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) {
        throw new ApiError(404, "Test not found.");
    }

    const attempt = await TestAttempt.findOne({ 
        test: testId, 
        student: userId 
    });

    const result = {
        ...test.toObject(),
        myAttempt: attempt || null
    };

    return res.status(200).json(new ApiResponse(200, result, "Test retrieved successfully."));
});

// --- STUDENT: Start Test (Locks in startTime) ---
export const startTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) throw new ApiError(404, "Test not found");

    let attempt = await TestAttempt.findOne({ test: testId, student: studentId });

    if (attempt) {
        // Run lazy evaluation in case they are trying to resume an expired test
        attempt = await handleAutoSubmitIfExpired(attempt, test);

        if (attempt.status === 'completed' || attempt.status === 'timeout') {
            throw new ApiError(400, "Your time for this test has expired or it is already completed.");
        }
        return res.status(200).json(new ApiResponse(200, attempt, "Resuming test"));
    }

    attempt = await TestAttempt.create({
        test: testId,
        student: studentId,
        startTime: Date.now(),
        status: 'in_progress',
        solvedTasks: [],
        pointsAwarded: false
    });

    return res.status(201).json(new ApiResponse(201, attempt, "Test started. Timer is running!"));
});

// --- STUDENT: Save Task Progress ---
export const solveTestTask = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const { chapterId, isCorrect = true, overridePgn = null } = req.body; 
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    let attempt = await TestAttempt.findOne({ test: testId, student: studentId });
    
    if (!attempt) throw new ApiError(400, "You must start the test before solving tasks.");
    
    // Evaluate if time ran out before saving the new move
    attempt = await handleAutoSubmitIfExpired(attempt, test);
    
    if (attempt.status === 'timeout') {
        throw new ApiError(403, "Time is up! Your test has been auto-submitted.");
    }
    if (attempt.status === 'completed') {
        throw new ApiError(400, "This test is already finalized.");
    }

    const taskIndex = attempt.solvedTasks.findIndex(t => t.taskId === chapterId);

    if (taskIndex === -1) {
        attempt.solvedTasks.push({
            taskId: chapterId,
            isCorrect: isCorrect,
            overridePgn: overridePgn
        });
        await attempt.save();
    }

    return res.status(200).json(new ApiResponse(200, attempt, "Task progress saved"));
});

// --- STUDENT: Finalize and Submit Test ---
export const submitTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    let attempt = await TestAttempt.findOne({ test: testId, student: studentId });
    
    if (!attempt) throw new ApiError(404, "Test attempt not found.");

    // Evaluate in case they hit submit after the timer naturally expired
    attempt = await handleAutoSubmitIfExpired(attempt, test);

    if (attempt.status === 'timeout' || attempt.status === 'completed') {
        return res.status(200).json(new ApiResponse(200, attempt, "Test was already auto-submitted due to timeout or previous completion."));
    }

    // Normal submission (within time limit)
    const correctCount = (attempt.solvedTasks || []).filter(t => t.isCorrect).length;
    const totalTasks = test.tasks.length;
    
    let earnedPoints = 0;
    if (totalTasks > 0) {
        earnedPoints = Math.round((correctCount / totalTasks) * test.rewardPoints);
    }

    attempt.status = 'completed';
    attempt.completedAt = Date.now();
    attempt.pointsAwarded = true;
    await attempt.save();

    // Award points AND log the completion
    const updateQuery = {
        $addToSet: { "completions.tests": testId } // Add to achievements
    };
    
    if (earnedPoints > 0) {
        updateQuery.$inc = { "stats.shopPoints": earnedPoints }; // Add points
    }

    await User.findByIdAndUpdate(studentId, updateQuery);

    return res.status(200).json(new ApiResponse(200, { attempt, earnedPoints }, "Test successfully submitted and points awarded."));
});

// --- COACH: View All Attempts (With Lazy Evaluation) ---
export const getAttemptsForTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test) throw new ApiError(404, "Test not found");

    const attempts = await TestAttempt.find({ test: testId })
        .populate('student', 'username fullname email stats.shopPoints')
        .sort({ updatedAt: -1 });

    // Process all attempts to ensure the Coach sees accurate, auto-graded data
    const evaluatedAttempts = [];
    for (let attempt of attempts) {
        const updatedAttempt = await handleAutoSubmitIfExpired(attempt, test);
        evaluatedAttempts.push(updatedAttempt);
    }

    const result = evaluatedAttempts.map(attempt => ({
        ...attempt.toObject(),
        progress: `${attempt.solvedTasks?.length || 0} / ${test.tasks.length}`,
        timeTakenSeconds: attempt.completedAt 
            ? Math.round((attempt.completedAt.getTime() - attempt.startTime.getTime()) / 1000) 
            : null
    }));

    return res.status(200).json(new ApiResponse(200, result, "Test attempts retrieved"));
});