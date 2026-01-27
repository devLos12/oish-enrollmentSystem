import Student from "../model/student.js";
import Section from "../model/section.js";
import Subject from "../model/subject.js";
import bcrypt from "bcrypt";
import Staff from "../model/staff.js";
import Admin from "../model/admin.js";




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

        // ✅ 8. CREATE STUDENT
        const newStudent = await Student.create({
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

        // Get current student data
        const currentStudent = await Student.findById(studentId);
        if (!currentStudent) {
            return res.status(404).json({ message: "Student not found." });
        }


        if (lrn !== undefined && lrn !== null) {
            // If LRN is being updated, validate format
            const cleanedLRN = String(lrn).trim();
            
            // Check if it's not empty and not "N/A"
            if (cleanedLRN !== '' && cleanedLRN.toUpperCase() !== 'N/A') {
                // Must be exactly 12 digits
                const digitsOnly = cleanedLRN.replace(/\D/g, '');

                if (digitsOnly.length !== 12) {
                    return res.status(400).json({ 
                        message: "LRN must be exactly 12 digits." 
                    });
                }
                // Additional check: must contain only numbers
                if (cleanedLRN !== digitsOnly) {
                    return res.status(400).json({ 
                        message: "LRN must contain only numbers." 
                    });
                }
            }
        }

        

        // Use incoming LRN if provided, otherwise use current student's LRN
        const lrnToCheck = lrn !== undefined ? lrn : currentStudent.lrn;
        const hasValidLRN = lrnToCheck && 
                           String(lrnToCheck).trim() !== '' && 
                           String(lrnToCheck).trim().toUpperCase() !== 'N/A';
        

        if (!hasValidLRN) {
            // If trying to assign a section
            if (section && section.trim() !== '') {
                return res.status(400).json({ 
                    message: "Cannot assign section. Student must have a valid LRN first." 
                });
            }
            
            // If trying to change status to enrolled
            if (status === 'enrolled') {
                return res.status(400).json({ 
                    message: "Cannot enroll student. Student must have a valid LRN first." 
                });
            }
        }


        return;



        // 🔥 Check if any critical field changed
        const studentTypeChanged = currentStudent.studentType !== studentType;
        const gradeChanged = currentStudent.gradeLevel !== gradeLevel;
        const trackChanged = currentStudent.track !== track;
        const strandChanged = currentStudent.strand !== strand;
        const semesterChanged = currentStudent.semester !== semester;

        // 🔥 Any of these changes means subjects need to be re-assigned
        const criticalFieldChanged = gradeChanged || trackChanged || strandChanged || semesterChanged;

        // ========================================
        // 🔥 GENERAL UPDATE - Basic Info (applies to all)
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
        // 🔥 REMOVE FROM OLD SUBJECTS & SECTION IF CRITICAL FIELD CHANGED
        // ========================================
        if (criticalFieldChanged) {
            // 🔥 Pull student from all old subjects
            await Subject.updateMany(
                { students: studentId },
                { $pull: { students: studentId } }
            );

            // 🔥 Remove from old section
            await Section.updateOne(
                { students: studentId },
                { $pull: { students: studentId } }
            );
        }

        // ========================================
        // 🔥 REPEATER STUDENT ENROLLMENT PROCESS
        // ========================================
        if (studentType === 'repeater' && status === 'enrolled') {
            // Prepare repeated subjects
            const finalRepeatedSubjects = repeatedSubjects ? repeatedSubjects : [];

            // 🔥 Auto-detect semester based on repeated subjects
            let autoSemester = semester;
            
            if (finalRepeatedSubjects.length > 0) {
                const hasSem1 = finalRepeatedSubjects.some(subj => 
                    String(subj.semester) === '1' || subj.semester === 1
                );
                const hasSem2 = finalRepeatedSubjects.some(subj => 
                    String(subj.semester) === '2' || subj.semester === 2
                );
                
                if (hasSem1) {
                    autoSemester = 1;
                } else if (hasSem2) {
                    autoSemester = 2;
                }
            }

            // 🔥 Remove student from all subjects first (clean slate)
            await Subject.updateMany(
                { students: studentId },
                { $pull: { students: studentId } }
            );

            // Update student with repeater enrollment fields
            const updatedStudent = await Student.findOneAndUpdate(
                { _id: studentId },
                { 
                    $set: { 
                        semester: Number(autoSemester),
                        section,
                        status, 
                        studentType,
                        repeatedSubjects: finalRepeatedSubjects,
                        hasEnrollmentRequest: false,
                        subjects: []
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update." });
            }

            // Find and add to section
            const findSection = await Section.findOne({
                name: section,
                gradeLevel: gradeLevel,
                track: track,
                strand: strand,
                semester: autoSemester
            });

            // Remove from old section if exists
            const oldSection = await Section.findOne({
                students: studentId
            });

            if (oldSection && oldSection.name !== section) {
                oldSection.students.pull(studentId);
                await oldSection.save();
            }
            
            // Add to new section
            if (findSection) {
                if (!findSection.students.includes(studentId)) {
                    findSection.students.push(studentId);
                    await findSection.save();
                }
            }

            // 🔥 Auto-sync subjects based on repeatedSubjects
            if (finalRepeatedSubjects.length > 0) {
                for (const repeatedRef of finalRepeatedSubjects) {
                    if (Number(repeatedRef.semester) !== Number(autoSemester)) {
                        continue;
                    }

                    const actualSubject = await Subject.findOne({
                        subjectCode: repeatedRef.subjectCode,
                        subjectName: repeatedRef.subjectName,
                        semester: repeatedRef.semester
                    });

                    if (actualSubject) {
                        updatedStudent.subjects.push({
                            subjectId: actualSubject._id,
                            subjectName: actualSubject.subjectName,
                            subjectTeacher: actualSubject.teacher,
                            semester: actualSubject.semester
                        });

                        await Subject.findByIdAndUpdate(actualSubject._id, {
                            $addToSet: { students: updatedStudent._id }
                        });
                    }
                }
            }

            // 🔥 Always push to registration history (latest data)
            updatedStudent.registrationHistory.push({
                lrn: updatedStudent.lrn,
                studentNumber: updatedStudent.studentNumber,
                firstName: updatedStudent.firstName,
                lastName: updatedStudent.lastName,
                track: updatedStudent.track,
                semester: Number(autoSemester),
                schoolYear: updatedStudent.enrollmentYear,
                gradeLevel: updatedStudent.gradeLevel,
                section: updatedStudent.section,
                strand: updatedStudent.strand,
                subjects: updatedStudent.subjects.map(s => ({
                    subjectId: s.subjectId,
                    subjectName: s.subjectName,
                    subjectTeacher: s.subjectTeacher,
                    semester: s.semester
                })),
                dateCreated: new Date()
            });

            await updatedStudent.save();

            return res.status(200).json({ 
                message: "Repeater student enrolled successfully.",
                student: updatedStudent
            });
        }




        // ========================================
        // 🔥 REPEATER STUDENT UNENROLLED PROCESS
        // ========================================
        if (studentType === 'repeater' && status === 'unenrolled') {
            const finalRepeatedSubjects = repeatedSubjects ? repeatedSubjects : [];

            if (finalRepeatedSubjects.length > 0) {
                const invalidSubjects = [];
                
                for (const repeatedRef of finalRepeatedSubjects) {
                    const subjectExists = await Subject.findOne({
                        subjectCode: repeatedRef.subjectCode,
                        subjectName: repeatedRef.subjectName
                    });

                    if (!subjectExists) {
                        invalidSubjects.push({
                            subjectCode: repeatedRef.subjectCode,
                            subjectName: repeatedRef.subjectName
                        });
                    }
                }

                if (invalidSubjects.length > 0) {
                    return res.status(400).json({ 
                        message: "One or more subjects do not exist in the system.",
                        invalidSubjects: invalidSubjects
                    });
                }
            }

            let autoSemester = semester;
            
            if (finalRepeatedSubjects.length > 0) {
                const hasSem1 = finalRepeatedSubjects.some(subj => 
                    String(subj.semester) === '1' || subj.semester === 1
                );
                const hasSem2 = finalRepeatedSubjects.some(subj => 
                    String(subj.semester) === '2' || subj.semester === 2
                );
                
                if (hasSem1) {
                    autoSemester = 1;
                } else if (hasSem2) {
                    autoSemester = 2;
                }
            }

            const oldSection = await Section.findOne({
                students: studentId
            });

            const updatedStudent = await Student.findOneAndUpdate(
                { _id: studentId },
                { 
                    $set: { 
                        semester: Number(autoSemester),
                        section: "",
                        repeatedSection: oldSection ? oldSection.name : "",
                        status, 
                        studentType,
                        repeatedSubjects: finalRepeatedSubjects,
                        hasEnrollmentRequest: true,
                        subjects: []
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update." });
            }

            if (oldSection) {
                oldSection.students.pull(studentId);
                await oldSection.save();
            }

            await Subject.updateMany(
                { students: studentId },
                { $pull: { students: studentId } }
            );

            return res.status(200).json({ 
                message: "Repeater student updated successfully.",
                student: updatedStudent
            });
        }




        // ========================================
        // 🔥 REGULAR STUDENT PROCESS
        // ========================================
        if (studentType === 'regular') {
            const updatedStudent = await Student.findOneAndUpdate(
                { _id: studentId },
                { 
                    $set: { 
                        semester,
                        section,
                        status, 
                        studentType,
                        repeatedSubjects: [],
                        hasEnrollmentRequest: false, 
                        repeatedSection: '', 
                        ...(studentTypeChanged || criticalFieldChanged) && { subjects: [] }
                    }
                },
                { new: true }
            );

            if (!updatedStudent) {
                return res.status(409).json({ message: "Failed to update." });
            }

            if (status === "enrolled") {
                const findSection = await Section.findOne({
                    name: section,
                    gradeLevel: gradeLevel,
                    track: track,
                    strand: strand,
                    semester: semester
                });

                const oldSection = await Section.findOne({
                    students: studentId
                });



                if (oldSection && oldSection.name !== section) {
                    oldSection.students.pull(studentId);
                    await oldSection.save();
                }

                if (findSection) {
                    if (!findSection.students.includes(studentId)) {
                        findSection.students.push(studentId);
                        await findSection.save();
                    }
                }

                // 🔥 Remove from old subjects if critical field changed
                if (criticalFieldChanged) {
                    await Subject.updateMany(
                        { students: studentId },
                        { $pull: { students: studentId } }
                    );
                }

                // Auto-assign subjects based on grade level/strand/semester
                const matchedSubjects = await Subject.find({
                    gradeLevel: gradeLevel,
                    strand: strand,
                    track: track,
                    semester: semester
                });

                if (matchedSubjects.length > 0) {
                    for (const subj of matchedSubjects) {
                        const alreadyHas = updatedStudent.subjects?.some(
                            (s) => s.subjectId?.toString() === subj._id.toString()
                        );

                        if (!alreadyHas) {
                            updatedStudent.subjects.push({
                                subjectId: subj._id,
                                subjectName: subj.subjectName,
                                subjectTeacher: subj.teacher,
                                semester: subj.semester
                            });
                        }

                        await Subject.findByIdAndUpdate(subj._id, {
                            $addToSet: { students: updatedStudent._id }
                        });

                    }
                }

                // 🔥 Always push to registration history (latest data)
                updatedStudent.registrationHistory.push({
                    lrn: updatedStudent.lrn,
                    studentNumber: updatedStudent.studentNumber,
                    firstName: updatedStudent.firstName,
                    lastName: updatedStudent.lastName,
                    track: updatedStudent.track,
                    semester: updatedStudent.semester,
                    schoolYear: updatedStudent.enrollmentYear,
                    gradeLevel: updatedStudent.gradeLevel,
                    section: updatedStudent.section,
                    strand: updatedStudent.strand,
                    subjects: updatedStudent.subjects.map(s => ({
                        subjectId: s.subjectId,
                        subjectName: s.subjectName,
                        subjectTeacher: s.subjectTeacher,
                        semester: s.semester
                    })),
                    dateCreated: new Date()
                });

                await updatedStudent.save();
            }

            return res.status(200).json({ 
                message: "Student updated successfully.",
                student: updatedStudent
            });
        }

        return res.status(400).json({ 
            message: "Invalid student type." 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// GET all students
export const getStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 }); // latest first
        
        return res.status(200).json(students);
    } catch (error) {
        return res.status(500).json({ error: error.message});
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
        const { gradeLevel, track, strand, semester } = req.query;


        // Build filter object
        const filter = {};
        
        if (gradeLevel) {
            filter.gradeLevel = parseInt(gradeLevel);
        }
        
        if (track) {
            filter.track = track;
        }
        
        if (strand) {
            filter.strand = strand;
        }
        
        if (semester) {
            filter.semester = parseInt(semester);
        }


        const sections = await Section.find(filter).sort({ name: 1 });
        

        // Add computed fields for available slots
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
    const studentId = req.account.id; // Logged-in student from token

    // 1️⃣ Fetch student
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });

    
    if(student.studentType === 'repeater' && student.repeatedSubjects.length > 0){
        
        if(student.status === 'unenrolled'){
            student.status = "pending";
            student.hasEnrollmentRequest = false;
        }
        
        await student.save();
        return res.status(200).json({ message: "Enrollment successful" });

    }

    const nextGrade = 12;
    const nextSemester = 1;
    const currentSection = student.section;

    // 2️⃣ Update grade, semester, status
    student.gradeLevel = nextGrade;
    student.semester = nextSemester;
    student.status = "enrolled";
    student.createdAt = new Date();



    // 3️⃣ Auto-assign subjects for new level
    const matchedSubjects = await Subject.find({
      gradeLevel: nextGrade,
      strand: student.strand,
      semester: nextSemester
    });

    student.subjects = []; // reset subjects

    for (const subj of matchedSubjects) {
      student.subjects.push({
        subjectId: subj._id,
        subjectName: subj.subjectName,
        subjectTeacher: subj.teacher,
        semester: subj.semester
      });

      await Subject.findByIdAndUpdate(subj._id, {
        $addToSet: { students: student._id }
      });
    }

    // 4️⃣ Update registration history
    student.registrationHistory.push({
      lrn: student.lrn,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      track: student.track,
      semester: nextSemester,
      schoolYear: student.enrollmentYear,
      gradeLevel: nextGrade,
      section: currentSection,
      strand: student.strand,
      subjects: student.subjects,
      dateCreated: new Date()
    });

    // 5️⃣ Save student
    await student.save();

    // 6️⃣ ADD STUDENT TO SECTION.isEnrolled ARRAY
    await Section.findOneAndUpdate(
      { name: currentSection },
      { $addToSet: { isEnrolled: student._id } } // para iwas duplicate
    );

    return res.status(200).json({ message: "Enrollment successful" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
