import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js"; 
// --- STUDENT: Mark a specific task as Solved ---
export const solveTask = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    // [UPDATED] Now accepting the off-script parameters
    const { chapterId, isCorrect = true, overridePgn = null } = req.body; 
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
            solvedTasks: [] // [UPDATED] Using the new array name
        });
    }

    // [UPDATED] Check if task is already solved using the new object structure
    const taskIndex = submission.solvedTasks.findIndex(t => t.taskId === chapterId);

    if (taskIndex === -1) {
        // Task is new, push the full object
        submission.solvedTasks.push({
            taskId: chapterId,
            isCorrect: isCorrect,
            overridePgn: overridePgn
        });
        
        // Auto-update status to 'submitted' if all tasks are done
        if (submission.solvedTasks.length === assignment.tasks.length) {
             submission.status = 'submitted';
        }
        
        await submission.save();
    } else {
        // Optional: If they replay it and want to overwrite their previous attempt
        // submission.solvedTasks[taskIndex].isCorrect = isCorrect;
        // submission.solvedTasks[taskIndex].overridePgn = overridePgn;
        // await submission.save();
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
    if (status === 'pass' && !submission.pointsAwarded && submission.assignment?.rewardPoints > 0) {
        await User.findByIdAndUpdate(submission.student, { 
            $inc: { totalPoints: submission.assignment.rewardPoints } 
        });
        submission.pointsAwarded = true;
    }
    await submission.save();

    return res.status(200).json(new ApiResponse(200, submission, "Review submitted"));
});

// --- COACH: View all submissions for an assignment ---
export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);

    const submissions = await Submission.find({ assignment: assignmentId })
        .populate('student', 'username fullname email')
        .sort({ updatedAt: -1 });

    // [UPDATED] Calculate progress using the new solvedTasks array
    const result = submissions.map(sub => ({
        ...sub.toObject(),
        progress: `${sub.solvedTasks?.length || 0} / ${assignment.tasks.length}`
    }));

    return res.status(200).json(new ApiResponse(200, result, "Submissions retrieved"));
});

// --- STUDENT: Finalize and Submit Assignment ---
export const submitAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const submission = await Submission.findOne({ assignment: assignmentId, student: studentId });
    
    if (!submission) {
        throw new ApiError(404, "Submission not found. You must solve at least one task first.");
    }

    submission.status = 'submitted';
    await submission.save();

    return res.status(200).json(new ApiResponse(200, submission, "Assignment successfully submitted to coach."));
});