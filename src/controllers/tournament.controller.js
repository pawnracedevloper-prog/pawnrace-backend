import { Tournament } from '../models/tournament.model.js';

export const getTournaments = async (req, res) => {
    try {
        // Sort by date (newest first)
        const tournaments = await Tournament.find().sort({ date: 1 });
        return res.status(200).json(tournaments);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const createTournament = async (req, res) => {
    try {
        const { name, date, link } = req.body;

        if (!name || !date || !link) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        const newTournament = await Tournament.create({
            name,
            date,
            link
        });

        return res.status(201).json(newTournament);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};