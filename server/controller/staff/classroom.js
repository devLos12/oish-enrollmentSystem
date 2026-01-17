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
            section: findSection.sectionName 
        }).select('firstName lastName email semester sex status strand studentNumber gradeLevel section ');



        // Return empty array if no students (not an error)
        return res.status(200).json({ 
            success: true, 
            data: {
                students: sectionStudents,
                subject: { 
                    room: findSection.room,
                    scheduleDay: findSection.scheduleDay,
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
                    track: subject.track
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






export const getTeacherSubject = async (req, res) => {
    try {
        const teacherId = req.account.id; // from auth middleware
        
        // Find all subjects where this teacher is assigned
        const subjects = await Subject.find({ teacherId: teacherId });

        // Check if teacher has any subjects
        if (!subjects || subjects.length === 0) {
            return res.status(200).json({ 
                success: true,
                data: [],
                message: "No subjects found for this teacher" 
            });
        }
        


        
        // Transform data to include subject info with each section
        const sectionsWithSubjectInfo = [];
        
        subjects.forEach(subject => {
            subject.sections.forEach(section => {
                sectionsWithSubjectInfo.push({
                    // Section details
                    sectionId: section.sectionId,
                    sectionName: section.sectionName,
                    scheduleDay: section.scheduleDay,
                    scheduleStartTime: section.scheduleStartTime,
                    scheduleEndTime: section.scheduleEndTime,
                    room: section.room,
                    students: section.students,
                    
                    // Subject details
                    subjectId: subject._id,
                    subjectName: subject.subjectName,
                    subjectCode: subject.subjectCode,
                    strand: subject.strand,
                    gradeLevel: subject.gradeLevel,
                    semester: subject.semester,
                    teacher: subject.teacher
                });
            });
        });
        
        return res.status(200).json({ 
            success: true,
            data: sectionsWithSubjectInfo
        });

    } catch (error) {
        console.error("Error in getTeacherSubject:", error);
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}