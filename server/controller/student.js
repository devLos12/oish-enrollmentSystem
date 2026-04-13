import Student from "../model/student.js";
import Section from "../model/section.js";
import Subject from "../model/subject.js";
import bcrypt from "bcrypt";
import Staff from "../model/staff.js";
import Admin from "../model/admin.js";
import SchoolYear from "../model/schoolYear.js";



export const markAsGraduated = async(req, res) => {
    try {
        const { id } = req.params;
        
        
        const student = await Student.findOne({_id: id });
        if(!student || student.length === 0) return res.status(401).json({ message: "student not found."});
        student.status = "graduated";
        await student.save();

        return res.status(200).json({ message: "mark as graduated successfully.", success: true});
    } catch (error) {
        return res.status(500).json({ message: error.message });
        
    }
}


export const createStudent = async (req, res) => {
    try {
        const {
            lrn,
            firstName,
            middleName,
            lastName,
            extensionName,
            birthDate,
            sex,
            contactNumber,
            email,
            gradeLevel,
            track,
            strand,
            semester,
            studentType,
            password,
            confirmPassword
        } = req.body;

        // ✅ 1. VALIDATE PASSWORD MATCH
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        // ✅ 2. VALIDATE PASSWORD LENGTH
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        // ✅ 3. CHECK DUPLICATE LRN
        const existingLRN = await Student.findOne({ lrn });
        if (existingLRN) {
            return res.status(409).json({ message: "LRN already exists." });
        }

        // ✅ 4. CHECK DUPLICATE EMAIL (across ALL models)
        const [existingStudent, existingAdmin, existingStaff] = await Promise.all([
            Student.findOne({ email }),
            Admin.findOne({ email }),
            Staff.findOne({ email })
        ]);


        
        
        // const validExtensions = ['', 'N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'MD', 'PhD', 'Esq.', 'CPA'];


        // if (extensionName && !validExtensions.includes(extensionName.trim())) {
        //     return res.status(400).json({ 
        //         message: "Invalid extension name. Accepted values: Jr., Sr., II, III, IV, V, MD, PhD, Esq., CPA" 
        //     });
        // }


        if (existingStudent) {
            return res.status(409).json({ message: "Email already exists in Student records." });
        }
        if (existingAdmin) {
            return res.status(409).json({ message: "Email already exists in Admin records." });
        }
        if (existingStaff) {
            return res.status(409).json({ message: "Email already exists in Staff records." });
        }

        // ✅ 5. GENERATE STUDENT NUMBER (Sequential)
        const year = new Date().getFullYear();
        const studentCount = await Student.countDocuments({});
        const nextNumber = studentCount + 1;
        const studentNumber = `${year}-${String(nextNumber).padStart(4, "0")}`;

        // ✅ 6. CHECK DUPLICATE STUDENT NUMBER (safety check)
        const existingStudentNumber = await Student.findOne({ studentNumber });
        if (existingStudentNumber) {
            return res.status(409).json({
                message: "Student Number conflict. Please try again."
            });
        }

        // ✅ 7. HASH PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);


        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }
        
        // ✅ 8. CREATE STUDENT
        const newStudent = await Student.create({
            schoolYear: activeSchoolYear._id,
            studentNumber,
            lrn,
            firstName,
            middleName,
            lastName,
            extensionName: extensionName || "N/A",
            birthDate,
            sex,
            contactNumber: contactNumber.replace(/\s/g, ''), // Remove spaces
            email,
            gradeLevel: parseInt(gradeLevel),
            track,
            strand,
            semester: parseInt(semester),
            studentType: studentType || 'regular',
            password: hashedPass,
            enrollmentYear: year,
            status: 'pending' // or 'pending' depende sa requirement
        });

        // ✅ 9. RETURN SUCCESS RESPONSE
        res.status(201).json({ 
            message: "Student created successfully!",
            student: {
                studentNumber: newStudent.studentNumber,
                name: `${newStudent.firstName} ${newStudent.lastName}`,
                email: newStudent.email
            }
        });

    } catch (error) {
        console.error("Create Student Error:", error);
        res.status(500).json({ message: error.message });
    }
};




