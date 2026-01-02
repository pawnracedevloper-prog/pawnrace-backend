import { Tournament } from '../models/tournament.model.js';

// Get all tournaments
export const getTournaments = async (req, res) => {
    try {
        // Sort by date (newest first)
        const tournaments = await Tournament.find().sort({ date: -1 });
        return res.status(200).json(tournaments);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Create Tournament
export const createTournament = async (req, res) => {
    try {
        const { name, date, link } = req.body;
        if (!name || !date || !link) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }
        const newTournament = await Tournament.create({
            name,
            date,
            link,
            status: 'active' // Explicitly set active
        });
        return res.status(201).json(newTournament);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete Tournament
export const deleteTournament = async (req, res) => {
    try {
        const { id } = req.params;
        await Tournament.findByIdAndDelete(id);
        return res.status(200).json({ message: "Tournament deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Mark as Completed (Update Winner & Review)
export const markTournamentCompleted = async (req, res) => {
    try {
        const { id } = req.params;
        const { winner, review } = req.body;

        const updatedTournament = await Tournament.findByIdAndUpdate(
            id,
            { 
                status: 'completed',
                winner: winner || "NA",
                review: review || "NA"
            },
            { new: true } // Return the updated document
        );

        return res.status(200).json(updatedTournament);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};