import Section from "../model/section.js";
import Student from "../model/student.js";
import Subject from "../model/subject.js";
import SchoolYear from "../model/schoolYear.js";




// GET all sections
export const getSections = async (req, res) => {
    try {
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        const sections = await Section.find({ 
            schoolYear: activeSchoolYear._id  // 👈 dagdag
        }).populate("students", "firstName lastName lrn");
        
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// CREATE new section
export const createSection = async (req, res) => {
    try {
        const { name, gradeLevel, track, strand, maxCapacity } = req.body;

        // 1. Get active school year
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // 2. Duplicate check
        const existing = await Section.findOne({ 
            name, 
            gradeLevel, 
            track, 
            strand,
            semester: activeSchoolYear.semester,
            schoolYear: activeSchoolYear._id
        });
        if (existing) return res.status(409).json({ message: "Section already exists." });

        // 3. Create new section
        const newSection = new Section({
            schoolYear: activeSchoolYear._id,
            name,
            gradeLevel,
            track,
            strand,
            semester: activeSchoolYear.semester,
            maxCapacity: maxCapacity || 35
        });

        await newSection.save();

        // ========================================
        // 🔥 AUTO-COPY STUDENTS FROM PREVIOUS SEM
        // ========================================

        if (activeSchoolYear.semester === 2) {
            // ✅ Sem 2 → copy from SAME SY sem 1 (same gradeLevel)
            // e.g. 2026-2027 sem 2 STEM-A G11 → from 2026-2027 sem 1 STEM-A G11
            const sem1SchoolYear = await SchoolYear.findOne({
                schoolYear: activeSchoolYear.schoolYear,
                semester: 1
            });

            if (sem1SchoolYear) {
                const previousSection = await Section.findOne({
                    name,
                    gradeLevel,       // ← same gradeLevel, G11 pa rin
                    track,
                    strand,
                    semester: 1,
                    schoolYear: sem1SchoolYear._id
                });

                if (previousSection && previousSection.students.length > 0) {
                    newSection.students = [...previousSection.students];
                    await newSection.save();
                }
            }

        } else if (activeSchoolYear.semester === 1) {
            // ✅ Sem 1 (new SY) → copy from PREVIOUS SY sem 2
            // e.g. 2027-2028 sem 1 STEM-A G12 → from 2026-2027 sem 2 STEM-A G11
            // Students are PROMOTED — G11 → G12

            // Guard — only applies if creating G12 section
            // G11 sections sa new SY ay fresh students (from admission)
            if (gradeLevel !== 12) {
                return res.status(201).json({ message: "Section created successfully." });
            }

            const [startYear] = activeSchoolYear.schoolYear.split('-').map(Number);
            const previousSY = `${startYear - 1}-${startYear}`; // "2026-2027"

            const previousSem2SY = await SchoolYear.findOne({
                schoolYear: previousSY,
                semester: 2
            });

            if (previousSem2SY) {
                // ← Hanapin G11 source section (gradeLevel - 1)
                const previousSection = await Section.findOne({
                    name,
                    gradeLevel: gradeLevel - 1, // G11
                    track,
                    strand,
                    semester: 2,
                    schoolYear: previousSem2SY._id
                });

                if (previousSection && previousSection.students.length > 0) {
                    // ✅ Copy students
                    newSection.students = [...previousSection.students];
                    await newSection.save();

                    // ✅ Promote students G11 → G12
                    await Student.updateMany(
                        { _id: { $in: previousSection.students } },
                        { $set: { gradeLevel: gradeLevel } } // G12
                    );
                }
            }
        }

        res.status(201).json({ message: "Section created successfully." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// UPDATE section
export const updateSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (!section) return res.status(404).json({ message: "Section not found" });

        const { name, gradeLevel, track, strand, semester, maxCapacity } = req.body;

        // 🔹 Update section fields (with fallback sa luma)
        const newSemester = semester ?? section.semester;
        const newGradeLevel = gradeLevel ?? section.gradeLevel;

        // 🔥 CHECK IF CRITICAL FIELDS CHANGED (gradeLevel or semester)
        const criticalFieldsChanged = 
            (gradeLevel !== undefined && gradeLevel !== section.gradeLevel) ||
            (semester !== undefined && semester !== section.semester);

        section.name = name ?? section.name;
        section.gradeLevel = newGradeLevel;
        section.track = track ?? section.track;
        section.strand = strand ?? section.strand;
        section.semester = newSemester;
        section.maxCapacity = maxCapacity ?? section.maxCapacity;
        const updatedSection = await section.save();

        // 🔥 IF ONLY SIMPLE UPDATES (name, track, strand, maxCapacity), RETURN EARLY
        if (!criticalFieldsChanged) {
            return res.status(200).json({ 
                message: "Section updated successfully.",
                section: updatedSection
            });
        }

        // ========================================
        // 🔥 CRITICAL FIELDS CHANGED - DO FULL MIGRATION
        // ========================================

        // 🔹 Fetch all students currently linked to this section
        const students = await Student.find({ _id: { $in: section.students } });

        if (students.length === 0) {
            return res.status(200).json({
                message: "Section updated successfully.",
            });
        }

        const studentIds = students.map(s => s._id);
       

        if(newGradeLevel === 12 && semester === 1) {
            await Student.updateMany(
                {_id: { $in: section.students }},
                { $set: { status: "pending", subjects: [] }}
            )               
            
            await Subject.updateMany(
                { students: { $in: section.students } },
                { $pull: { students: { $in: studentIds }}}
            )

            return res.status(200).json({ message: "Section updated successfully. Ready for enrollment."});
        }



        // 🔥 IMPORTANT STEP:
        // REMOVE all these students from ANY old subjects they belonged to
        await Subject.updateMany(
            { students: { $in: studentIds } },
            { $pull: { students: { $in: studentIds } } }
        );

        // 🔹 Fetch NEW subjects based on new grade, strand, semester
        const subjects = await Subject.find({
            gradeLevel: newGradeLevel,
            strand: section.strand,
            semester: newSemester
        });

        // 🔹 Auto compute School Year
        // const currentYear = new Date().getFullYear();
        // const nextYear = currentYear + 1;
        // const schoolYear = `${currentYear}-${nextYear}`;

        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        const schoolYear = activeSchoolYear?.schoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        
        // 🔹 Prepare bulkWrite operations - PERO with REPEATER LOGIC
        const insertHistoryBatch = [];
        const updateHistoryBatch = [];

        
     // 🔹 Process each student individually based on studentType
        for (const student of students) {
            let assignedSubjects = [];

            // 🔥 REPEATER LOGIC
            if (student.studentType === 'repeater' && student.repeatedSubjects?.length > 0) {
                for (const repeatedRef of student.repeatedSubjects) {
                    if (Number(repeatedRef.semester) !== Number(newSemester)) {
                        continue;
                    }

                    const matchedSubject = subjects.find(sub => 
                        sub.subjectCode === repeatedRef.subjectCode &&
                        sub.subjectName === repeatedRef.subjectName &&
                        sub.semester === repeatedRef.semester
                    );

                    if (matchedSubject) {
                        // ✅ GET SCHEDULE FOR THIS SECTION
                        const sectionSchedule = matchedSubject.sections?.find(
                            s => s.sectionName === section.name
                        );

                        // ✅ PUSH WITH SCHEDULE/ROOM
                        assignedSubjects.push({
                            subjectId: matchedSubject._id,
                            subjectName: matchedSubject.subjectName,
                            subjectTeacher: matchedSubject.teacher || "",
                            semester: matchedSubject.semester,
                            scheduleDay: sectionSchedule?.scheduleDay || "",
                            scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                            scheduleEndTime: sectionSchedule?.scheduleEndTime || "",
                            room: sectionSchedule?.room || ""
                        });

                        await Subject.findByIdAndUpdate(matchedSubject._id, {
                            $addToSet: { students: student._id }
                        });
                    }
                }
            } else {
                // 🔥 REGULAR STUDENT: Assign ALL subjects
                assignedSubjects = subjects.map(sub => {
                    // ✅ GET SCHEDULE FOR THIS SECTION
                    const sectionSchedule = sub.sections?.find(
                        s => s.sectionName === section.name
                    );

                    return {
                        subjectId: sub._id,
                        subjectName: sub.subjectName,
                        subjectTeacher: sub.teacher || "",
                        semester: sub.semester,
                        scheduleDay: sectionSchedule?.scheduleDay || "",
                        scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                        scheduleEndTime: sectionSchedule?.scheduleEndTime || "",
                        room: sectionSchedule?.room || ""
                    };
                });

                await Subject.updateMany(
                    { _id: { $in: subjects.map(s => s._id) } },
                    { $addToSet: { students: student._id } }
                );
            }



            // 🔥 LOG TO REGISTRATION HISTORY
            if (student.status === 'enrolled') {
                if (student.studentType === 'repeater') {
                    insertHistoryBatch.push({
                        updateOne: {
                            filter: { _id: student._id },
                            update: {
                                $set: {
                                    semester: newSemester,
                                    gradeLevel: newGradeLevel,
                                    section: section.name,
                                    subjects: assignedSubjects, // ← WITH SCHEDULE
                                },
                                $push: {
                                    registrationHistory: {
                                        lrn: student.lrn,
                                        studentNumber: student.studentNumber,
                                        firstName: student.firstName,
                                        lastName: student.lastName,
                                        track: student.track,
                                        semester: newSemester,
                                        schoolYear,
                                        gradeLevel: newGradeLevel,
                                        section: section.name,
                                        strand: section.strand,
                                        // ✅ AUTO-SYNC WITH SCHEDULE (same as updateStudent)
                                        subjects: assignedSubjects.map(s => ({
                                            subjectId: s.subjectId,
                                            subjectName: s.subjectName,
                                            subjectTeacher: s.subjectTeacher,
                                            semester: s.semester,
                                            scheduleDay: s.scheduleDay,
                                            scheduleStartTime: s.scheduleStartTime,
                                            scheduleEndTime: s.scheduleEndTime,
                                            room: s.room
                                        })),
                                        dateCreated: new Date()
                                    }
                                }
                            }
                        }
                    });

                    updateHistoryBatch.push({
                        updateOne: {
                            filter: { 
                                _id: student._id,
                                registrationHistory: { 
                                    $elemMatch: { 
                                        gradeLevel: newGradeLevel, 
                                        semester: newSemester 
                                    } 
                                }
                            },
                            update: {
                                $set: {
                                    semester: newSemester,
                                    gradeLevel: newGradeLevel,
                                    section: section.name,
                                    subjects: assignedSubjects, // ← WITH SCHEDULE
                                    "registrationHistory.$[elem].section": section.name,
                                    "registrationHistory.$[elem].strand": section.strand,
                                    // ✅ AUTO-SYNC WITH SCHEDULE
                                    "registrationHistory.$[elem].subjects": assignedSubjects.map(s => ({
                                        subjectId: s.subjectId,
                                        subjectName: s.subjectName,
                                        subjectTeacher: s.subjectTeacher,
                                        semester: s.semester,
                                        scheduleDay: s.scheduleDay,
                                        scheduleStartTime: s.scheduleStartTime,
                                        scheduleEndTime: s.scheduleEndTime,
                                        room: s.room
                                    })),
                                    "registrationHistory.$[elem].schoolYear": schoolYear
                                }
                            },
                            arrayFilters: [
                                { 
                                    "elem.gradeLevel": newGradeLevel, 
                                    "elem.semester": newSemester 
                                }
                            ]
                        }
                    });
                } else {
                    // 🔥 REGULAR STUDENT
                    insertHistoryBatch.push({
                        updateOne: {
                            filter: { 
                                _id: student._id,
                                registrationHistory: { 
                                    $not: { 
                                        $elemMatch: { 
                                            gradeLevel: newGradeLevel, 
                                            semester: newSemester 
                                        } 
                                    } 
                                }
                            },
                            update: {
                                $set: {
                                    semester: newSemester,
                                    gradeLevel: newGradeLevel,
                                    section: section.name,
                                    subjects: assignedSubjects, // ← WITH SCHEDULE
                                },
                                $push: {
                                    registrationHistory: {
                                        lrn: student.lrn,
                                        studentNumber: student.studentNumber,
                                        firstName: student.firstName,
                                        lastName: student.lastName,
                                        track: student.track,
                                        semester: newSemester,
                                        schoolYear,
                                        gradeLevel: newGradeLevel,
                                        section: section.name,
                                        strand: section.strand,
                                        // ✅ AUTO-SYNC WITH SCHEDULE (same as updateStudent)
                                        subjects: assignedSubjects.map(s => ({
                                            subjectId: s.subjectId,
                                            subjectName: s.subjectName,
                                            subjectTeacher: s.subjectTeacher,
                                            semester: s.semester,
                                            scheduleDay: s.scheduleDay,
                                            scheduleStartTime: s.scheduleStartTime,
                                            scheduleEndTime: s.scheduleEndTime,
                                            room: s.room
                                        })),
                                        dateCreated: new Date()
                                    }
                                }
                            }
                        }
                    });

                    updateHistoryBatch.push({
                        updateOne: {
                            filter: { 
                                _id: student._id,
                                registrationHistory: { 
                                    $elemMatch: { 
                                        gradeLevel: newGradeLevel, 
                                        semester: newSemester 
                                    } 
                                }
                            },
                            update: {
                                $set: {
                                    semester: newSemester,
                                    gradeLevel: newGradeLevel,
                                    section: section.name,
                                    subjects: assignedSubjects, // ← WITH SCHEDULE
                                    // ✅ AUTO-SYNC WITH SCHEDULE
                                    "registrationHistory.$[elem].section": section.name,
                                    "registrationHistory.$[elem].strand": section.strand,
                                    "registrationHistory.$[elem].subjects": assignedSubjects.map(s => ({
                                        subjectId: s.subjectId,
                                        subjectName: s.subjectName,
                                        subjectTeacher: s.subjectTeacher,
                                        semester: s.semester,
                                        scheduleDay: s.scheduleDay,
                                        scheduleStartTime: s.scheduleStartTime,
                                        scheduleEndTime: s.scheduleEndTime,
                                        room: s.room
                                    })),
                                    "registrationHistory.$[elem].schoolYear": schoolYear
                                }
                            },
                            arrayFilters: [
                                { 
                                    "elem.gradeLevel": newGradeLevel, 
                                    "elem.semester": newSemester 
                                }
                            ]
                        }
                    });
                }
            } else {
                // 🔥 NOT ENROLLED: Just update subjects WITH SCHEDULE
                insertHistoryBatch.push({
                    updateOne: {
                        filter: { _id: student._id },
                        update: {
                            $set: {
                                semester: newSemester,
                                gradeLevel: newGradeLevel,
                                section: section.name,
                                subjects: assignedSubjects, // ← WITH SCHEDULE
                            }
                        }
                    }
                });
            }    
        }



        // 🔹 Execute BOTH operations
        if (insertHistoryBatch.length > 0) {
            await Student.bulkWrite(insertHistoryBatch);
        }
        if (updateHistoryBatch.length > 0) {
            await Student.bulkWrite(updateHistoryBatch);
        }

        res.status(200).json({ 
            message: "Section updated successfully.",
            section: updatedSection
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};



export const updateEnrollmentStatus = async(req, res) => {
    try {
        const sectionId = req.params.id;
        const { isOpen } = req.body;
        
        await Section.findOneAndUpdate(
            {_id: sectionId}, 
            { $set: { isOpenEnrollment: isOpen }}
        );
        res.status(200).json({ message: `Enrollment is now ${isOpen ? "open" : "close"}`});
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}


// DELETE section
export const deleteSection = async (req, res) => {
    try {
        const id = req.params.id;

        await Section.deleteOne({_id: id});

        res.status(200).json({ message: "Section deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};











// GET section details + populated students
// GET /api/sections/:id
export const getSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get active school year
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // 2. Find section + populate students with registrationHistory
        const section = await Section.findById(id).populate({
            path: "students",
            select: "studentNumber lrn firstName middleName lastName strand gradeLevel semester section status studentType profileImage registrationHistory"
        });

        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        // 3. Per student — compute enrollment status based on registrationHistory
        const studentsWithStatus = section.students.map((student) => {
            const isEnrolledThisSem = student.registrationHistory.some(h =>
                h.schoolYear === activeSchoolYear.schoolYear &&  // e.g. "2026-2027"
                h.semester === activeSchoolYear.semester          // 1 or 2
            );

            return {
                _id: student._id,
                studentNumber: student.studentNumber,
                lrn: student.lrn,
                firstName: student.firstName,
                middleName: student.middleName,
                lastName: student.lastName,
                strand: student.strand,
                gradeLevel: student.gradeLevel,
                semester: student.semester,
                section: student.section,
                studentType: student.studentType,
                profileImage: student.profileImage,
                // ✅ Override status based on registrationHistory of active sem
                status: isEnrolledThisSem ? "enrolled" : "pending"
            };
        });

        // 4. Return section with computed students
        res.status(200).json({
            ...section.toObject(),
            students: studentsWithStatus
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};






export const searchStudentForSection = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Query is required." });
        }

        const student = await Student.findOne({
            $or: [
                { studentNumber: query.trim() },
                { lrn: query.trim() }
            ]
        }).select("studentNumber lrn firstName middleName lastName strand gradeLevel semester section status studentType profileImage registrationHistory enrollmentYear");

        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // ✅ Get active school year para ma-derive ang current sem status
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });

        const currentSemHistory = activeSchoolYear
            ? student.registrationHistory.find(h =>
                h.schoolYear === activeSchoolYear.schoolYear &&
                h.semester === activeSchoolYear.semester
            )
            : null;

        // ✅ Derived status — consistent sa student management
        const derivedStatus = currentSemHistory?.status === "enrolled"
            ? "enrolled"
            : (student.status === "graduated" || student.status === "dropped")
                ? student.status
                : "pending";

        const derivedSection = currentSemHistory?.status === "enrolled"
            ? currentSemHistory.section
            : "No Section";

        res.status(200).json({
            ...student.toObject(),
            status: derivedStatus,       // ✅ override global status
            section: derivedSection,     // ✅ override global section
            currentSemHistory: currentSemHistory || null
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};





export const addStudentToSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: "studentId is required." });
        }

        const section = await Section.findById(id);
        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // ✅ Fetch activeSchoolYear — taas na, needed sa lahat
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year set." });
        }

        if (section.students.includes(studentId)) {
            return res.status(409).json({ message: "Student is already in this section." });
        }

        if (section.students.length >= section.maxCapacity) {
            return res.status(400).json({ message: "Section is already full." });
        }

        if (student.strand !== section.strand || student.gradeLevel !== section.gradeLevel) {
            return res.status(400).json({ 
                message: `Student strand/grade mismatch. Section is ${section.strand} Grade ${section.gradeLevel}.` 
            });
        }

        // ✅ Pull from old section + subjects — cleanup
        await Section.updateOne(
            { students: studentId },
            { $pull: { students: studentId } }
        );
        await Subject.updateMany(
            { students: studentId },
            { $pull: { students: studentId } }
        );

        // ✅ Push to new section
        section.students.push(studentId);
        await section.save();

        // ✅ Update student fields
        student.status = 'enrolled';
        student.section = section.name;
        student.hasEnrollmentRequest = false;
        student.semester = section.semester;
        student.subjects = [];  // ✅ clean slate

        // ========================================
        // 🔥 AUTO-ASSIGN SUBJECTS
        // ========================================
        if (student.studentType === 'regular') {
            const matchedSubjects = await Subject.find({
                gradeLevel: section.gradeLevel,
                strand: section.strand,
                track: section.track,
                semester: section.semester,
                schoolYear: activeSchoolYear._id    // ✅ scoped sa active SY
            });

            for (const subj of matchedSubjects) {
                const sectionSchedule = subj.sections?.find(
                    s => s.sectionName === section.name
                );

                student.subjects.push({
                    subjectId:         subj._id,
                    subjectName:       subj.subjectName,
                    subjectTeacher:    subj.teacher,
                    semester:          subj.semester,
                    scheduleDay:       sectionSchedule?.scheduleDay       || "",
                    scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                    scheduleEndTime:   sectionSchedule?.scheduleEndTime   || "",
                    room:              sectionSchedule?.room              || ""
                });

                await Subject.findByIdAndUpdate(subj._id, {
                    $addToSet: { students: student._id }
                });
            }

        } else if (student.studentType === 'repeater') {
            const repeatedSubjects = student.repeatedSubjects || [];

            for (const repeatedRef of repeatedSubjects) {
                if (Number(repeatedRef.semester) !== Number(section.semester)) continue;

                const actualSubject = await Subject.findOne({
                    subjectCode: repeatedRef.subjectCode,
                    semester: repeatedRef.semester,
                    schoolYear: activeSchoolYear._id    // ✅ scoped sa active SY
                });

                if (actualSubject) {
                    const sectionSchedule = actualSubject.sections?.find(
                        s => s.sectionName === section.name
                    );

                    student.subjects.push({
                        subjectId:         actualSubject._id,
                        subjectName:       actualSubject.subjectName,
                        subjectTeacher:    actualSubject.teacher,
                        semester:          actualSubject.semester,
                        scheduleDay:       sectionSchedule?.scheduleDay       || "",
                        scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                        scheduleEndTime:   sectionSchedule?.scheduleEndTime   || "",
                        room:              sectionSchedule?.room              || ""
                    });

                    await Subject.findByIdAndUpdate(actualSubject._id, {
                        $addToSet: { students: student._id }
                    });
                }
            }
        }

        // ========================================
        // 🔥 REGISTRATION HISTORY — UPSERT
        // ========================================
        const historyIndex = student.registrationHistory.findIndex(h =>
            h.schoolYear === activeSchoolYear.schoolYear &&
            h.semester === section.semester
        );

        const historyEntry = {
            lrn:           student.lrn,
            studentNumber: student.studentNumber,
            firstName:     student.firstName,
            lastName:      student.lastName,
            track:         student.track,
            semester:      section.semester,
            schoolYear:    activeSchoolYear.schoolYear,  // ✅ hindi na enrollmentYear
            gradeLevel:    student.gradeLevel,
            section:       section.name,
            strand:        student.strand,
            status:        'enrolled',
            subjects:      student.subjects.map(s => ({
                subjectId:         s.subjectId,
                subjectName:       s.subjectName,
                subjectTeacher:    s.subjectTeacher,
                semester:          s.semester,
                scheduleDay:       s.scheduleDay,
                scheduleStartTime: s.scheduleStartTime,
                scheduleEndTime:   s.scheduleEndTime,
                room:              s.room
            })),
            dateCreated: new Date()
        };

        if (historyIndex !== -1) {
            student.registrationHistory[historyIndex] = {
                ...student.registrationHistory[historyIndex].toObject(),
                ...historyEntry
            };
        } else {
            student.registrationHistory.push(historyEntry);
        }

        await student.save();

        return res.status(200).json({ 
            message: `${student.firstName} ${student.lastName} successfully added to ${section.name}.`,
            student
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// REMOVE student from section (admin)
// DELETE /api/sections/:id/remove-student/:studentId
export const removeStudentFromSection = async (req, res) => {
    try {
        const { id, studentId } = req.params;
        
        

        // 1. Find section
        const section = await Section.findById(id);
        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        // 2. Check if student is in section
        if (!section.students.includes(studentId)) {
            return res.status(404).json({ message: "Student is not in this section." });
        }

        // 3. Pull student from section
        section.students.pull(studentId);
        await section.save();

        // 4. Remove student from all subjects
        await Subject.updateMany(
            { students: studentId },
            { $pull: { students: studentId } }
        );

        // 5. Find student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // 6. Find active school year
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // 7. Clear section + subjects sa current sem registrationHistory entry
        const historyIndex = student.registrationHistory.findIndex(h =>
            h.schoolYear === activeSchoolYear.schoolYear &&
            h.semester === activeSchoolYear.semester
        );

        if (historyIndex !== -1) {
            student.registrationHistory[historyIndex].status = "unenrolled";
            student.registrationHistory[historyIndex].section = "";
            student.registrationHistory[historyIndex].subjects = [];
        }

        // 8. Clear student direct fields — wag i-touch ang status (global sya)
        student.status = "unenrolled";
        student.section = "";
        student.subjects = [];
        student.hasEnrollmentRequest = false;   





        await student.save();

        res.status(200).json({ message: "Student unenrolled from section successfully." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// ✅ BULK CREATE sections
export const bulkAddSections = async (req, res) => {
    try {
        const { sections } = req.body;

        if (!Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({ message: "No sections provided." });
        }

        // 1. Get active school year
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // 2. Validate all sections first
        const validationErrors = [];
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            
            if (!sec.name?.trim()) {
                validationErrors.push(`Row ${i + 1}: Section name is required`);
                continue;
            }
            
            if (![11, 12].includes(parseInt(sec.gradeLevel))) {
                validationErrors.push(`Row ${i + 1}: Grade level must be 11 or 12`);
            }
            
            if (!sec.track?.trim() || !['Academic', 'TVL'].includes(sec.track)) {
                validationErrors.push(`Row ${i + 1}: Track must be Academic or TVL`);
            }
            
            if (!sec.strand?.trim()) {
                validationErrors.push(`Row ${i + 1}: Strand is required`);
            }

            // Check capacity
            const cap = parseInt(sec.maxCapacity);
            if (isNaN(cap) || cap < 1 || cap > 100) {
                validationErrors.push(`Row ${i + 1}: Capacity must be between 1 and 100`);
            }

            // Check uniqueness
            const existing = await Section.findOne({
                name: sec.name.trim().toUpperCase(),
                gradeLevel: parseInt(sec.gradeLevel),
                track: sec.track,
                strand: sec.strand,
                semester: activeSchoolYear.semester,
                schoolYear: activeSchoolYear._id
            });

            if (existing) {
                validationErrors.push(`Row ${i + 1}: Section "${sec.name}" already exists`);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                message: "Validation failed",
                errors: validationErrors 
            });
        }

        // 3. Create all sections
        let importedCount = 0;
        const createdSections = [];

        for (const sec of sections) {
            try {
                // ========================================
                // 🔥 AUTO-COPY STUDENTS FROM PREVIOUS SEM
                // ========================================
                let studentsToCopy = [];

                if (activeSchoolYear.semester === 2) {
                    // ✅ Sem 2 → copy from SAME SY sem 1
                    const sem1SchoolYear = await SchoolYear.findOne({
                        schoolYear: activeSchoolYear.schoolYear,
                        semester: 1
                    });

                    if (sem1SchoolYear) {
                        const previousSection = await Section.findOne({
                            name: sec.name.trim().toUpperCase(),
                            gradeLevel: parseInt(sec.gradeLevel),
                            track: sec.track,
                            strand: sec.strand,
                            semester: 1,
                            schoolYear: sem1SchoolYear._id
                        });

                        if (previousSection && previousSection.students.length > 0) {
                            studentsToCopy = [...previousSection.students];
                        }
                    }

                } else if (activeSchoolYear.semester === 1) {
                    // ✅ Sem 1 (new SY) → copy from PREVIOUS SY sem 2
                    // Students promoted from Grade 11 → Grade 12
                    if (parseInt(sec.gradeLevel) === 12) {
                        const [startYear] = activeSchoolYear.schoolYear.split('-').map(Number);
                        const previousSY = `${startYear - 1}-${startYear}`;

                        const previousSem2SY = await SchoolYear.findOne({
                            schoolYear: previousSY,
                            semester: 2
                        });

                        if (previousSem2SY) {
                            const previousSection = await Section.findOne({
                                name: sec.name.trim().toUpperCase(),
                                gradeLevel: 11, // G11 in previous SY
                                track: sec.track,
                                strand: sec.strand,
                                semester: 2,
                                schoolYear: previousSem2SY._id
                            });

                            if (previousSection && previousSection.students.length > 0) {
                                studentsToCopy = [...previousSection.students];

                                // Promote students G11 → G12
                                await Student.updateMany(
                                    { _id: { $in: previousSection.students } },
                                    { $set: { gradeLevel: 12 } }
                                );
                            }
                        }
                    }
                }

                // 4. Create new section
                const newSection = new Section({
                    schoolYear: activeSchoolYear._id,
                    name: sec.name.trim().toUpperCase(),
                    gradeLevel: parseInt(sec.gradeLevel),
                    track: sec.track,
                    strand: sec.strand,
                    semester: activeSchoolYear.semester,
                    maxCapacity: parseInt(sec.maxCapacity) || 35,
                    students: studentsToCopy,
                    isOpenEnrollment: true,
                    isEnrolled: []
                });

                await newSection.save();
                createdSections.push(newSection);
                importedCount++;

            } catch (sectionError) {
                validationErrors.push(`Row: Failed to create "${sec.name}": ${sectionError.message}`);
            }
        }

        res.status(201).json({ 
            message: `${importedCount} section(s) created successfully`,
            imported: importedCount,
            total: sections.length,
            sections: createdSections
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};