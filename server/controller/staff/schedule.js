import Subject from "../../model/subject.js";
import Student from "../../model/student.js";
import SchoolYear from "../../model/schoolYear.js";



export const getTeacherSubjectSchedule = async(req, res) => {
    try {   
        const { id } = req.account;
        const { schoolYearId } = req.query;  // ✅ Accept optional schoolYearId from frontend

        // ✅ If schoolYearId provided → use it (teacher selected a specific semester)
        // ✅ If not → use active school year (backward compatibility)
        let targetSchoolYear;

        if (schoolYearId) {
            targetSchoolYear = await SchoolYear.findById(schoolYearId);
            if (!targetSchoolYear) {
                return res.status(404).json({ message: "School year not found." });
            }
        } else {
            targetSchoolYear = await SchoolYear.findOne({ isActive: true });
            if (!targetSchoolYear) {
                return res.status(404).json({ message: "No active school year." });
            }
        }

        // ✅ Fetch subjects based on teacher + selected schoolYear
        // DATA PERSISTS kahit mag-switch ng admin ng active sem
        const subjects = await Subject.find({ 
            teacherId: id,
            schoolYear: targetSchoolYear._id
        });
        
        if (!subjects || subjects.length === 0) {
            return res.status(200).json({ 
                success: true,
                data: [],
                message: "No subjects found for this teacher" 
            });
        }

        const scheduleData = [];
        
        for (const subject of subjects) {
            for (const section of subject.sections) {
                // ✅ Students based sa selected schoolYear — hindi sa isActive
                const studentsInSection = await Student.find({
                    section: section.sectionName,
                    strand: subject.strand,
                    registrationHistory: {
                        $elemMatch: {
                            schoolYear: targetSchoolYear.schoolYear,
                            semester: subject.semester
                        }
                    }
                });

                scheduleData.push({
                    subjectId: subject._id,
                    subjectName: subject.subjectName,
                    subjectCode: subject.subjectCode,
                    gradeLevel: subject.gradeLevel,
                    strand: subject.strand,
                    track: subject.track,
                    semester: subject.semester,
                    subjectType: subject.subjectType,
                    teacherId: subject.teacherId,
                    teacher: subject.teacher,
                    
                    sectionId: section.sectionId,
                    sectionName: section.sectionName,
                    section: section.sectionName,
                    scheduleStartTime: section.scheduleStartTime,
                    scheduleEndTime: section.scheduleEndTime,
                    room: section.room,
                    
                    studentCount: studentsInSection.length,
                    schoolYear: targetSchoolYear.schoolYear,
                    schoolYearId: targetSchoolYear._id,
                    semester: subject.semester,
                });
            }
        }
        
        return res.status(200).json({ 
            success: true,
            message: "Teacher schedule fetched successfully", 
            data: scheduleData
        });
        
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}