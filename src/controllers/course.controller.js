import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Syllabus } from "../models/syllabus.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ==========================================
// COURSE MANAGEMENT (COACH)
// ==========================================

const createCourse = asyncHandler(async (req, res) => {
  const { title, description, syllabusId, studentIds } = req.body;

  if (!title || !syllabusId) {
    throw new ApiError(400, "Title and syllabus are required");
  }

  // Fast existence check without hydrating full syllabus document
  const syllabusExists = await Syllabus.exists({ _id: syllabusId });
  if (!syllabusExists) {
    throw new ApiError(404, "Syllabus not found");
  }

  let validStudentIds = [];
  if (studentIds && studentIds.length > 0) {
    // Only select _id to validate presence rapidly
    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    })
      .select("_id")
      .lean();

    if (students.length !== studentIds.length) {
      throw new ApiError(
        400,
        "One or more provided student IDs are invalid or do not belong to a student."
      );
    }
    validStudentIds = students.map((s) => s._id);
  }

  const course = await Course.create({
    title,
    description,
    syllabus: syllabusId,
    coach: req.user._id,
    students: validStudentIds,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, course, "Course created successfully"));
});

const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  // Single atomic find and update scoped to the authorized coach
  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, coach: req.user._id },
    { $set: { title, description } },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedCourse) {
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }
    throw new ApiError(403, "You are not authorized to update this course");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

const deleteCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Single atomic deletion scoped to the authorized coach
  const deletedCourse = await Course.findOneAndDelete({
    _id: courseId,
    coach: req.user._id,
  }).lean();

  if (!deletedCourse) {
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }
    throw new ApiError(403, "You are not authorized to delete this course");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Course deleted successfully"));
});

const addStudentToCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { studentId } = req.body;

  // Check student validity with a lightweight projection
  const studentExists = await User.exists({ _id: studentId, role: "student" });
  if (!studentExists) {
    throw new ApiError(404, "Student not found or is not a valid student");
  }

  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, coach: req.user._id },
    { $addToSet: { students: studentId } },
    { new: true }
  ).lean();

  if (!updatedCourse) {
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }
    throw new ApiError(403, "You are not authorized to modify this course");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Student added successfully"));
});

const removeStudentFromCourse = asyncHandler(async (req, res) => {
  const { courseId, studentId } = req.params;

  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, coach: req.user._id },
    { $pull: { students: studentId } },
    { new: true }
  ).lean();

  if (!updatedCourse) {
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }
    throw new ApiError(403, "You are not authorized to modify this course");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Student removed successfully"));
});

// ==========================================
// COURSE & SYLLABUS QUERIES (OPTIMIZED READS)
// ==========================================

const getMyCoursesAsCoach = asyncHandler(async (req, res) => {
    const courses = await Course.find({ coach: req.user._id })
        .populate("students", "username fullname email")
        .populate({
            path: "syllabus",
            select: "level title", // Add select here
            populate: {
                path: "techniques",
                select: "name description" // EXCLUDE chapters and PGNs here
            }
        })
        .lean();
        
    return res.status(200).json(new ApiResponse(200, courses, "Fetched"));
});

const getAllSyllabi = asyncHandler(async (req, res) => {
  const syllabi = await Syllabus.find({})
    .populate("techniques", "name lichessUrl")
    .lean();

  if (!syllabi || syllabi.length === 0) {
    throw new ApiError(404, "No syllabi found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, syllabi, "Syllabi retrieved successfully"));
});

const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({})
    .populate("coach", "username fullname")
    .populate({
      path: "syllabus",
      select: "level title",
    })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, courses, "All courses retrieved successfully"));
});

const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId)
    .populate("coach", "username fullname")
    .populate("students", "username fullname")
    .populate({
      path: "syllabus",
      populate: {
        path: "techniques",
        select: "name lichessUrl description category",
      },
    })
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course details retrieved successfully"));
});

const getMyEnrolledCoursesAsStudent = asyncHandler(async (req, res) => {
  const courses = await Course.find({ students: req.user._id })
    .populate("coach", "username fullname")
    .populate({
      path: "syllabus",
      populate: {
        path: "techniques",
        select: "name lichessUrl description category",
      },
    })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(200, courses, "Enrolled courses retrieved successfully")
    );
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
  getMyEnrolledCoursesAsStudent,
};