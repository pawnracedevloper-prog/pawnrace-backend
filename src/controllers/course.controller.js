import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Syllabus } from "../models/syllabus.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

//functions for coach

const createCourse = asyncHandler(async (req, res) => {
    // Coach provides title, syllabus, and optionally a list of student IDs
    const { title, description, syllabusId, studentIds } = req.body;

    if (!title || !syllabusId) {
        throw new ApiError(400, "Title and syllabus are required");
    }

    const syllabusExists = await Syllabus.findById(syllabusId);
    if (!syllabusExists) {
        throw new ApiError(404, "Syllabus not found");
    }

    // Optional: Validate the provided student IDs
    let validStudentIds = [];
    if (studentIds && studentIds.length > 0) {
        const students = await User.find({ '_id': { $in: studentIds }, 'role': 'student' });
        if (students.length !== studentIds.length) {
            throw new ApiError(400, "One or more provided student IDs are invalid or do not belong to a student.");
        }
        validStudentIds = students.map(s => s._id);
    }

    const course = await Course.create({
        title,
        description,
        syllabus: syllabusId,
        coach: req.user._id,
        students: validStudentIds // Add the validated students
    });

    return res.status(201).json(new ApiResponse(201, course, "Course created successfully"));
});


const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this course");
    }

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: { title, description } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this course");
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json(new ApiResponse(200, {}, "Course deleted successfully"));
});

const addStudentToCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this course");
    }

    const studentExists = await User.findById(studentId);
    if (!studentExists || studentExists.role !== 'student') {
        throw new ApiError(404, "Student not found");
    }

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { students: studentId } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Student added successfully"));
});

const removeStudentFromCourse = asyncHandler(async (req, res) => {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this course");
    }

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $pull: { students: studentId } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Student removed successfully"));
});

const getMyCoursesAsCoach = asyncHandler(async (req, res) => {
    const courses = await Course.find({ coach: req.user._id })
        .populate("students", "username fullname email")
        .populate({
            path: "syllabus",
            populate: { path: "techniques" }
        });
        
    return res.status(200).json(new ApiResponse(200, courses, "Coach's courses retrieved successfully"));
});

const getAllSyllabi = asyncHandler(async (req, res) => {
    const syllabi = await Syllabus.find({}).populate("techniques", "name lichessUrl");
    if (!syllabi || syllabi.length === 0) {
        throw new ApiError(404, "No syllabi found");
    }
    return res.status(200).json(new ApiResponse(200, syllabi, "Syllabi retrieved successfully"));
});

const getAllCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({})
        .populate("coach", "username fullname")
        .populate({
            path: "syllabus",
            select: "level"
        });

    return res.status(200).json(new ApiResponse(200, courses, "All courses retrieved successfully"));
});

const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
        .populate("coach", "username fullname")
        .populate("students", "username fullname")
        .populate({
            path: "syllabus",
            populate: { path: "techniques" }
        });

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res.status(200).json(new ApiResponse(200, course, "Course details retrieved successfully"));
});

const getMyEnrolledCoursesAsStudent = asyncHandler(async (req, res) => {
    const courses = await Course.find({ students: req.user._id })
        .populate("coach", "username fullname")
        .populate({
            path: "syllabus",
            populate: { path: "techniques" }
        });
        
    return res.status(200).json(new ApiResponse(200, courses, "Enrolled courses retrieved successfully"));
});


export {
    createCourse,
    updateCourse,
    deleteCourse,
    addStudentToCourse,
    removeStudentFromCourse,
    getMyCoursesAsCoach,
    getAllSyllabi,
    getAllCourses,
    getCourseById,
    getMyEnrolledCoursesAsStudent
}