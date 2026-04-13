import Subject from "../../model/subject.js";
import Student from "../../model/student.js";




export const getTeacherStudents = async(req, res) => {
    try {
        const { subjectId, sectionId } = req.body;
        const teacherId = req.account.id;

        // Validate required fields
        if (!subjectId || !sectionId) {
            return res.status(400).json({ 
                success: false,
                message: "subjectId and sectionId are required" 
            });
        }

        // Find the subject and verify it belongs to this teacher
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacherId: teacherId
        });
        
        if (!subject) {
            return res.status(404).json({ 
                success: false,
                message: "Subject not found or you don't have access to it" 
            });
        }

        // Find the specific section
        const findSection = subject.sections?.find((sec) => 
            sec.sectionId.toString() === sectionId
        );

        if (!findSection) {
            return res.status(404).json({ 
                success: false,
                message: "Section not found in this subject" 
            });
        }

        // Find students in this section
        const sectionStudents = await Student.find({ 
            section: findSection.sectionName,
            status: "enrolled"
        }).select('firstName lastName email semester sex status strand studentNumber gradeLevel section ');



        // Return empty array if no students (not an error)
        return res.status(200).json({ 
            success: true, 
            data: {
                students: sectionStudents,
                subject: { 
                    room: findSection.room,
                    // scheduleDay: findSection.scheduleDay,
                    scheduleEndTime: findSection.scheduleEndTime,
                    scheduleStartTime: findSection.scheduleStartTime,
                    sectionId: findSection.sectionId,
                    sectionName: findSection.sectionName,
                    
                    gradeLevel: subject.gradeLevel,
                    subjectCode: subject.subjectCode,
                    subjectName: subject.subjectName,
                    subjectType: subject.subjectType,
                    teacher: subject.teacher,
                    teacherId: subject.teacherId,
                    track: subject.track,
                    semester: subject.semester
                }
            }
        });

    } catch (error) {
        console.error("Error in getTeacherStudents:", error);
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}









// export const getTeacherSubject = async (req, res) => {
//     try {
//         const teacherId = req.account.id;

//         // ✅ Kunin lahat ng subjects ng teacher — grouped by schoolYear
//         // Hindi na nag-eexpect ng isActive — yung subjects mismo ang source of truth
//         const subjects = await Subject.find({ teacherId: teacherId })
//             .populate('schoolYear', 'schoolYear semester label isActive');

//         if (!subjects || subjects.length === 0) {
//             return res.status(200).json({ 
//                 success: true,
//                 data: [],
//                 message: "No subjects found for this teacher" 
//             });
//         }

//         // ✅ I-group by schoolYear — teacher makikita lahat ng sem niya
//         // Frontend na mag-filter kung anong sem ang gusto ipakita
//         const sectionsWithSubjectInfo = [];
        
//         subjects.forEach(subject => {
//             subject.sections.forEach(section => {
//                 sectionsWithSubjectInfo.push({
//                     sectionId: section.sectionId,
//                     sectionName: section.sectionName,
//                     scheduleDay: section.scheduleDay,
//                     scheduleStartTime: section.scheduleStartTime,
//                     scheduleEndTime: section.scheduleEndTime,
//                     room: section.room,
//                     students: section.students,
                    
//                     subjectId: subject._id,
//                     subjectName: subject.subjectName,
//                     subjectCode: subject.subjectCode,
//                     strand: subject.strand,
//                     gradeLevel: subject.gradeLevel,
//                     semester: subject.semester,
//                     teacher: subject.teacher,

//                     // ✅ Isama yung schoolYear info para sa frontend filtering
//                     schoolYearId: subject.schoolYear?._id,
//                     schoolYearLabel: subject.schoolYear?.label,
//                     schoolYear: subject.schoolYear?.schoolYear,
//                     isActiveSchoolYear: subject.schoolYear?.isActive,
//                 });
//             });
//         });


//          console.log("Sections with Subject Info:", sectionsWithSubjectInfo);


//         // ✅ Return ALL subjects — frontend handles filtering by selected schoolYear
//         // Backend no longer filters by isActive — subjects are immutable and tied to their schoolYear
//         return res.status(200).json({ 
//             success: true,
//             data: sectionsWithSubjectInfo
//         });

//     } catch (error) {
//         return res.status(500).json({ 
//             success: false,
//             message: error.message 
//         });
//     }
// }










export const getTeacherSubjectBySchoolYear = async (req, res) => {
    try {
        const teacherId = req.account.id;
        const { schoolYearId } = req.query;

        
        if (!schoolYearId) {
            return res.status(400).json({ 
                success: false,
                message: "schoolYearId is required" 
            });
        }

        // ✅ Query only subjects for this teacher AND this schoolYear
        const subjects = await Subject.find({ 
            teacherId: teacherId,
            schoolYear: schoolYearId
        }).populate('schoolYear', 'schoolYear semester label isActive');

        if (!subjects || subjects.length === 0) {
            return res.status(200).json({ 
                success: true,
                data: [],
                message: "No subjects found for this school year" 
            });
        }

        // ✅ Map sections with subject info
        const sectionsWithSubjectInfo = [];
        
        subjects.forEach(subject => {
            subject.sections.forEach(section => {
                sectionsWithSubjectInfo.push({
                    sectionId: section.sectionId,
                    sectionName: section.sectionName,
                    scheduleDay: section.scheduleDay,
                    scheduleStartTime: section.scheduleStartTime,
                    scheduleEndTime: section.scheduleEndTime,
                    room: section.room,
                    students: section.students,
                    
                    subjectId: subject._id,
                    subjectName: subject.subjectName,
                    subjectCode: subject.subjectCode,
                    strand: subject.strand,
                    gradeLevel: subject.gradeLevel,
                    semester: subject.semester,
                    teacher: subject.teacher,

                    schoolYearId: subject.schoolYear?._id,
                    schoolYearLabel: subject.schoolYear?.label,
                    schoolYear: subject.schoolYear?.schoolYear,
                    isActiveSchoolYear: subject.schoolYear?.isActive,
                });
            });
        });

        return res.status(200).json({ 
            success: true,
            data: sectionsWithSubjectInfo
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}