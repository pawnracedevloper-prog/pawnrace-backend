import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Submission } from '../models/submission.model.js'; 
import { Course } from '../models/course.model.js';
import { User } from "../models/user.model.js"; 

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
    const userRole = req.user.role; 

    const assignments = await Assignment.find({ course: courseId }).sort({ createdAt: -1 });

    // If Coach: Just return assignments
    if (userRole === 'coach') {
        return res.status(200).json(new ApiResponse(200, assignments, "Assignments retrieved."));
    }

    // If Student: Attach their progress (Submission object)
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

// --- STUDENT: Mark a specific task as Solved ---
export const solveTask = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
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
            solvedTasks: [] 
        });
    }

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
    
    // When the coach passes the student:
    if (status === 'pass' && !submission.pointsAwarded) {
        
        const updateQuery = {
            // Add assignment to completed list (prevents double counting)
            $addToSet: { "completions.assignments": submission.assignment._id }
        };

        // Add points if the assignment has a reward
        if (submission.assignment?.rewardPoints > 0) {
            updateQuery.$inc = { "stats.shopPoints": submission.assignment.rewardPoints };
        }

        await User.findByIdAndUpdate(submission.student, updateQuery);
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