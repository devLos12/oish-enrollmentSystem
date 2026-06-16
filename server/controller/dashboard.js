import Enrollment from "../model/enrollment.js";
import Program from "../model/program.js";




// GET /api/studentsByCategory
export const getStudentsByCategory = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    const categoryFilterMap = {
      regular:    { studentType: "regular" },
      returnee:   { studentType: "returnee" },
      transferee: { studentType: "transferee" },
      pwd:        { "learnerInfo.learnerWithDisability.isDisabled": true },
      indigenous: { "learnerInfo.indigenousCommunity.isMember": true },
      fourps:     { "learnerInfo.fourPs.isBeneficiary": true },
    };

    const categoryFilter = categoryFilterMap[category];
    if (!categoryFilter) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const students = await Enrollment.find(
      { ...dateFilter, ...categoryFilter },
      {
        "learnerInfo.lastName": 1,
        "learnerInfo.firstName": 1,
        "learnerInfo.middleName": 1,
        "learnerInfo.lrn": 1,
        "learnerInfo.sex": 1,
        "seniorHigh.strand": 1,
        "seniorHigh.track": 1,
        gradeLevelToEnroll: 1,
        studentType: 1,
        status: 1,
      }
    ).sort({ "learnerInfo.lastName": 1 });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching students by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students by category",
      error: error.message
    });
  }
};



// Dashboard stats: total, studentType, gender, PWD, Indigenous, 4Ps (with date range support)
export const getEnrollmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
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

    // By gender
    const maleStudents = await Enrollment.countDocuments({ 
      ...dateFilter, 
      "learnerInfo.sex": "Male" 
    });
    const femaleStudents = await Enrollment.countDocuments({ 
      ...dateFilter, 
      "learnerInfo.sex": "Female" 
    });

    // ✅ PWD Students
    const pwdStudents = await Enrollment.countDocuments({
      ...dateFilter,
      "learnerInfo.learnerWithDisability.isDisabled": true
    });

    // ✅ Indigenous Students
    const indigenousStudents = await Enrollment.countDocuments({
      ...dateFilter,
      "learnerInfo.indigenousCommunity.isMember": true
    });

    // ✅ 4Ps Beneficiaries
    const fourPsStudents = await Enrollment.countDocuments({
      ...dateFilter,
      "learnerInfo.fourPs.isBeneficiary": true
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        regularStudents,
        returnees,
        transferees,
        maleStudents,
        femaleStudents,
        pwdStudents,
        indigenousStudents,
        fourPsStudents
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









// Stats by seniorHigh.strand (dynamically fetched from Program collection, with date range support)
export const getEnrollmentStatsByStrand = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // ✅ Fetch active strands dynamically from Program collection
    const activePrograms = await Program.find({ isActive: true });
    const allStrands = [];
    activePrograms.forEach(program => {
      program.strands.forEach(strand => {
        if (strand.isActive) {
          allStrands.push(strand.strandName);
        }
      });
    });

    // If no active programs/strands, return empty array
    if (allStrands.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

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

    // Only include active strands in result
    const result = allStrands.map(strand => ({ name: strand, count: statsMap[strand] || 0 }));
    result.sort((a, b) => b.count - a.count);

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