import Enrollment from "../model/enrollment.js";

// Dashboard stats: total, studentType, gender
export const getEnrollmentStats = async (req, res) => {
  try {
    const totalStudents = await Enrollment.countDocuments();

    // By studentType
    const regularStudents = await Enrollment.countDocuments({ studentType: "regular" });
    const returnees = await Enrollment.countDocuments({ studentType: "returnee" });
    const transferees = await Enrollment.countDocuments({ studentType: "transferee" });

    // By gender (from learnerInfo.sex)
    const maleStudents = await Enrollment.countDocuments({ "learnerInfo.sex": "Male" });
    const femaleStudents = await Enrollment.countDocuments({ "learnerInfo.sex": "Female" });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        regularStudents,
        returnees,
        transferees,
        maleStudents,
        femaleStudents
      }
    });
  } catch (error) {
    console.error("Error fetching enrollment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment statistics",
      error: error.message
    });
  }
};

// Stats by gradeLevelToEnroll
export const getEnrollmentStatsByGrade = async (req, res) => {
  try {
    const stats = await Enrollment.aggregate([
      {
        $group: {
          _id: "$gradeLevelToEnroll",
          total: { $sum: 1 },
          regular: { $sum: { $cond: [{ $eq: ["$studentType", "regular"] }, 1, 0] } },
          returnees: { $sum: { $cond: [{ $eq: ["$studentType", "returnee"] }, 1, 0] } },
          transferees: { $sum: { $cond: [{ $eq: ["$studentType", "transferee"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching enrollment stats by grade:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment stats by grade",
      error: error.message
    });
  }
};

// Stats by seniorHigh.track (for SHS students)
export const getEnrollmentStatsByTrack = async (req, res) => {
  try {
    const allTracks = ["Academic", "TVL"];

    const stats = await Enrollment.aggregate([
      { $match: { "seniorHigh.track": { $exists: true, $ne: null } } },
      { $group: { _id: "$seniorHigh.track", count: { $sum: 1 } } }
    ]);

    const statsMap = {};
    stats.forEach(item => { if(item._id) statsMap[item._id] = item.count; });

    const result = allTracks.map(track => ({ name: track, count: statsMap[track] || 0 }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching enrollment stats by track:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment stats by track",
      error: error.message
    });
  }
};

// Stats by seniorHigh.strand (for SHS students)
export const getEnrollmentStatsByStrand = async (req, res) => {
  try {
    const allStrands = ["STEM", "ABM", "HUMSS", "GAS", "ICT", "Home Economics", "Industrial Arts"];

    const stats = await Enrollment.aggregate([
      { $match: { "seniorHigh.strand": { $exists: true, $ne: null } } },
      { $group: { _id: "$seniorHigh.strand", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statsMap = {};
    stats.forEach(item => { if(item._id) statsMap[item._id] = item.count; });

    const result = allStrands.map(strand => ({ name: strand, count: statsMap[strand] || 0 }));
    result.sort((a,b) => b.count - a.count);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching enrollment stats by strand:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment stats by strand",
      error: error.message
    });
  }
};
