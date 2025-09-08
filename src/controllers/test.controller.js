import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Test } from '../models/test.model.js';
import { Course } from '../models/course.model.js';

// --- COACH: Create a test for a specific course ---
export const createTest = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { testName, zoomLink } = req.body;
    const coachId = req.user._id;

    if (!testName || !zoomLink) {
        throw new ApiError(400, "Test name and Zoom link are required.");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    // Security Check: Ensure the user creating the test is the coach of this course.
    if (course.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "You are not authorized to create tests for this course.");
    }

    const test = await Test.create({
        coach: coachId,
        course: courseId,
        testName,
        zoomLink
    });

    return res.status(201).json(new ApiResponse(201, test, "Test created successfully."));
});

// --- COACH: Delete a test they created ---
export const deleteTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const coachId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) {
        throw new ApiError(404, "Test not found.");
    }

    // Security Check: Ensure the user deleting the test is the one who created it.
    if (test.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this test.");
    }
    
    await Test.findByIdAndDelete(testId);
    return res.status(200).json(new ApiResponse(200, {}, "Test deleted successfully."));
});

// --- STUDENT & COACH: Get all tests for a specific course ---
export const getAllTestsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    // Security Check: Ensure the user is either the coach or an enrolled student.
    const isCoach = course.coach.toString() === userId.toString();
    const isEnrolled = course.students.some(id => id.toString() === userId.toString());

    if (!isCoach && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view tests for this course.");
    }
    
    const tests = await Test.find({ course: courseId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, tests, "Tests retrieved successfully."));
});
