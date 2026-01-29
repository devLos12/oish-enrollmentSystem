import Subject from "../../model/subject.js";
import Student from "../../model/student.js"; 


export const getTeacherSubjectSchedule = async(req, res) => {
    try {   
        const { id } = req.account;
        
        const subjects = await Subject.find({ teacherId: id });

        // Check if teacher has any subjects
        if (!subjects || subjects.length === 0) {
            return res.status(200).json({ 
                success: true,
                data: [],
                message: "No subjects found for this teacher" 
            });
        }

        // Flatten the sections array - each section becomes a separate entry
        const scheduleData = [];
        
        subjects.forEach(subject => {
            // Loop through each section in the subject
            subject.sections.forEach(section => {
                scheduleData.push({
                    // Subject info
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
                    
                    // Section info
                    sectionId: section.sectionId,
                    sectionName: section.sectionName,
                    section: section.sectionName, // for compatibility with frontend
                    // scheduleDay: section.scheduleDay,
                    scheduleStartTime: section.scheduleStartTime,
                    scheduleEndTime: section.scheduleEndTime,
                    room: section.room,
                    
                    // Student count (optional)
                    studentCount: section.students?.length || 0
                });
            });
        });
        
        return res.status(200).json({ 
            success: true,
            message: "Teacher schedule fetched successfully", 
            data: scheduleData, 
        });
        
    } catch (error) {
        console.error("Error in getTeacherSubjectSchedule:", error);
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}