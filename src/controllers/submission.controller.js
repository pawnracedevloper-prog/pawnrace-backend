import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createSubmission = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { submittedContent } = req.body;
    const studentId = req.user._id;

    if (!submittedContent) {
        throw new ApiError(400, "Submission content is required");
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    // Check if the student is enrolled in the course for this assignment
    const course = await Course.findById(assignment.course);
    if (!course.students.includes(studentId)) {
        throw new ApiError(403, "You are not enrolled in the course for this assignment");
    }

    // Check if the student has already submitted for this assignment
    const existingSubmission = await Submission.findOne({ assignment: assignmentId, student: studentId });
    if (existingSubmission) {
        throw new ApiError(409, "You have already submitted this assignment");
    }

    const submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        submittedContent
    });

    return res.status(201).json(new ApiResponse(201, submission, "Assignment submitted successfully"));
});

//coach reviews a submission
const reviewSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { status, feedback } = req.body;

    if (!status || !['pass', 'fail'].includes(status)) {
        throw new ApiError(400, "A valid status ('pass' or 'fail') is required");
    }

    const submission = await Submission.findById(submissionId).populate({
        path: 'assignment',
        populate: { path: 'course' }
    });

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    // Verify the logged-in user is the coach of the course
    if (submission.assignment.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to review this submission");
    }

    submission.status = status;
    submission.feedback = feedback || ""; 
    await submission.save();

    return res.status(200).json(new ApiResponse(200, submission, "Submission reviewed successfully"));
});

const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const user = req.user;

    const query = { assignment: assignmentId };

    // If the user is a student, they can only see their own submission
    if (user.role === 'student') {
        query.student = user._id;
    }

    const submissions = await Submission.find(query).populate('student', 'username fullname');

    return res.status(200).json(new ApiResponse(200, submissions, "Submissions retrieved successfully"));
});

export {
    createSubmission,
    reviewSubmission,
    getSubmissionsForAssignment
};