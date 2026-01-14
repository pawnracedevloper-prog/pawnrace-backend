import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- STUDENT: Mark a specific task as Solved ---
// Frontend calls this when the board logic confirms the move was correct
export const solveTask = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { chapterId } = req.body; // The ID of the puzzle solved
    const studentId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    // Find or Create Submission
    let submission = await Submission.findOne({ assignment: assignmentId, student: studentId });
    
    if (!submission) {
        submission = await Submission.create({
            assignment: assignmentId,
            student: studentId,
            status: 'pending',
            solvedTaskIds: []
        });
    }

    // Add task to solved list if unique
    if (!submission.solvedTaskIds.includes(chapterId)) {
        submission.solvedTaskIds.push(chapterId);
        
        // Auto-update status to 'submitted' if all tasks are done?
        // Optional logic:
        if (submission.solvedTaskIds.length === assignment.tasks.length) {
             submission.status = 'submitted';
        }
        
        await submission.save();
    }

    return res.status(200).json(new ApiResponse(200, submission, "Progress saved"));
});

// --- COACH: Review Submission (Feedback + Pass/Fail) ---
export const reviewSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { status, feedback } = req.body;

    if (!status || !['pass', 'fail'].includes(status)) {
        throw new ApiError(400, "Valid status ('pass' or 'fail') is required");
    }

    const submission = await Submission.findById(submissionId).populate({
        path: 'assignment',
        populate: { path: 'course' }
    });

    if (!submission) throw new ApiError(404, "Submission not found");

    // Auth check
    if (submission.assignment.course.coach.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    submission.status = status;
    submission.feedback = feedback || "";
    await submission.save();

    return res.status(200).json(new ApiResponse(200, submission, "Review submitted"));
});

// --- COACH: View all submissions for an assignment ---
export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    
    // We get the assignment to check task count
    const assignment = await Assignment.findById(assignmentId);

    const submissions = await Submission.find({ assignment: assignmentId })
        .populate('student', 'username fullname email')
        .sort({ updatedAt: -1 });

    // Helper: Calculate progress % for the frontend
    const result = submissions.map(sub => ({
        ...sub.toObject(),
        progress: `${sub.solvedTaskIds.length} / ${assignment.tasks.length}`
    }));

    return res.status(200).json(new ApiResponse(200, result, "Submissions retrieved"));
});