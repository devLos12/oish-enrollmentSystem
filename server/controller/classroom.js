import Subject from "../model/subject.js";
import Student from "../model/student.js";

const getClassrooms = async (req, res) => {
  try {
    const studentId = req.account.id; 

    // 🔹 Get student info para makuha yung section at current semester
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

    // 🔹 Filter out subjects na walang students after match
    const filteredSubjects = subjects.filter(sub => 
      sub.students && sub.students.length > 0
    );

    // 🔹 Format data para sa frontend
    const result = filteredSubjects.map(sub => {
      // 🔥 Filter sections array to get only the student's section
      const studentSection = sub.sections.find(
        sec => sec.sectionName === student.section
      );

      return {
        subjectId: sub._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        gradeLevel: sub.gradeLevel,
        strand: sub.strand,
        track: sub.track,
        semester: sub.semester,
        teacher: sub.teacher,
        // 🔥 Flat structure - schedule details kasama na sa main object
        sectionId: studentSection?.sectionId || null,
        sectionName: studentSection?.sectionName || null,
        scheduleDay: studentSection?.scheduleDay || null,
        scheduleStartTime: studentSection?.scheduleStartTime || null,
        scheduleEndTime: studentSection?.scheduleEndTime || null,
        room: studentSection?.room || null,
        students: sub.students.map(s => ({
          id: s._id,
          studentNumber: s.studentNumber,
          name: `${s.firstName} ${s.lastName}`,
          section: s.section,
          gradeLevel: s.gradeLevel,
          email: s.email
        }))
      };
    });

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default getClassrooms;