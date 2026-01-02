import { NewClass } from "../models/new_class.model.js";
import { Course } from "../models/course.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- Schedule a New Class ---
const scheduleClass = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    // We expect the frontend to generate the Unique Room ID and send it here
    const { title, classTime, roomId } = req.body;

    if (!title || !classTime) {
        throw new ApiError(400, "Title and class time are required");
    }

    if (!roomId) {
        throw new ApiError(400, "System Error: Internal Room ID is missing.");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Verify the user is the coach of this course
    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to schedule classes for this course");
    }

    const newClass = await NewClass.create({
        title,
        classTime,
        roomId, 
        platform: 'internal',
        course: courseId
    });

    return res.status(201).json(new ApiResponse(201, newClass, "Class scheduled successfully"));
});

// --- Update Class Details ---
const updateClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { title, classTime, status, roomId } = req.body;

    const scheduledClass = await NewClass.findById(classId).populate('course');
    if (!scheduledClass) {
        throw new ApiError(404, "Class not found");
    }

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this class");
    }

    const updatedClass = await NewClass.findByIdAndUpdate(
        classId,
        { 
            $set: { 
                title, 
                classTime, 
                status,
                roomId // Allow updating room ID if needed (rare)
            } 
        },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
});

// --- Delete Class ---
const deleteClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;

    const scheduledClass = await NewClass.findById(classId).populate('course');
    if (!scheduledClass) {
        throw new ApiError(404, "Class not found");
    }

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this class");
    }

    await NewClass.findByIdAndDelete(classId);

    return res.status(200).json(new ApiResponse(200, {}, "Class deleted successfully"));
});

// --- Get All Classes for a Course ---
const getClassesForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const isCoach = course.coach.toString() === req.user._id.toString();
    const isEnrolled = course.students.some(studentId => studentId.toString() === req.user._id.toString());

    if (!isCoach && !isEnrolled) {
        throw new ApiError(403, "You are not authorized to view classes for this course");
    }

    const classes = await NewClass.find({
        course: courseId,
        status: { $in: ['scheduled', 'completed'] } 
    }).sort({ classTime: 'asc' });

    return res.status(200).json(new ApiResponse(200, classes, "Classes retrieved successfully"));
});

export {
    scheduleClass,
    updateClass,
    deleteClass,
    getClassesForCourse
};