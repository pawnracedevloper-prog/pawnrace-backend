import { Syllabus } from '../models/syllabus.model.js';
import { Technique } from '../models/technique.model.js';
import { Course } from '../models/course.model.js';
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const LEVEL_ORDER = [
    'Beginner 1', 'Beginner 2', 'Beginner 3', 
    'Intermediate 1', 'Intermediate 2', 'Intermediate 3', 
    'Advanced 1', 'Advanced 2', 'Advanced 3', 'Master'
];

// --- 1. ADD TECHNIQUE (Container Only) ---
export const addTechnique = async (req, res) => {
    try {
        const { level, name, description } = req.body;

        const newTechnique = await Technique.create({ name, description, chapters: [] });

        const updatedSyllabus = await Syllabus.findOneAndUpdate(
            { level: level }, 
            { $addToSet: { techniques: newTechnique._id } },
            { new: true, upsert: true } 
        );

        res.status(201).json(new ApiResponse(201, newTechnique, "Technique container created"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 2. ADD CHAPTER (To Existing Technique) ---
export const addChapter = async (req, res) => {
    try {
        const { techniqueId, pgn } = req.body;

        const technique = await Technique.findById(techniqueId);
        if (!technique) throw new ApiError(404, "Technique not found");

        // Auto-Name: "Chapter X" based on current length
        const nextNum = technique.chapters.length + 1;
        const name = `Chapter ${nextNum}`;

        technique.chapters.push({ name, pgn });
        await technique.save();

        res.status(200).json(new ApiResponse(200, technique, "Chapter added"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 3. GET SYLLABUS (With Chapter Progress) ---
export const getSyllabusForCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { level } = req.query;
        
        let course = await Course.findById(courseId);
        if (!course) throw new ApiError(404, "Course not found");

        const targetLevel = level || course.level || "Beginner 1";

        // Auto-Sync Logic
        let masterSyllabus = await Syllabus.findOne({ level: targetLevel });
        if (!masterSyllabus) masterSyllabus = await Syllabus.create({ level: targetLevel, techniques: [] });

        if (course.syllabus?.toString() !== masterSyllabus._id.toString()) {
            course.syllabus = masterSyllabus._id;
            await course.save();
        }

        await course.populate({ path: 'syllabus', populate: { path: 'techniques' } });

        // Completed Chapters Bucket
        const completedChapters = (course.completedChapters || []).map(id => id.toString());

        // Map Data
        const techniquesWithStatus = course.syllabus.techniques.map(tech => {
            // Map chapters with status
            const chaptersWithStatus = tech.chapters.map(ch => ({
                _id: ch._id,
                name: ch.name,
                pgn: ch.pgn,
                status: completedChapters.includes(ch._id.toString()) ? 'completed' : 'pending'
            }));

            return {
                _id: tech._id,
                name: tech.name,
                description: tech.description,
                chapters: chaptersWithStatus
            };
        });

        res.status(200).json(new ApiResponse(200, techniquesWithStatus, `Syllabus for ${targetLevel}`));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 4. TOGGLE CHAPTER & LEVEL UP ---
export const toggleChapter = async (req, res) => {
    try {
        const { courseId, chapterId } = req.body;

        const course = await Course.findById(courseId).populate({
            path: 'syllabus',
            populate: { path: 'techniques' }
        });
        if (!course) throw new ApiError(404, "Course not found");

        if (!course.completedChapters) course.completedChapters = [];

        const index = course.completedChapters.indexOf(chapterId);
        let status = '';
        let leveledUp = false;
        let nextLevelName = '';

        if (index === -1) {
            // MARK COMPLETE
            course.completedChapters.push(chapterId);
            status = 'completed';

            // --- LEVEL UP CHECK ---
            // 1. Flatten all chapters in this level into one array of IDs
            const allChapterIds = course.syllabus.techniques.reduce((acc, tech) => {
                return acc.concat(tech.chapters.map(c => c._id.toString()));
            }, []);

            // 2. Count matches
            const completedCount = allChapterIds.filter(id => 
                course.completedChapters.map(String).includes(id)
            ).length;

            // 3. Promote if all done (and chapters exist)
            if (allChapterIds.length > 0 && completedCount === allChapterIds.length) {
                const currentIdx = LEVEL_ORDER.indexOf(course.level);
                if (currentIdx !== -1 && currentIdx < LEVEL_ORDER.length - 1) {
                    nextLevelName = LEVEL_ORDER[currentIdx + 1];
                    const nextSyllabus = await Syllabus.findOne({ level: nextLevelName });
                    if (nextSyllabus) {
                        course.level = nextLevelName;
                        course.syllabus = nextSyllabus._id;
                        leveledUp = true;
                    }
                }
            }
        } else {
            // UNDO
            course.completedChapters.splice(index, 1);
            status = 'pending';
        }

        await course.save();
        res.status(200).json(new ApiResponse(200, { chapterId, status, leveledUp, nextLevelName }, "Progress updated"));

    } catch (error) {
        console.error("Toggle Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ... (Get All/Global remain similar, just ensuring they populate properly)
export const getAllSyllabus = async (req, res) => {
    // ... same as before
    const all = await Syllabus.find().populate('techniques').sort({ level: 1 });
    res.status(200).json(new ApiResponse(200, all, "Fetched"));
};
export const getGlobalSyllabus = async (req, res) => {
    // ... same as before
    const s = await Syllabus.findOne({ level: req.params.level }).populate('techniques');
    res.status(200).json(new ApiResponse(200, s || { techniques: [] }, "Fetched"));
};