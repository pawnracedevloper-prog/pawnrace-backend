import { Training } from "../models/training-session.model.js"; 
import { Course } from "../models/course.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- Schedule a New Class ---
const scheduleClass = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    // We only care about title, time, and the internal roomId
    const { title, classTime, roomId } = req.body;

    if (!title || !classTime) {
        throw new ApiError(400, "Title and class time are required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to schedule classes for this course");
    }

    // [FIX] Variable name is now 'createdSession' to prevent ReferenceErrors
    const createdSession = await Training.create({
        title,
        classTime,
        roomId: roomId || `session-${Date.now()}`, // Fallback generation if frontend misses it
        platform: 'internal',
        course: courseId,
        status: 'scheduled'
    });

    return res.status(201).json(new ApiResponse(201, createdSession, "Class scheduled successfully"));
});

// --- Update Class ---
const updateClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { status } = req.body; 

    const scheduledClass = await Training.findById(classId).populate('course');
    if (!scheduledClass) throw new ApiError(404, "Class not found");

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    scheduledClass.status = status || scheduledClass.status;
    await scheduledClass.save();

    return res.status(200).json(new ApiResponse(200, scheduledClass, "Class updated"));
});

// --- Delete Class ---
const deleteClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const scheduledClass = await Training.findById(classId).populate('course');
    
    if (!scheduledClass) throw new ApiError(404, "Class not found");

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    await Training.findByIdAndDelete(classId);

    return res.status(200).json(new ApiResponse(200, {}, "Class deleted"));
});

// --- Get Classes ---
const getClassesForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");

    // Authorization: Coach OR Student
    const isCoach = course.coach.toString() === req.user._id.toString();
    const isStudent = course.students.includes(req.user._id);

    if (!isCoach && !isStudent) {
        // Optional: throw new ApiError(403, "Unauthorized");
    }

    const classes = await Training.find({ course: courseId }).sort({ classTime: 1 });

    return res.status(200).json(new ApiResponse(200, classes, "Classes retrieved"));
});

// --- Get Class By Room ID ---
const getClassByRoomId = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const session = await Training.findOne({ roomId }).populate('course');
    
    if (!session) throw new ApiError(404, "Session not found");

    return res.status(200).json(new ApiResponse(200, session, "Session details"));
});

export {
    scheduleClass,
    updateClass,
    deleteClass,
    getClassesForCourse,
    getClassByRoomId
};