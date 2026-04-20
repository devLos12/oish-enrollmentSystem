import Program from "../model/program.js";

// ─────────────────────────────────────────
// GET all programs (tracks + strands)
// ─────────────────────────────────────────
export const getAllPrograms = async (req, res) => {
    try {
        const programs = await Program.find().sort({ createdAt: -1 });
        res.status(200).json(programs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch programs: " + error.message });
    }
};


// ─────────────────────────────────────────
// GET active programs only (for dropdowns)
// ─────────────────────────────────────────
export const getActivePrograms = async (req, res) => {
    try {
        const programs = await Program.find({ isActive: true }).sort({ trackName: 1 });
        res.status(200).json(programs);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch active programs: " + error.message });
    }
};

// ─────────────────────────────────────────
// CREATE track
// ─────────────────────────────────────────
export const createTrack = async (req, res) => {
    try {
        const { trackName } = req.body;

        if (!trackName?.trim()) {
            return res.status(400).json({ message: "Track name is required" });
        }

        const existing = await Program.findOne({ trackName: { $regex: new RegExp(`^${trackName.trim()}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: "Track already exists" });
        }

        const program = new Program({ trackName: trackName.trim(), strands: [] });
        await program.save();

        res.status(201).json({ message: "Track created successfully", program });
    } catch (error) {
        res.status(500).json({ message: "Failed to create track: " + error.message });
    }
};

// ─────────────────────────────────────────
// UPDATE track name / isActive
// ─────────────────────────────────────────
export const updateTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const { trackName, isActive } = req.body;

        const program = await Program.findById(id);
        if (!program) return res.status(404).json({ message: "Track not found" });

        if (trackName !== undefined) program.trackName = trackName.trim();
        if (isActive !== undefined) program.isActive = isActive;

        await program.save();
        res.status(200).json({ message: "Track updated successfully", program });
    } catch (error) {
        res.status(500).json({ message: "Failed to update track: " + error.message });
    }
};


// ─────────────────────────────────────────
// DELETE track
// ─────────────────────────────────────────
export const deleteTrack = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findByIdAndDelete(id);
        if (!program) return res.status(404).json({ message: "Track not found" });

        res.status(200).json({ message: "Track deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete track: " + error.message });
    }
};

// ─────────────────────────────────────────
// ADD strand to a track
// ─────────────────────────────────────────
export const addStrand = async (req, res) => {
    try {
        const { trackId } = req.params;
        const { strandName } = req.body;

        if (!strandName?.trim()) {
            return res.status(400).json({ message: "Strand name is required" });
        }

        const program = await Program.findById(trackId);
        if (!program) return res.status(404).json({ message: "Track not found" });

        const exists = program.strands.some(
            s => s.strandName.toLowerCase() === strandName.trim().toLowerCase()
        );
        if (exists) return res.status(400).json({ message: "Strand already exists in this track" });

        program.strands.push({ strandName: strandName.trim() });
        await program.save();

        res.status(201).json({ message: "Strand added successfully", program });
    } catch (error) {
        res.status(500).json({ message: "Failed to add strand: " + error.message });
    }
};


// ─────────────────────────────────────────
// UPDATE strand
// ─────────────────────────────────────────
export const updateStrand = async (req, res) => {
    try {
        const { trackId, strandId } = req.params;
        const { strandName, isActive } = req.body;

        const program = await Program.findById(trackId);
        if (!program) return res.status(404).json({ message: "Track not found" });

        const strand = program.strands.id(strandId);
        if (!strand) return res.status(404).json({ message: "Strand not found" });

        if (strandName !== undefined) strand.strandName = strandName.trim();
        if (isActive !== undefined) strand.isActive = isActive;

        await program.save();
        res.status(200).json({ message: "Strand updated successfully", program });
    } catch (error) {
        res.status(500).json({ message: "Failed to update strand: " + error.message });
    }
};

// ─────────────────────────────────────────
// DELETE strand
// ─────────────────────────────────────────
export const deleteStrand = async (req, res) => {
    try {
        const { trackId, strandId } = req.params;

        const program = await Program.findById(trackId);
        if (!program) return res.status(404).json({ message: "Track not found" });

        const strand = program.strands.id(strandId);
        if (!strand) return res.status(404).json({ message: "Strand not found" });

        strand.deleteOne();
        await program.save();

        res.status(200).json({ message: "Strand deleted successfully", program });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete strand: " + error.message });
    }
};