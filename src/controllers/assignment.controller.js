import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createAssignment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { techniqueId, description, dueDate, solution } = req.body;

    if (!techniqueId || !description || !dueDate) {
        throw new ApiError(400, "A technique, description, and due date are required");
    }

    const course = await Course.findById(courseId).populate('syllabus');
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to add assignments to this course");
    }

    const isTechniqueInSyllabus = course.syllabus.techniques.some(id => id.toString() === techniqueId);
    if (!isTechniqueInSyllabus) {
        throw new ApiError(400, "The selected technique is not part of this course's syllabus");
    }

    const assignment = await Assignment.create({
        technique: techniqueId,
        course: courseId,
        description,
        dueDate,
        solution
    });

    return res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully"));
});

const updateAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { description, dueDate, solution } = req.body;

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    if (assignment.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this assignment");
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        { $set: { description, dueDate, solution } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedAssignment, "Assignment updated successfully"));
});

const deleteAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    if (assignment.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this assignment");
    }

    await Assignment.findByIdAndDelete(assignmentId);

    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted successfully"));
});

const getAssignmentsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const assignments = await Assignment.find({ course: courseId }).populate('technique', 'name lichessUrl');

    return res.status(200).json(new ApiResponse(200, assignments, "Assignments retrieved successfully"));
});


export {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsForCourse
};