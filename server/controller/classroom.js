import Subject from "../model/subject.js";
import Student from "../model/student.js";

const getClassrooms = async (req, res) => {
  try {
    const studentId = req.account.id; 

    // 🔹 Get student info
    const student = await Student.findById(studentId).select('strand semester section sectionId');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔹 Filter subjects: student ID, strand, at current semester
    const subjects = await Subject.find({ 
      students: studentId,
      strand: student.strand,
      semester: student.semester
    }).populate({
      path: "students",
      match: { section: student.section },
      select: "studentNumber firstName lastName section gradeLevel email"
    });

    // 🔹 Filter out subjects na:
    // 1. Walang students after match
    // 2. ❌ Walang sections (incomplete subject)
    const filteredSubjects = subjects.filter(sub => 
      sub.students && 
      sub.students.length > 0 &&
      sub.sections && 
      sub.sections.length > 0  // ✅ May sections na ba?
    );

    // 🔹 Format data para sa frontend
    const result = filteredSubjects.map(sub => {
      // 🔥 Get student's section from sections array
      const studentSection = sub.sections.find(
        sec => sec.sectionName === student.section
      );

      // ❌ If walang match sa sections, skip this subject
      if (!studentSection) {
        return null;
      }

      return {
        subjectId: sub._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        gradeLevel: sub.gradeLevel,
        strand: sub.strand,
        track: sub.track,
        semester: sub.semester,
        teacher: sub.teacher,
        // 🔥 Schedule details from matching section
        sectionId: studentSection.sectionId,
        sectionName: studentSection.sectionName,
        scheduleStartTime: studentSection.scheduleStartTime,
        scheduleEndTime: studentSection.scheduleEndTime,
        room: studentSection.room,
        students: sub.students.map(s => ({
          id: s._id,
          studentNumber: s.studentNumber,
          name: `${s.firstName} ${s.lastName}`,
          section: s.section,
          gradeLevel: s.gradeLevel,
          email: s.email
        }))
      };
    }).filter(Boolean);  // ✅ Remove null entries


    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default getClassrooms;