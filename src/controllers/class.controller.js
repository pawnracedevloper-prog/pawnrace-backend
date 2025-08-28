import { Class } from "../models/class.model.js";
import { Course } from "../models/course.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const scheduleClass = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, classTime, zoomLink } = req.body;

    if (!title || !classTime || !zoomLink) {
        throw new ApiError(400, "Title, class time, and Zoom link are required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to schedule classes for this course");
    }

    const newClass = await Class.create({
        title,
        classTime,
        zoomLink,
        course: courseId
        // The 'status' field defaults to 'scheduled' from the model
    });

    return res.status(201).json(new ApiResponse(201, newClass, "Class scheduled successfully"));
});

const updateClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { title, classTime, zoomLink, status } = req.body;

    const scheduledClass = await Class.findById(classId).populate('course');
    if (!scheduledClass) {
        throw new ApiError(404, "Class not found");
    }

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this class");
    }

    const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $set: { title, classTime, zoomLink, status } }, // Also allow updating status
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
});

const deleteClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;

    const scheduledClass = await Class.findById(classId).populate('course');
    if (!scheduledClass) {
        throw new ApiError(404, "Class not found");
    }

    if (scheduledClass.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this class");
    }

    await Class.findByIdAndDelete(classId);

    return res.status(200).json(new ApiResponse(200, {}, "Class deleted successfully"));
});

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

    const classes = await Class.find({
        course: courseId,
        status: { $in: ['scheduled', 'completed'] } // Fetch only non-archived classes
    }).sort({ classTime: 'asc' });

    return res.status(200).json(new ApiResponse(200, classes, "Classes retrieved successfully"));
});

export {
    scheduleClass,
    updateClass,
    deleteClass,
    getClassesForCourse
};