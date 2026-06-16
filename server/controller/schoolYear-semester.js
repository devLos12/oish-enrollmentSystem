import SchoolYear from "../model/schoolYear.js";
import Section from "../model/section.js";
import Student from "../model/student.js";
import Subject from "../model/subject.js";
import { createLogs } from "./logs.js";




export const deleteSchoolYear = async (req, res) => {
  try {
    const { id } = req.params;

    const schoolYear = await SchoolYear.findById(id);
    if (!schoolYear) {
      return res.status(404).json({ message: "School year not found." });
    }    
    await SchoolYear.findByIdAndDelete(id);



    const { id: accountId, role } = req.account;
    await createLogs(
        accountId, role,
        "DELETE SCHOOL YEAR",
        `Deleted school year "${schoolYear.label}"`,
        "Success"
    );
    

    
    res.status(200).json({ message: "School year deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
    






export const getActiveSchoolYear = async (req, res) => {
  try {
    const { role } = req.query;

    let activeSchoolYear = {};

    if(role === 'admin') {
      activeSchoolYear = await SchoolYear.findOne({ isActive: true });
    } 

    if(role === 'staff' || role === 'student') {
      activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
    }


    res.status(200).json({
      success: true,
      data: activeSchoolYear,
      message: "Active school year fetched successfully"
    }); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}




// PATCH /api/set-current-school-year/:id
export const setCurrentSchoolYear = async (req, res) => {
  try {
    const target = await SchoolYear.findById(req.params.id);
    let isOlder = false;
    if (!target) {
      return res.status(404).json({ success: false, message: "School year not found." });
    }

    const previousCurrent = await SchoolYear.findOne({ isCurrent: true });

    if (previousCurrent) {
      if (previousCurrent._id.toString() === target._id.toString()) {
        return res.status(400).json({ 
          success: false, 
          message: "This semester is already the current semester." 
        });
      }

      const targetYear = parseInt(target.schoolYear.split('-')[0]);
      const currentYear = parseInt(previousCurrent.schoolYear.split('-')[0]);

      isOlder = targetYear < currentYear || 
      (targetYear === currentYear && target.semester < previousCurrent.semester);
    }

    await SchoolYear.updateMany({}, { isCurrent: false, isActive: false });
    await SchoolYear.findByIdAndUpdate(req.params.id, { 
      isCurrent: true, 
      isActive: true
    });

    const isConsecutive = previousCurrent ? (() => {
      const prevYear = parseInt(previousCurrent.schoolYear.split('-')[0]);
      const targetYear = parseInt(target.schoolYear.split('-')[0]);
      const prevSem = previousCurrent.semester;
      const targetSem = target.semester;

      if (prevYear === targetYear && prevSem === 1 && targetSem === 2) return true;
      if (targetYear === prevYear + 1 && prevSem === 2 && targetSem === 1) return true;

      return false;
    })() : false;

    if (previousCurrent && !isOlder && isConsecutive) {
      const isNewSchoolYear = previousCurrent.schoolYear !== target.schoolYear;
      const isSem1ToSem2 = previousCurrent.semester === 1 && target.semester === 2;
      const isSem2ToSem1 = previousCurrent.semester === 2 && target.semester === 1;

      // ✅ CASE 1 — Sem 1 → Sem 2 (same school year)
      if (!isNewSchoolYear && isSem1ToSem2) {
        const sem1Sections = await Section.find({
          schoolYear: previousCurrent._id,
          semester: 1
        });

        for (const sec of sem1Sections) {
          const exists = await Section.findOne({
            schoolYear: target._id,
            name: sec.name,
            gradeLevel: sec.gradeLevel,
            track: sec.track,
            strand: sec.strand,
            semester: 2
          });

          if (!exists) {
            const eligibleStudents = await Student.find({
              _id: { $in: sec.students },
              studentType: 'regular'
            }).select('_id');

            const eligibleIds = eligibleStudents.map(s => s._id);

            await Section.create({
              schoolYear: target._id,
              name: sec.name,
              gradeLevel: sec.gradeLevel,
              track: sec.track,
              strand: sec.strand,
              semester: 2,
              maxCapacity: sec.maxCapacity,
              students: eligibleIds
            });
          }
        }

        // ✅ Copy subjects — source: previous SY's 2nd sem (NOT 1st sem ng same SY)
        const prevSYStr = `${parseInt(target.schoolYear.split('-')[0]) - 1}-${parseInt(target.schoolYear.split('-')[1]) - 1}`;
        const prevSecondSem = await SchoolYear.findOne({ schoolYear: prevSYStr, semester: 2 });

        if (prevSecondSem) {
          const subjectsToCopy = await Subject.find({ schoolYear: prevSecondSem._id });

          for (const subj of subjectsToCopy) {
            const exists = await Subject.findOne({
              subjectCode: subj.subjectCode,
              strand: subj.strand,
              gradeLevel: subj.gradeLevel,
              semester: 2,
              schoolYear: target._id
            });

            if (!exists) {
              await Subject.create({
                schoolYear: target._id,
                subjectCode: subj.subjectCode,
                subjectName: subj.subjectName,
                gradeLevel: subj.gradeLevel,
                strand: subj.strand,
                track: subj.track,
                subjectType: subj.subjectType,
                teacherId: subj.teacherId,
                teacher: subj.teacher,
                semester: 2,
                sections: [],
                students: []
              });
            }
          }
        }
        // kung walang prevSecondSem — skip lang, walang mag-copy
      }

      // ✅ CASE 2 — Sem 2 → Sem 1 (new school year)
      else if (isNewSchoolYear && isSem2ToSem1) {
        const sem2Sections = await Section.find({
          schoolYear: previousCurrent._id,
          semester: 2
        });

        for (const sec of sem2Sections) {
          const eligibleStudents = await Student.find({
            _id: { $in: sec.students },
            studentType: 'regular'
          }).select('_id');

          const eligibleIds = eligibleStudents.map(s => s._id);

          if (sec.gradeLevel === 12) {
            await Student.updateMany(
              { _id: { $in: eligibleIds } },
              { $set: { status: "graduated" } }
            );
            continue;
          }

          const exists = await Section.findOne({
            schoolYear: target._id,
            name: sec.name,
            gradeLevel: sec.gradeLevel + 1,
            track: sec.track,
            strand: sec.strand,
            semester: 1
          });

          if (!exists) {
            await Section.create({
              schoolYear: target._id,
              name: sec.name,
              gradeLevel: sec.gradeLevel + 1,
              track: sec.track,
              strand: sec.strand,
              semester: 1,
              maxCapacity: sec.maxCapacity,
              students: eligibleIds
            });
          }
        }

        await Student.updateMany(
          { 
            studentType: 'repeater',
            status: { $nin: ['graduated', 'dropped'] }
          },
          { $set: { hasEnrollmentRequest: true } }
        );

        // ✅ Copy subjects — source: previous SY's 1st sem
        const prevSYStr = `${parseInt(target.schoolYear.split('-')[0]) - 1}-${parseInt(target.schoolYear.split('-')[1]) - 1}`;
        const prevFirstSem = await SchoolYear.findOne({ schoolYear: prevSYStr, semester: 1 });

        if (prevFirstSem) {
          const subjectsToCopy = await Subject.find({ schoolYear: prevFirstSem._id });

          for (const subj of subjectsToCopy) {
            const exists = await Subject.findOne({
              subjectCode: subj.subjectCode,
              strand: subj.strand,
              gradeLevel: subj.gradeLevel,
              semester: 1,
              schoolYear: target._id
            });

            if (!exists) {
              await Subject.create({
                schoolYear: target._id,
                subjectCode: subj.subjectCode,
                subjectName: subj.subjectName,
                gradeLevel: subj.gradeLevel,
                strand: subj.strand,
                track: subj.track,
                subjectType: subj.subjectType,
                teacherId: subj.teacherId,
                teacher: subj.teacher,
                semester: 1,
                sections: [],
                students: []
              });
            }
          }
        }
        // kung walang prevFirstSem — skip lang, walang mag-copy
      }
    }


    const { id: accountId, role } = req.account;
    await createLogs(
        accountId, role,
        "SET CURRENT SEMESTER",
        `Set "${target.label}" as current semester`,
        "Success"
    );



    res.status(200).json({ 
      success: true,
      message: `${target.label} is now the current semester.`,
      data: target
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





// POST /api/school-year/create-school-year
export const createSchoolYear = async (req, res) => {
  try {
    const { schoolYear, semester } = req.body;




    // check duplicate
    const existing = await SchoolYear.findOne({ schoolYear, semester });
    if (existing) {
      return res.status(409).json({ message: "Semester already exists." });
    }



    // ✅ Sequential validation
    const [startYear] = schoolYear.split('-').map(Number);

    if (semester === 2) {
      // Gusto mag-create ng 2nd sem — dapat may existing na 1st sem ng same school year
      const firstSem = await SchoolYear.findOne({ schoolYear, semester: 1 });
      if (!firstSem) {
        return res.status(400).json({
          message: `Cannot create 2nd Semester of ${schoolYear}.`,
          detail: `Please create ${schoolYear} 1st Semester first before adding the 2nd Semester.`
        });
      }
    }

    if (semester === 1) {
      const prevSchoolYear = `${startYear - 1}-${startYear}`;
      
      // Kunin yung pinaka-latest na semester sa DB
      const latestSem = await SchoolYear.findOne().sort({ schoolYear: -1, semester: -1 });

      // Kung may existing na, dapat yung latest ay yung prevSchoolYear 2nd sem
      if (latestSem) {
        const prevSecondSem = await SchoolYear.findOne({ schoolYear: prevSchoolYear, semester: 2 });
        if (!prevSecondSem) {
          return res.status(400).json({
            message: `Cannot create 1st Semester of ${schoolYear}.`,
            detail: `Please create ${prevSchoolYear} 2nd Semester first before adding ${schoolYear} 1st Semester.`
          });
        }
      }
    }


    const label = `${schoolYear} ${semester === 1 ? "1st" : "2nd"} sem`;





    const newSchoolYear = await SchoolYear.create({
      label,
      schoolYear,
      semester,
      isActive: false,
      isCurrent: false,
    });





    const { id: accountId, role } = req.account;
    await createLogs(
        accountId, role,
        "CREATE SCHOOL YEAR",
        `Created ${label} (${schoolYear} - ${semester === 1 ? "1st" : "2nd"} Semester)`,
        "Success"
    );

    
    res.status(201).json({ 
      message: "School year created successfully.", 
      data: newSchoolYear 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};











// GET /api/school-year/get-school-years
export const getSchoolYears = async (req, res) => {
  try {
    const schoolYears = await SchoolYear.find();
    res.status(200).json(schoolYears);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// ✅ NEW: Get all school years with proper response format for frontend
export const getAllSchoolYears = async (req, res) => {
  try {
    const schoolYears = await SchoolYear.find().sort({ schoolYear: -1, semester: -1 });
    res.status(200).json({ 
      success: true,
      data: schoolYears,
      message: "School years fetched successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};





// PATCH /api/school-year/update-school-year/:id
export const activateSchoolYear = async (req, res) => {
  try {
    const activated = await SchoolYear.findById(req.params.id);
    if (!activated) {
      return res.status(404).json({ message: "School year not found." });
    }

    // isActive lang — admin view switching, walang side effects
    await SchoolYear.updateMany({}, { isActive: false });
    await SchoolYear.findByIdAndUpdate(req.params.id, { isActive: true });

    

    const { id: accountId, role } = req.account;
    await createLogs(
        accountId, role,
        "SWITCH ACTIVE SEMESTER",
        `Switched active view to "${activated.label}"`,
        "Success"
    );

    res.status(200).json({ 
      message: `Now viewing ${activated.label}.`, 
      data: activated 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// ✅ NEW: Toggle enrollment status (open/closed)
export const toggleEnrollmentStatus = async (req, res) => {
  try {
    const { schoolYearId } = req.body;

    if (!schoolYearId) {
      return res.status(400).json({ message: "School year ID is required." });
    }

    const schoolYear = await SchoolYear.findById(schoolYearId);
    if (!schoolYear) {
      return res.status(404).json({ message: "School year not found." });
    }

    // Toggle between open and closed
    const newStatus = schoolYear.enrollmentStatus === "open" ? "closed" : "open";
    
    const updated = await SchoolYear.findByIdAndUpdate(
      schoolYearId,
      { enrollmentStatus: newStatus },
      { new: true }
    );


    io.emit("enrollmentStatusChanged", { message: "toggle"});
    

    res.status(200).json({
      success: true,
      message: `Enrollment status changed to ${newStatus}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};