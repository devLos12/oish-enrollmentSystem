import Subject from "../model/subject.js";
import Student from "../model/student.js";





export const getClassrooms = async (req, res) => {
  try {
    const studentId = req.account.id;

    const student = await Student.findById(studentId)
      .select('registrationHistory');
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Pinaka-latest registrationHistory — source of truth
    // Sort by schoolYear DESC + semester DESC
    const latestHistory = student.registrationHistory
      .slice()
      .sort((a, b) => {
        const yearDiff = b.schoolYear.localeCompare(a.schoolYear);
        if (yearDiff !== 0) return yearDiff;
        return b.semester - a.semester;
      })[0];

    if (!latestHistory) {
      return res.status(200).json([]);
    }

    // ✅ Lahat ng data — derived from latestHistory, hindi sa global student fields
    const {
      section,
      strand,
      gradeLevel,
      semester,
      track,
      subjects: historySubjects = []
    } = latestHistory;

    if (historySubjects.length === 0) {
      return res.status(200).json([]);
    }

    // ✅ Fetch subject details using subjectIds from history
    const subjectIds = historySubjects.map(s => s.subjectId);
    const subjects = await Subject.find({ _id: { $in: subjectIds } });

    // ✅ Fetch classmates — based sa subject.students[]
    // Filter by registrationHistory — same section + schoolYear + semester
    const allStudentIds = [
      ...new Set(subjects.flatMap(s => s.students.map(id => id.toString())))
    ];

    const classmates = await Student.find({
      _id: { $in: allStudentIds },
      registrationHistory: {
        $elemMatch: {
          section,
          schoolYear: latestHistory.schoolYear,
          semester:   latestHistory.semester
        }
      }
    // ✅ select registrationHistory — para makuha natin yung section doon, hindi global
    }).select('studentNumber firstName lastName email sex registrationHistory');

    // ✅ Map result
    const result = subjects.map(sub => {
      const historySubject = historySubjects.find(
        h => h.subjectId?.toString() === sub._id.toString()
      );

      // ✅ Schedule — galing sa subject.sections[] ng matching section
      const matchedSection = sub.sections?.find(
        s => s.sectionName === section
      );

      return {
        subjectId:         sub._id,
        subjectName:       sub.subjectName,
        subjectCode:       sub.subjectCode,
        gradeLevel,
        strand,
        track,
        semester,
        section,
        teacher:           sub.teacher,
        // ✅ Schedule — subject.sections[] first, fallback sa historySubject
        scheduleDay:       matchedSection?.scheduleDay       || historySubject?.scheduleDay       || '',
        scheduleStartTime: matchedSection?.scheduleStartTime || historySubject?.scheduleStartTime || '',
        scheduleEndTime:   matchedSection?.scheduleEndTime   || historySubject?.scheduleEndTime   || '',
        room:              matchedSection?.room              || historySubject?.room              || '',
        // ✅ Students — section + gradeLevel galing sa registrationHistory ng classmate
        students: classmates.map(s => {
          const classmateHistory = s.registrationHistory.find(h =>
            h.section    === section &&
            h.schoolYear === latestHistory.schoolYear &&
            h.semester   === latestHistory.semester
          );

          return {
            id:            s._id,
            studentNumber: s.studentNumber,
            name:          `${s.firstName} ${s.lastName}`,
            gradeLevel:    classmateHistory?.gradeLevel || gradeLevel,
            email:         s.email,
            sex:           s.sex,
            section:       classmateHistory?.section || section  // ✅ galing sa history!
          };
        })
      };
    });

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};