import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Test } from '../models/test.model.js';
import { TestAttempt } from '../models/test.submission.js'; 
import { Course } from '../models/course.model.js';

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