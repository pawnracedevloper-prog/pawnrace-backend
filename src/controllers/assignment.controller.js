import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';

// --- COACH: Create an assignment for a specific course ---
export const createAssignment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, assignmentLink } = req.body;
    const coachId = req.user._id;

    if (!title || !assignmentLink) {
        throw new ApiError(400, "Title and assignment link are required.");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    // Security Check: Ensure the user creating the assignment is the actual coach of the course.
    if (course.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "You are not authorized to add assignments to this course.");
    }

    const assignment = await Assignment.create({
        course: courseId,
        coach: coachId,
        title,
        assignmentLink
    });

    return res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully."));
});

// --- COACH: Delete an assignment they created ---
export const deleteAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const coachId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    // Security Check: Ensure the user deleting the assignment is the one who created it.
    if (assignment.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this assignment.");
    }
    
    await Assignment.findByIdAndDelete(assignmentId);
    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted successfully."));
});

// --- STUDENT & COACH: Get all assignments for a specific course ---
export const getAssignmentsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }
    
    const assignments = await Assignment.find({ course: courseId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, assignments, "Assignments retrieved successfully."));
});

// --- STUDENT: Update the status of an assignment (e.g., mark as "completed") ---
export const updateAssignmentStatus = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { status } = req.body;
    const studentId = req.user._id;

    if (!status || !['assigned', 'completed'].includes(status)) {
        throw new ApiError(400, "Invalid status provided. Must be 'assigned' or 'completed'.");
    }

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    // Security Check: Ensure the student updating the status is actually enrolled in the course.
    const isEnrolled = assignment.course.students.some(id => id.toString() === studentId.toString());
    if (!isEnrolled) {
        throw new ApiError(403, "You are not enrolled in the course for this assignment.");
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        { $set: { status: status } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedAssignment, "Assignment status updated."));
});