export const updateStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const { 
            firstName, middleName, lastName, email, contactNumber,
            lrn, 
            gradeLevel, track, strand, semester, section, status, studentType,
            repeatedSubjects
        } = req.body;

        // ✅ Get current student data from DB — source of truth
        const currentStudent = await Student.findById(studentId);
        if (!currentStudent) {
            return res.status(404).json({ message: "Student not found." });
        }

        // ========================================
        // 🔥 LRN VALIDATION
        // ========================================
        if (lrn !== undefined && lrn !== null) {
            const cleanedLRN = String(lrn).trim();
            if (cleanedLRN !== '' && cleanedLRN.toUpperCase() !== 'N/A') {
                const digitsOnly = cleanedLRN.replace(/\D/g, '');
                if (digitsOnly.length !== 12) {
                    return res.status(400).json({ message: "LRN must be exactly 12 digits." });
                }
                if (cleanedLRN !== digitsOnly) {
                    return res.status(400).json({ message: "LRN must contain only numbers." });
                }
            }
        }

        const lrnToCheck = lrn !== undefined ? lrn : currentStudent.lrn;
        const hasValidLRN = lrnToCheck && 
                           String(lrnToCheck).trim() !== '' && 
                           String(lrnToCheck).trim().toUpperCase() !== 'N/A';

        if (!hasValidLRN) {
            if (section && section.trim() !== '') {
                return res.status(400).json({ 
                    message: "Cannot assign section. Student must have a valid LRN first." 
                });
            }
            if (status === 'enrolled') {
                return res.status(400).json({ 
                    message: "Cannot enroll student. Student must have a valid LRN first." 
                });
            }
        }

        // ========================================
        // 🔥 DETECT CRITICAL CHANGES
        // ========================================
        const wasRepeater = currentStudent.studentType === 'repeater';
        const gradeChanged = currentStudent.gradeLevel !== gradeLevel;
        const trackChanged = currentStudent.track !== track;
        const strandChanged = currentStudent.strand !== strand;
        const criticalFieldChanged = gradeChanged || trackChanged || strandChanged;

        // ========================================
        // 🔥 GENERAL UPDATE — Basic Info (applies to all paths)
        // ========================================
        await Student.findByIdAndUpdate(
            studentId,
            {
                $set: {
                    firstName,
                    middleName,
                    lastName,
                    email,
                    contactNumber,
                    lrn,
                    gradeLevel,
                    track,
                    strand
                }
            }
        );

        // ========================================
        // 🔥 PATH 1 — REPEATER ENROLLMENT
        // Dating repeater sa DB, binago ng admin → regular + enrolled + may section
        // ========================================
        if (wasRepeater && studentType === 'regular' && status === 'enrolled' && section) {

            const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
            if (!activeSchoolYear) {
                return res.status(400).json({ message: "No active school year set." });
            }

            const activeSemester = activeSchoolYear.semester;
            const activeSchoolYearStr = activeSchoolYear.schoolYear;

            // ✅ Find new section — scoped sa active SY + sem
            const findSection = await Section.findOne({
                name: section,
                gradeLevel: gradeLevel,
                track: track,
                strand: strand,
                semester: activeSemester,
                schoolYear: activeSchoolYear._id
            });

            if (!findSection) {
                return res.status(404).json({ 
                    message: "Section not found for current semester." 
                });
            }

            // ✅ Pull from any old section (leftover cleanup)
            await Section.updateOne(
                { students: studentId },
                { $pull: { students: studentId } }
            );

            // ✅ Push to new section
            if (!findSection.students.includes(studentId)) {
                findSection.students.push(studentId);
                await findSection.save();
            }

            // ✅ Pull from old subjects (leftover Sem 1 subjects)
            await Subject.updateMany(
                { students: studentId },
                { $pull: { students: studentId } }
            );

            // ✅ Fetch new subjects for this sem — scoped sa active SY
            const matchedSubjects = await Subject.find({
                gradeLevel: gradeLevel,
                strand: strand,
                track: track,
                semester: activeSemester,
                schoolYear: activeSchoolYear._id
            });

            // ✅ Build new subjects array with section schedule
            const newSubjects = matchedSubjects.map(subj => {
                const sectionSchedule = subj.sections?.find(
                    s => s.sectionName === section
                );
                return {
                    subjectId: subj._id,
                    subjectName: subj.subjectName,
                    subjectTeacher: subj.teacher,
                    semester: subj.semester,
                    scheduleDay: sectionSchedule?.scheduleDay || "",
                    scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                    scheduleEndTime: sectionSchedule?.scheduleEndTime || "",
                    room: sectionSchedule?.room || ""
                };
            });

            // ✅ Add student to each matched subject
            for (const subj of matchedSubjects) {
                await Subject.findByIdAndUpdate(subj._id, {
                    $addToSet: { students: studentId }
                });
            }

            // ✅ Update student — clear repeater fields, assign fresh data
            const updatedStudent = await Student.findByIdAndUpdate(
                studentId,
                {
                    $set: {
                        semester: activeSemester,
                        section,
                        status: 'enrolled',
                        studentType: 'regular',
                        repeatedSubjects: [],
                        hasEnrollmentRequest: false,
                        repeatedSection: '',
                        subjects: newSubjects
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update student." });
            }

            // ✅ Push new registrationHistory entry
            // Sem 1 history — intact pa rin, hindi o-overwrite
            const historyIndex = updatedStudent.registrationHistory.findIndex(h =>
                h.schoolYear === activeSchoolYearStr &&
                h.semester === activeSemester
            );

            const historyEntry = {
                lrn: updatedStudent.lrn,
                studentNumber: updatedStudent.studentNumber,
                firstName: updatedStudent.firstName,
                lastName: updatedStudent.lastName,
                track: updatedStudent.track,
                semester: activeSemester,
                schoolYear: activeSchoolYearStr,
                gradeLevel: updatedStudent.gradeLevel,
                section,
                strand: updatedStudent.strand,
                status: 'enrolled',
                subjects: newSubjects.map(s => ({
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
            };

            if (historyIndex !== -1) {
                // ✅ Update existing entry (re-enrollment edge case)
                updatedStudent.registrationHistory[historyIndex] = {
                    ...updatedStudent.registrationHistory[historyIndex].toObject(),
                    ...historyEntry
                };
            } else {
                // ✅ New entry — Sem 1 history stays intact
                updatedStudent.registrationHistory.push(historyEntry);
            }

            await updatedStudent.save();

            return res.status(200).json({
                message: "Repeater enrolled successfully.",
                student: updatedStudent
            });
        }

            

        // ========================================
        // 🔥 PATH 2 — REPEATER TAGGING
        // Admin nag-tag as repeater — bagong repeater or update ng existing
        // ========================================
        if (studentType === 'repeater') {

            const finalRepeatedSubjects = repeatedSubjects ?? [];
            const existingRepeatedSubjects = currentStudent.repeatedSubjects || [];

            if (finalRepeatedSubjects.length === 0 && existingRepeatedSubjects.length === 0) {
                return res.status(400).json({ 
                    message: "Please add at least one repeated subject." 
                });
            }

            const currentSchoolYear = await SchoolYear.findOne({ isCurrent: true });
            if (!currentSchoolYear) {
                return res.status(400).json({ message: "No current school year set." });
            }

            const repeatedSubjectsToSave = finalRepeatedSubjects.length > 0
                ? finalRepeatedSubjects.map(s => ({
                    subjectCode: s.subjectCode || '',
                    subjectName: s.subjectName || '',
                    semester: s.semester || currentSchoolYear.semester,
                    schoolYearId: currentSchoolYear._id,
                    status: 'failed'
                }))
                : existingRepeatedSubjects;

            const updatedStudent = await Student.findOneAndUpdate(
                { _id: studentId },
                {
                    $set: {
                        firstName,
                        middleName,
                        lastName,
                        email,
                        contactNumber,
                        lrn,
                        studentType: 'repeater',
                        repeatedSubjects: repeatedSubjectsToSave,
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update." });
            }

            return res.status(200).json({
                message: "Student marked as repeater successfully.",
                student: updatedStudent
            });
        }



        // ========================================
        // 🔥 PATH 3 — REGULAR STUDENT PROCESS
        // Regular talaga from the start, hindi dating repeater
        // ========================================
        if (studentType === 'regular') {

            const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
            if (!activeSchoolYear) {
                return res.status(400).json({ message: "No active school year set." });
            }
            const currentSemester = activeSchoolYear.semester;

            // ✅ Pull from old section + subjects if critical field changed
            if (criticalFieldChanged) {
                await Subject.updateMany(
                    { students: studentId },
                    { $pull: { students: studentId } }
                );
                await Section.updateOne(
                    { students: studentId },
                    { $pull: { students: studentId } }
                );
            }

            const updatedStudent = await Student.findOneAndUpdate(
                { _id: studentId },
                { 
                    $set: { 
                        semester: currentSemester,
                        section,
                        status, 
                        studentType: 'regular',
                        repeatedSubjects: [],
                        hasEnrollmentRequest: false, 
                        repeatedSection: '',
                        subjects: []        // ✅ always clear — fresh assign
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update." });
            }

            // ========================================
            // 🔥 ENROLLED
            // ========================================
            if (status === "enrolled") {

                // ✅ Find section — scoped sa active SY
                const findSection = await Section.findOne({
                    name: section,
                    gradeLevel: gradeLevel,
                    track: track,
                    strand: strand,
                    semester: currentSemester,
                    schoolYear: activeSchoolYear._id
                });

                // ✅ Pull from old section
                const oldSection = await Section.findOne({ 
                    students: studentId,
                    schoolYear: activeSchoolYear._id
                });
                if (oldSection && oldSection.name !== section) {
                    oldSection.students.pull(studentId);
                    await oldSection.save();
                }

                // ✅ Push to new section
                if (findSection) {
                    if (!findSection.students.includes(studentId)) {
                        findSection.students.push(studentId);
                        await findSection.save();
                    }
                }

                // ✅ Pull from old subjects
                await Subject.updateMany(
                    { students: studentId },
                    { $pull: { students: studentId } }
                );

                // ✅ Fetch + assign new subjects
                const matchedSubjects = await Subject.find({
                    gradeLevel: gradeLevel,
                    strand: strand,
                    track: track,
                    semester: currentSemester,
                    schoolYear: activeSchoolYear._id
                });

                for (const subj of matchedSubjects) {
                    const sectionSchedule = subj.sections?.find(
                        s => s.sectionName === section
                    );
                    updatedStudent.subjects.push({
                        subjectId: subj._id,
                        subjectName: subj.subjectName,
                        subjectTeacher: subj.teacher,
                        semester: subj.semester,
                        scheduleDay: sectionSchedule?.scheduleDay || "",
                        scheduleStartTime: sectionSchedule?.scheduleStartTime || "",
                        scheduleEndTime: sectionSchedule?.scheduleEndTime || "",
                        room: sectionSchedule?.room || ""
                    });

                    await Subject.findByIdAndUpdate(subj._id, {
                        $addToSet: { students: updatedStudent._id }
                    });
                }

                // ✅ Upsert registrationHistory
                const historyIndex = updatedStudent.registrationHistory.findIndex(h =>
                    h.schoolYear === activeSchoolYear.schoolYear &&
                    h.semester === currentSemester
                );

                const historyEntry = {
                    lrn: updatedStudent.lrn,
                    studentNumber: updatedStudent.studentNumber,
                    firstName: updatedStudent.firstName,
                    lastName: updatedStudent.lastName,
                    track: updatedStudent.track,
                    semester: currentSemester,
                    schoolYear: activeSchoolYear.schoolYear,
                    gradeLevel: updatedStudent.gradeLevel,
                    section: updatedStudent.section,
                    strand: updatedStudent.strand,
                    status: "enrolled",
                    subjects: updatedStudent.subjects.map(s => ({
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
                };

                if (historyIndex !== -1) {
                    updatedStudent.registrationHistory[historyIndex] = {
                        ...updatedStudent.registrationHistory[historyIndex].toObject(),
                        ...historyEntry
                    };
                } else {
                    updatedStudent.registrationHistory.push(historyEntry);
                }

                await updatedStudent.save();
            }

            // ========================================
            // 🔥 UNENROLLED
            // ========================================
            if (status === "unenrolled") {
                const historyIndex = updatedStudent.registrationHistory.findIndex(h =>
                    h.schoolYear === activeSchoolYear.schoolYear &&
                    h.semester === currentSemester
                );

                if (historyIndex !== -1) {
                    updatedStudent.registrationHistory[historyIndex].status = "unenrolled";
                    updatedStudent.registrationHistory[historyIndex].section = "";
                    updatedStudent.registrationHistory[historyIndex].subjects = [];
                    await updatedStudent.save();
                }

                await Section.updateOne(
                    { students: studentId },
                    { $pull: { students: studentId } }
                );
                await Subject.updateMany(
                    { students: studentId },
                    { $pull: { students: studentId } }
                );
            }

            return res.status(200).json({ 
                message: "Student updated successfully.",
                student: updatedStudent
            });
        }

        return res.status(400).json({ message: "Invalid student type." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getStudents = async (req, res) => {
    try {
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        const currentSchoolYear = await SchoolYear.findOne({ isCurrent: true });

        if (!activeSchoolYear || !currentSchoolYear) {
            return res.status(400).json({ message: "No active/current school year set." });
        }

        const query = {
            $or: [
                {
                    registrationHistory: {
                        $elemMatch: {
                            schoolYear: activeSchoolYear.schoolYear,
                            semester: activeSchoolYear.semester
                        }
                    }
                },
                {
                    status: 'enrolled',
                    semester: activeSchoolYear.semester,
                    enrollmentYear: activeSchoolYear.schoolYear.split('-')[0]
                },
                {
                    status: 'pending',
                    semester: activeSchoolYear.semester
                },
                {
                    studentType: 'repeater',
                    status: 'pending',
                    hasEnrollmentRequest: true,
                    schoolYear: currentSchoolYear._id
                }
            ]
        };

        const students = await Student.find(query)
            .populate({
                path: 'registrationHistory.subjects.subjectId',
                select: 'subjectCode subjectName semester sections'  // ✅ sections included
            })
            .sort({ createdAt: -1 });
        
            

        const studentsWithDerivedStatus = students.map(student => {

            const currentSemHistory = student.registrationHistory.find(h =>
                h.schoolYear === activeSchoolYear.schoolYear &&
                h.semester === activeSchoolYear.semester
            );

            const latestHistory = student.registrationHistory
                .slice()
                .sort((a, b) => {
                    const yearDiff = b.schoolYear.localeCompare(a.schoolYear);
                    if (yearDiff !== 0) return yearDiff;
                    return b.semester - a.semester;
                })[0] || null;

            const currentYearHistory = student.registrationHistory
                .filter(h => h.schoolYear === activeSchoolYear.schoolYear)
                .sort((a, b) => b.semester - a.semester)[0] || null;

            // ✅ Repeater pending — hindi pa enrolled sa bagong sem
            const isRepeaterPending = student.studentType === 'repeater' &&
                                    student.status === 'pending' &&
                                    student.hasEnrollmentRequest === true;

            // ✅ Kung repeater pending — null ang source, walang subjects
            const sourceHistory = isRepeaterPending
                ? null
                : (currentSemHistory || latestHistory);

            const activeSection = isRepeaterPending
                ? ''
                : (currentSemHistory?.section || latestHistory?.section || '');

            // ✅ derivedSubjects — empty pag repeater pending
            const derivedSubjects = isRepeaterPending
                ? []
                : sourceHistory?.subjects?.map(s => {
                    const populatedSubject = s.subjectId;
                    const matchedSection = populatedSubject?.sections?.find(
                        sec => sec.sectionName === activeSection
                    );
                    return {
                        subjectId:         populatedSubject?._id          || s.subjectId,
                        subjectCode:       populatedSubject?.subjectCode   || '',
                        subjectName:       populatedSubject?.subjectName   || s.subjectName || '',
                        subjectTeacher:    s.subjectTeacher                || '',
                        semester:          populatedSubject?.semester      || s.semester    || null,
                        scheduleStartTime: matchedSection?.scheduleStartTime || s.scheduleStartTime || '',
                        scheduleEndTime:   matchedSection?.scheduleEndTime   || s.scheduleEndTime   || '',
                        room:              matchedSection?.room              || s.room              || '',
                    };
                }) || [];

            return {
                ...student.toObject(),
                currentSemEnrolled:  !!(currentSemHistory?.status === 'enrolled'),
                currentSemHistory:   currentSemHistory  || null,
                currentYearHistory:  currentYearHistory || null,
                currentSemSubjects:  derivedSubjects,
                subjects:            derivedSubjects,

                displayGradeLevel:  currentSemHistory?.gradeLevel  || latestHistory?.gradeLevel  || student.gradeLevel,
                displaySection:     currentSemHistory?.status === 'enrolled'
                                        ? currentSemHistory.section
                                        : 'No Section',
                displayStrand:      currentSemHistory?.strand      || latestHistory?.strand      || student.strand,
                displaySemester:    currentSemHistory?.semester    || latestHistory?.semester    || activeSchoolYear.semester,
                displaySchoolYear:  currentSemHistory?.schoolYear  || latestHistory?.schoolYear  || activeSchoolYear.schoolYear,
            };
        });

        return res.status(200).json(studentsWithDerivedStatus);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};




export const deleteStudent = async(req, res) => {
    try {
        const studentId = req.params.id;

        await Section.updateMany(
            { students: studentId },
            { $pull: { students: studentId, isEnrolled: studentId } }
        );

        await Subject.updateMany(
            { students: studentId },
            { $pull: { students: studentId } }
        );

        await Student.deleteOne({_id: studentId});
        
        res.status(200).json({ message: "successfully deleted"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export const getAssignSections = async (req, res) => {
    try {
        const { gradeLevel, track, strand } = req.query;

        const filter = {};
        if (gradeLevel) filter.gradeLevel = parseInt(gradeLevel);
        if (track) filter.track = track;
        if (strand) filter.strand = strand;

        const activeSchoolYear = await SchoolYear.findOne({ isActive: true }); // ✅ isActive
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        const sections = await Section.find({ 
            ...filter,
            schoolYear: activeSchoolYear._id,
            semester: activeSchoolYear.semester  // ✅ always naka-point sa active sem
        }).sort({ name: 1 });

        const sectionsWithSlots = sections.map(section => {
            const currentStudents = section.students?.length || 0;
            const availableSlots = section.maxCapacity - currentStudents;
            
            return {
                _id: section._id,
                name: section.name,
                gradeLevel: section.gradeLevel,
                track: section.track,
                strand: section.strand,
                semester: section.semester,
                students: section.students,
                maxCapacity: section.maxCapacity,
                currentStudents: currentStudents,
                availableSlots: availableSlots,
                isFull: availableSlots === 0
            };
        });

        res.status(200).json(sectionsWithSlots);
        
    } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ 
            message: 'Failed to fetch sections', 
            error: error.message 
        });
    }
};


export const setStudentsPending = async (req, res) => {
    try {   
        const { studentIds } = req.body;

        // Validation
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ 
                message: "Student IDs array is required and must not be empty" 
            });
        }

        const result = await Student.updateMany(
            { _id: { $in: studentIds } },
            { 
                $set: { 
                    status: 'pending',
                    subjects: []  // Clear subjects array
                }
            }
        );

        await Subject.updateMany(
            { students: { $in: studentIds } },
            { $pull: { students: { $in: studentIds }}}
        )
        
        // Check if any documents were modified
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                message: "No students found with the provided IDs" 
            });
        }

        res.status(200).json({ 
            success: true,
            message: `Successfully updated ${result.modifiedCount} student(s) to pending status`,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error setting students to pending:", error);
        res.status(500).json({ message: error.message });
    }
}





export const EnrollStudentFromPortal = async (req, res) => {
  try {
    const studentId = req.account.id;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });

    const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
    if (!activeSchoolYear) return res.status(400).json({ message: "No active school year." });

    const activeSemester      = activeSchoolYear.semester;
    const activeSchoolYearStr = activeSchoolYear.schoolYear;

    // ✅ Guard — already enrolled this sem
    const alreadyEnrolled = student.registrationHistory.some(h =>
        h.schoolYear === activeSchoolYearStr &&
        h.semester   === activeSemester &&
        h.status     === "enrolled"
    );
    if (alreadyEnrolled) {
        return res.status(400).json({ message: "You are already enrolled for this semester." });
    }

    // ✅ Repeater block
    if (student.studentType === 'repeater') {
        student.status = 'pending';
        student.hasEnrollmentRequest = true;
        student.semester = activeSemester;
        await student.save();
        return res.status(200).json({ 
            message: "Enrollment request submitted. Please wait for admin approval." 
        });
    }

    // ✅ Find section — direct via students[] + active SY + sem
    const findSection = await Section.findOne({
        students: studentId,
        schoolYear: activeSchoolYear._id,
        semester: activeSemester
    });

    if (!findSection) {
        return res.status(404).json({ message: "No matching section found for this semester." });
    }

    // ✅ Derive from section — mas accurate kaysa sa student global fields
    const currentSection = findSection.name;
    const currentGrade   = findSection.gradeLevel;  // ← G12 na pag promoted

    if (!findSection.isOpenEnrollment) {
        return res.status(400).json({ message: "Enrollment is not open for your section." });
    }

    if (findSection.isEnrolled.includes(studentId)) {
        return res.status(400).json({ message: "You are already enrolled in this section." });
    }

    if (findSection.students.length >= findSection.maxCapacity) {
        return res.status(400).json({ message: "Section is already full." });
    }

    // ✅ Update student — gradeLevel derived from section
    student.semester    = activeSemester;
    student.gradeLevel  = currentGrade;    // ← G11 → G12 update dito na mangyayari
    student.section     = currentSection;

    if (!findSection.isEnrolled.includes(studentId)) {
        findSection.isEnrolled.push(studentId);
    }
    await findSection.save();

    // ✅ Subject lookup — scoped sa active SY + derived grade
    const matchedSubjects = await Subject.find({
        gradeLevel: currentGrade,
        strand: student.strand,
        track: student.track,
        semester: activeSemester,
        schoolYear: activeSchoolYear._id
    });

    // ✅ Pull from old subjects first — clean slate
    await Subject.updateMany(
        { students: studentId },
        { $pull: { students: studentId } }
    );

    student.subjects = [];
    for (const subj of matchedSubjects) {
        const sectionSchedule = subj.sections?.find(
            s => s.sectionName === currentSection
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

    // ✅ registrationHistory upsert
    const historyIndex = student.registrationHistory.findIndex(h =>
        h.schoolYear === activeSchoolYearStr &&
        h.semester   === activeSemester
    );

    const historyEntry = {
        lrn:           student.lrn,
        studentNumber: student.studentNumber,
        firstName:     student.firstName,
        lastName:      student.lastName,
        track:         student.track,
        semester:      activeSemester,
        schoolYear:    activeSchoolYearStr,
        gradeLevel:    currentGrade,       // ← G12 na
        section:       currentSection,
        strand:        student.strand,
        status:        "enrolled",
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
    return res.status(200).json({ message: "Enrollment successful." });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};