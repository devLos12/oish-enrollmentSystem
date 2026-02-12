import Enrollment from "../model/enrollment.js";

// Dashboard stats: total, studentType, gender (with date range support)
export const getEnrollmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // ✅ Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Include entire end date
        }
      };
    }

    const totalStudents = await Enrollment.countDocuments(dateFilter);

    // By studentType
    const regularStudents = await Enrollment.countDocuments({ 
      ...dateFilter, 
      studentType: "regular" 
    });
    const returnees = await Enrollment.countDocuments({ 
      ...dateFilter, 
      studentType: "returnee" 
    });
    const transferees = await Enrollment.countDocuments({ 
      ...dateFilter, 
      studentType: "transferee" 
    });

    // By gender (from learnerInfo.sex)
    const maleStudents = await Enrollment.countDocuments({ 
      ...dateFilter, 
      "learnerInfo.sex": "Male" 
    });
    const femaleStudents = await Enrollment.countDocuments({ 
      ...dateFilter, 
      "learnerInfo.sex": "Female" 
    });

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

// Stats by gradeLevelToEnroll (with date range support)
export const getEnrollmentStatsByGrade = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // ✅ Build date filter for aggregation
    let matchStage = {};
    if (startDate && endDate) {
      matchStage = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    const pipeline = [];
    
    // Add match stage only if date filter exists
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
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
    );

    const stats = await Enrollment.aggregate(pipeline);

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

// Stats by seniorHigh.track (with date range support)
export const getEnrollmentStatsByTrack = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const allTracks = ["Academic", "TVL"];

    // ✅ Build date filter
    let matchStage = {
      "seniorHigh.track": { $exists: true, $ne: null }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const stats = await Enrollment.aggregate([
      { $match: matchStage },
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

// Stats by seniorHigh.strand (with date range support)
export const getEnrollmentStatsByStrand = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const allStrands = ["STEM", "ABM", "HUMSS", "GAS", "ICT", "Home Economics", "Industrial Arts"];

    // ✅ Build date filter
    let matchStage = {
      "seniorHigh.strand": { $exists: true, $ne: null }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const stats = await Enrollment.aggregate([
      { $match: matchStage },
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