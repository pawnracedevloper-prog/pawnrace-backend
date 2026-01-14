import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Submission } from '../models/submission.model.js'; 
import { Course } from '../models/course.model.js';

// --- COACH: Create Assignment with Syllabus Tasks ---
export const createAssignment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, tasks } = req.body; 
    const coachId = req.user._id;

    if (!title || !tasks || tasks.length === 0) {
        throw new ApiError(400, "Title and at least one task are required.");
    }

    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");

    if (course.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "Unauthorized.");
    }

    const assignment = await Assignment.create({
        course: courseId,
        coach: coachId,
        title,
        description,
        tasks 
    });

    return res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully."));
});

// --- COACH: Delete ---
export const deleteAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const coachId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new ApiError(404, "Assignment not found.");

    if (assignment.coach.toString() !== coachId.toString()) {
        throw new ApiError(403, "Unauthorized.");
    }
    
    // Cleanup submissions
    await Submission.deleteMany({ assignment: assignmentId });
    await Assignment.findByIdAndDelete(assignmentId);

    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted."));
});

// --- SHARED: Get Assignments (With Student Progress) ---
export const getAssignmentsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role; // Assuming role is in req.user

    const assignments = await Assignment.find({ course: courseId }).sort({ createdAt: -1 });

    // If Coach: Just return assignments
    if (userRole === 'coach') {
        return res.status(200).json(new ApiResponse(200, assignments, "Assignments retrieved."));
    }

    // If Student: Attach their progress (Submission object)
    // This lets the frontend show "2/5 Solved" or "Feedback: Good Job"
    const result = await Promise.all(assignments.map(async (assign) => {
        const sub = await Submission.findOne({ assignment: assign._id, student: userId });
        return {
            ...assign.toObject(),
            mySubmission: sub || null 
        };
    }));

    return res.status(200).json(new ApiResponse(200, result, "Assignments retrieved with progress."));
});

export const getAssignmentById = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const userId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    // Attach the student's submission (progress) if it exists
    const submission = await Submission.findOne({ 
        assignment: assignmentId, 
        student: userId 
    });

    const result = {
        ...assignment.toObject(),
        mySubmission: submission || null
    };

    return res.status(200).json(new ApiResponse(200, result, "Assignment retrieved successfully."));
});