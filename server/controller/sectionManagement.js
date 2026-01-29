import Section from "../model/section.js";
import Student from "../model/student.js";
import Subject from "../model/subject.js";



// GET all sections
export const getSections = async (req, res) => {
    try {
        const sections = await Section.find().populate("students", "firstName lastName lrn");
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// CREATE new section
export const createSection = async (req, res) => {
    try {
        const { name, gradeLevel, track, strand, semester, maxCapacity } = req.body;

        // optional: check duplicate section
        const existing = await Section.findOne({ name, gradeLevel, track, strand, semester });
        if (existing) return res.status(409).json({ message: "Section already exists" });

        const newSection = new Section({
            name,
            gradeLevel,
            track,
            strand,
            semester,
            maxCapacity: maxCapacity || 35
        });

        await newSection.save();
        res.status(201).json({ message: "Section Created Successfully."});
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
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const schoolYear = `${currentYear}-${nextYear}`;

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
