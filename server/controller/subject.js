import Subject from "../model/subject.js";
import Student from "../model/student.js";
import Staff from '../model/staff.js';
import Section from "../model/section.js";
import SchoolYear from "../model/schoolYear.js";





export const deleteSubjectSection = async(req, res) => {
    try {
        const { id, sectionId } = req.params;

        // Find the subject
        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // Find the section to delete
        const sectionIndex = subject.sections.findIndex(
            section => section._id.toString() === sectionId
        );

        if (sectionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        // Remove section
        subject.sections.splice(sectionIndex, 1);
        await subject.save();

        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: subject
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}



export const updateSubjectSection = async(req, res) => {
    try {
        const { id, sectionId } = req.params;
        const { sectionName, scheduleDay, scheduleStartTime, scheduleEndTime, room, gradeLevel } = req.body;

        // Find the subject
        const subject = await Subject.findOne({
            _id: id,
            gradeLevel: gradeLevel
        });
        
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // Find the section to update
        const sectionIndex = subject.sections.findIndex(
            section => section._id.toString() === sectionId
        );

        if (sectionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        // Update section
        subject.sections[sectionIndex] = {
            ...subject.sections[sectionIndex].toObject(),
            sectionName,
            scheduleDay,
            scheduleStartTime,
            scheduleEndTime,
            room
        };

        await subject.save();

        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: subject
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}



export const addSubjectSection = async(req, res) => {
    try {
        const { id } = req.params;
        const { sectionName, scheduleStartTime, scheduleEndTime, room, gradeLevel } = req.body;

        // Validation
        if (!sectionName || !scheduleStartTime || !scheduleEndTime || !room) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // ✅ FIX 1 — get activeSchoolYear once, use everywhere
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({
                success: false,
                message: "No active school year."
            });
        }

        // Find the subject
        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // Check if section already exists in this subject
        const sectionExists = subject.sections.some(
            section => section.sectionName === sectionName
        );
        if (sectionExists) {
            return res.status(400).json({
                success: false,
                message: "Section already exists in this subject"
            });
        }

        // ✅ FIX 2 — findOne (not find) + scoped sa activeSchoolYear
        const studentSec = await Section.findOne({
            name: sectionName,
            gradeLevel: gradeLevel,
            schoolYear: activeSchoolYear._id
        });
        const secId = studentSec?._id ?? null;

        // Add new section to subject
        subject.sections.push({
            sectionId: secId,
            sectionName,
            scheduleStartTime,
            scheduleEndTime,
            room,
        });
        await subject.save();

        // ✅ FIX 3 — studentsToUpdate scoped sa active school year + semester
        const studentsToUpdate = await Student.find({
            section: sectionName,
            "subjects.subjectId": subject._id,
            registrationHistory: {
                $elemMatch: {
                    schoolYear: activeSchoolYear.schoolYear,
                    semester: activeSchoolYear.semester
                }
            }
        });

        if (studentsToUpdate.length > 0) {
            const updatePromises = studentsToUpdate.map(async (student) => {

                // Update subjects[] array
                const subjectIndex = student.subjects.findIndex(
                    s => s.subjectId.toString() === subject._id.toString()
                );
                if (subjectIndex !== -1) {
                    student.subjects[subjectIndex].scheduleStartTime = scheduleStartTime;
                    student.subjects[subjectIndex].scheduleEndTime = scheduleEndTime;
                    student.subjects[subjectIndex].room = room;
                }

                // ✅ FIX 4 — exact match ng active sem, hindi lastIndex
                const historyIndex = student.registrationHistory.findIndex(h =>
                    h.schoolYear === activeSchoolYear.schoolYear &&
                    h.semester === activeSchoolYear.semester
                );

                if (historyIndex !== -1) {
                    const historySubjectIndex = student.registrationHistory[historyIndex].subjects.findIndex(
                        s => s.subjectId.toString() === subject._id.toString()
                    );
                    if (historySubjectIndex !== -1) {
                        student.registrationHistory[historyIndex].subjects[historySubjectIndex].scheduleStartTime = scheduleStartTime;
                        student.registrationHistory[historyIndex].subjects[historySubjectIndex].scheduleEndTime = scheduleEndTime;
                        student.registrationHistory[historyIndex].subjects[historySubjectIndex].room = room;
                    }
                }

                return student.save();
            });

            await Promise.all(updatePromises);
        }

        return res.status(200).json({
            success: true,
            message: `Section added successfully and synced to ${studentsToUpdate.length} student(s)`,
            data: subject
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



export const bulkAddSubjectSections = async (req, res) => {
    try {
        const { id } = req.params;
        const { sections } = req.body;

        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({ success: false, message: "No sections data provided" });
        }

        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ success: false, message: "No active school year." });
        }

        const errors = [];
        const toAdd = [];

        for (let i = 0; i < sections.length; i++) {
            const { sectionName, scheduleStartTime, scheduleEndTime, room } = sections[i];
            const rowNum = i + 1;

            if (!sectionName?.trim()) { errors.push(`Row ${rowNum}: Section Name is required`); continue; }
            if (!scheduleStartTime) { errors.push(`Row ${rowNum}: Start Time is required`); continue; }
            if (!scheduleEndTime) { errors.push(`Row ${rowNum}: End Time is required`); continue; }
            if (!room?.trim()) { errors.push(`Row ${rowNum}: Room is required`); continue; }

            const alreadyExists = subject.sections.some(s => s.sectionName === sectionName.trim());
            if (alreadyExists) { errors.push(`Row ${rowNum}: Section "${sectionName}" already exists in this subject`); continue; }

            const dupInBatch = toAdd.some(s => s.sectionName === sectionName.trim());
            if (dupInBatch) { errors.push(`Row ${rowNum}: Duplicate section "${sectionName}" in batch`); continue; }

            const studentSec = await Section.findOne({
                name: sectionName.trim(),
                gradeLevel: subject.gradeLevel,
                schoolYear: activeSchoolYear._id
            });

            toAdd.push({
                sectionId: studentSec?._id ?? null,
                sectionName: sectionName.trim(),
                scheduleStartTime,
                scheduleEndTime,
                room: room.trim()
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        subject.sections.push(...toAdd);
        await subject.save();

        // Sync schedule to existing students per section
        let totalSynced = 0;
        for (const sec of toAdd) {
            const studentsToUpdate = await Student.find({
                section: sec.sectionName,
                "subjects.subjectId": subject._id,
                registrationHistory: {
                    $elemMatch: {
                        schoolYear: activeSchoolYear.schoolYear,
                        semester: activeSchoolYear.semester
                    }
                }
            });

            if (studentsToUpdate.length > 0) {
                const updateOps = studentsToUpdate.map(async (student) => {
                    const subjectIndex = student.subjects.findIndex(
                        s => s.subjectId.toString() === subject._id.toString()
                    );
                    if (subjectIndex !== -1) {
                        student.subjects[subjectIndex].scheduleStartTime = sec.scheduleStartTime;
                        student.subjects[subjectIndex].scheduleEndTime = sec.scheduleEndTime;
                        student.subjects[subjectIndex].room = sec.room;
                    }

                    const historyIndex = student.registrationHistory.findIndex(h =>
                        h.schoolYear === activeSchoolYear.schoolYear &&
                        h.semester === activeSchoolYear.semester
                    );
                    if (historyIndex !== -1) {
                        const histSubjectIndex = student.registrationHistory[historyIndex].subjects.findIndex(
                            s => s.subjectId.toString() === subject._id.toString()
                        );
                        if (histSubjectIndex !== -1) {
                            student.registrationHistory[historyIndex].subjects[histSubjectIndex].scheduleStartTime = sec.scheduleStartTime;
                            student.registrationHistory[historyIndex].subjects[histSubjectIndex].scheduleEndTime = sec.scheduleEndTime;
                            student.registrationHistory[historyIndex].subjects[histSubjectIndex].room = sec.room;
                        }
                    }
                    return student.save();
                });
                await Promise.all(updateOps);
                totalSynced += studentsToUpdate.length;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Successfully added ${toAdd.length} section(s) and synced to ${totalSynced} student(s)`,
            imported: toAdd.length
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};




export const getSubjectDetails = async(req, res) => {
    try {
        const { id } = req.params;
        
        const subject = await Subject.findOne({ _id: id });
        
        if(!subject){
            return res.status(404).json({ 
                message: "No Subject details found.",
                success: false
            });
        }

        // Get all section IDs from the subject
        const sectionIds = subject.sections?.map(sec => sec.sectionId) || [];
        
        // Fetch the actual Section documents to get students
        const sectionsWithStudents = await Section.find({ 
            _id: { $in: sectionIds } 
        });

        // Map the sections and merge with student data
        const enrichedSections = subject.sections.map(subjectSection => {
            const sectionData = sectionsWithStudents.find(
                sec => sec._id.toString() === subjectSection.sectionId.toString()
            );
            
            return {
                ...subjectSection.toObject(), // Convert mongoose doc to plain object
                students: sectionData?.students || []
            };
        });

        // Create response object with enriched sections
        const responseData = {
            ...subject.toObject(),
            sections: enrichedSections
        };


        return res.status(200).json({ 
            message: "Subject details retrieved successfully",
            data: responseData,
            success: true
        });

    } catch (error) {
        return res.status(500).json({ 
            message: error.message,
            success: false
        });
    }
}




export const getSubjectSection = async (req, res) => {
    try {
        const { gradeLevel, track, strand, semester, subjectId } = req.query;

        
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

        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // ✅ Get all sections matching the filter
        const sections = await Section.find({
            ...filter,
            schoolYear: activeSchoolYear._id
        }).sort({ name: 1 });

        
        // ✅ IMPROVED: Filter out sections already assigned to THIS subject
        let availableSections = sections;
        
        if (subjectId) {
            const currentSubject = await Subject.findById(subjectId);
            
            if (currentSubject && currentSubject.sections && currentSubject.sections.length > 0) {
                // Get list of already-assigned section names
                const assignedSectionNames = currentSubject.sections.map(s => s.sectionName);
                
                // Filter out already-assigned sections
                availableSections = sections.filter(
                    section => !assignedSectionNames.includes(section.name)
                );
            }
        }

        // ✅ Add computed fields for available slots
        const sectionsWithSlots = availableSections.map(section => {
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

        return res.status(200).json(sectionsWithSlots);
        
    } catch (error) {
        console.error('Error fetching sections:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch sections', 
            error: error.message 
        });
    }
};















export const getAllSubjects = async (req, res) => {
    try {
        const activeSchoolYear = await SchoolYear.findOne({ isActive: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        const subjects = await Subject.find({ 
            schoolYear: activeSchoolYear._id  // 👈 dagdag lang
        }).sort({ gradeLevel: 1, strand: 1, subjectName: 1 });
        
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Staff.find()
            .select('_id firstName lastName email imageFile')
            .sort({ lastName: 1, firstName: 1 });

        const formattedTeachers = teachers.map(teacher => ({
            _id: teacher._id,
            fullName: `${teacher.firstName} ${teacher.lastName}`,
            email: teacher.email,
            imageFile: teacher.imageFile
        }));

        res.status(200).json(formattedTeachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const bulkAddSubjects = async (req, res) => {
    try {
        const { subjects } = req.body;




        // Validate request
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ 
                message: "No subjects data provided" 
            });
        }

        // Validate each subject has required fields
        const validationErrors = [];
        subjects.forEach((subject, index) => {
            const required = ['subjectCode', 'subjectName', 'gradeLevel', 'track', 'strand', 'subjectType', 'teacherId', 'teacherName'];
            const missing = required.filter(field => !subject[field]);
            if (missing.length > 0) {
                validationErrors.push(`Subject ${index + 1}: Missing ${missing.join(', ')}`);
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Validation failed", errors: validationErrors });
        }

        // Check for duplicate subject codes in the batch
        const subjectCodes = subjects.map(s => s.subjectCode.toUpperCase());
        const duplicates = subjectCodes.filter((code, index) => subjectCodes.indexOf(code) !== index);
        if (duplicates.length > 0) {
            return res.status(400).json({ 
                message: `Duplicate subject codes found in batch: ${[...new Set(duplicates)].join(', ')}` 
            });
        }

        // Get active school year — source of truth
        const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }

        // Check for existing subject codes in database
        const existingSubjects = await Subject.find({ 
            subjectCode: { 
                $in: subjectCodes 
            },
            schoolYear: {
                $in: activeSchoolYear._id
            } 
        });



        if (existingSubjects.length > 0) {
            const existing = existingSubjects.map(s => s.subjectCode).join(', ');
            return res.status(400).json({ message: `Subject codes already exist: ${existing}` });
        }
 
        // Prepare subjects for insertion
        const subjectsToInsert = subjects.map(subject => ({
            schoolYear: activeSchoolYear._id,
            subjectCode: subject.subjectCode.toUpperCase(),
            subjectName: subject.subjectName.trim(),
            gradeLevel: parseInt(subject.gradeLevel),
            semester: activeSchoolYear.semester,  // ✅ source of truth, hindi from frontend
            track: subject.track.trim(),
            strand: subject.strand.toUpperCase(),
            subjectType: subject.subjectType.toLowerCase().trim(),
            teacherId: subject.teacherId,
            teacher: subject.teacherName.trim()
        }));

        // Bulk insert
        const insertedSubjects = await Subject.insertMany(subjectsToInsert, { ordered: false });

        // 🔹 Auto-assign to enrolled students
        for (const savedSubject of insertedSubjects) {

            // ✅ Scoped to active school year + semester via registrationHistory
            const enrolledStudents = await Student.find({
                gradeLevel: savedSubject.gradeLevel,
                strand: savedSubject.strand,
                registrationHistory: {
                    $elemMatch: {
                        schoolYear: activeSchoolYear.schoolYear,  // "2026-2027"
                        semester: activeSchoolYear.semester        // 1 or 2
                    }
                }
            });

            if (enrolledStudents.length > 0) {
                const updateOps = enrolledStudents.map(student => {
                    const alreadyHas = student.subjects.some(
                        s => s.subjectId.toString() === savedSubject._id.toString()
                    );

                    const update = {};

                    if (!alreadyHas) {
                        update.$push = {
                            subjects: {
                                subjectId: savedSubject._id,
                                subjectName: savedSubject.subjectName,
                                subjectTeacher: savedSubject.teacher || "",
                                semester: savedSubject.semester
                            }
                        };
                    }

                    // ✅ Find exact history entry ng current active sem
                    const historyIndex = student.registrationHistory.findIndex(h =>
                        h.schoolYear === activeSchoolYear.schoolYear &&
                        h.semester === activeSchoolYear.semester
                    );

                    if (historyIndex !== -1) {
                        if (!update.$push) update.$push = {};
                        update.$push[`registrationHistory.${historyIndex}.subjects`] = {
                            subjectId: savedSubject._id,
                            subjectName: savedSubject.subjectName,
                            subjectTeacher: savedSubject.teacher || "",
                            semester: savedSubject.semester
                        };
                    }

                    return Object.keys(update).length ? Student.findByIdAndUpdate(student._id, update) : null;
                }).filter(Boolean);

                await Promise.all(updateOps);

                await Subject.findByIdAndUpdate(savedSubject._id, {
                    $addToSet: { 
                        students: { $each: enrolledStudents.map(s => s._id) } 
                    }
                });
            }
        }

        res.status(201).json({
            message: `Successfully imported ${insertedSubjects.length} subject(s)`,
            imported: insertedSubjects.length
        });

    } catch (error) {
        console.error("Bulk add subjects error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Some subject codes already exist in the database" });
        }
        res.status(500).json({ message: "Failed to import subjects", error: error.message });
    }
};













export const createSubject = async (req, res) => {
    try {
        const { 
            subjectName, 
            subjectCode, 
            gradeLevel, 
            strand, 
            // section,
            track, 
            semester, 
            subjectType, 
            teacherId,
            teacherName,
            // scheduleDay,        // ✅ ADD
            // scheduleStartTime,  // ✅ ADD
            // scheduleEndTime,    // ✅ ADD
            // room                // ✅ ADD
        } = req.body;

        
        // Check if subject code already exists for the SAME strand
        // const existingSubject = await Subject.findOne({ 
        //     subjectCode: subjectCode.toUpperCase(),
        //     strand: strand.toUpperCase(),
        //     section: section
        // });
        
        // if (existingSubject) {
        //     return res.status(400).json({ 
        //         message: `Subject code "${subjectCode.toUpperCase()}" already exists for ${strand.toUpperCase()} strand` 
        //     });
        // }



        const activeSchoolYear = await SchoolYear.findOne({ isCurrent: true });
        if (!activeSchoolYear) {
            return res.status(400).json({ message: "No active school year." });
        }   


        const newSubject = new Subject({
            schoolYear: activeSchoolYear._id,
            subjectName,
            subjectCode: subjectCode.toUpperCase(),
            gradeLevel: parseInt(gradeLevel),
            strand: strand.toUpperCase() || "",
            // section: section || "",
            track: track || "",
            semester: activeSchoolYear.semester,
            subjectType: subjectType || 'core',
            teacherId: teacherId,
            teacher: teacherName,
            // scheduleDay: scheduleDay || "",           // ✅ ADD
            // scheduleStartTime: scheduleStartTime || "", // ✅ ADD
            // scheduleEndTime: scheduleEndTime || "",     // ✅ ADD
            // room: room || ""                           // ✅ ADD
        });
        
        const savedSubject = await newSubject.save();

        // 🔹 Find all enrolled students matching this subject
        const enrolledStudents = await Student.find({
            gradeLevel: savedSubject.gradeLevel,
            strand: savedSubject.strand,
            registrationHistory: {
                $elemMatch: {
                    schoolYear: activeSchoolYear.schoolYear,  // "2026-2027"
                    semester: activeSchoolYear.semester        // 1 or 2
                }
            }
        });


        if (enrolledStudents.length > 0) {

            const updateOps = enrolledStudents.map(student => {
                
                const alreadyHas = student.subjects.some(
                    s => s.subjectId.toString() === savedSubject._id.toString()
                );

                const update = {};

                if (!alreadyHas) {
                    update.$push = {
                        subjects: {
                            subjectId: savedSubject._id,
                            subjectName: savedSubject.subjectName,
                            subjectTeacher: savedSubject.teacher || "",
                            semester: savedSubject.semester
                        }
                    };
                }

                const lastIndex = student.registrationHistory.length - 1;
                if (lastIndex >= 0) {
                    if (!update.$push) update.$push = {};
                    if (!update.$push[`registrationHistory.${lastIndex}.subjects`]) update.$push[`registrationHistory.${lastIndex}.subjects`] = [];
                    update.$push[`registrationHistory.${lastIndex}.subjects`].push({
                        subjectId: savedSubject._id,
                        subjectName: savedSubject.subjectName,
                        subjectTeacher: savedSubject.teacher || "",
                        semester: savedSubject.semester
                    });
                }

                return Object.keys(update).length ? Student.findByIdAndUpdate(student._id, update) : null;
            }).filter(Boolean);

            await Promise.all(updateOps);

            await Subject.findByIdAndUpdate(savedSubject._id, {
                $addToSet: { 
                    students: { $each: enrolledStudents.map(s => s._id) } 
                }
            });
        }

        res.status(201).json({ message: "Subject created successfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            subjectName, 
            subjectCode, 
            gradeLevel, 
            strand,
            // section,
            track, 
            semester, 
            subjectType,
            teacherId,
            teacherName,
            // scheduleDay,        // ✅ ADD
            // scheduleStartTime,  // ✅ ADD
            // scheduleEndTime,    // ✅ ADD
            // room                // ✅ ADD
        } = req.body;



        const subject = await Subject.findById(id);
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        // Check if subject code is changed and exists
        if (subjectCode && subjectCode.toUpperCase() !== subject.subjectCode) {
            const existing = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
            if (existing) return res.status(400).json({ message: "Subject code already exists" });
        }

        // Store old values
        const oldSemester = subject.semester;
        const oldGradeLevel = subject.gradeLevel;
        const oldStrand = subject.strand;
        const oldTrack = subject.track;
        // const oldSection = subject.section;

        // Update subject fields
        subject.subjectName = subjectName ?? subject.subjectName;
        subject.subjectCode = subjectCode ? subjectCode.toUpperCase() : subject.subjectCode;
        subject.gradeLevel = gradeLevel ? parseInt(gradeLevel) : subject.gradeLevel;
        subject.strand = strand ?? subject.strand;
        // subject.section = section ?? subject.section;
        subject.track = track ?? subject.track;
        subject.semester = semester ? parseInt(semester) : subject.semester;
        subject.subjectType = subjectType ?? subject.subjectType;
        subject.teacherId = teacherId ?? subject.teacherId;
        subject.teacher = teacherName ?? subject.teacher;
        

        // ✅ UPDATE SCHEDULE FIELDS
        // subject.scheduleDay = scheduleDay ?? subject.scheduleDay;
        // subject.scheduleStartTime = scheduleStartTime ?? subject.scheduleStartTime;
        // subject.scheduleEndTime = scheduleEndTime ?? subject.scheduleEndTime;
        // subject.room = room ?? subject.room;

        await subject.save();

        let studentsToRemoveFrom = [];
        let studentsWithSubject = [];
        let studentsToAddTo = [];



        const criticalFieldsChanged = 
            oldSemester !== subject.semester || 
            oldGradeLevel !== subject.gradeLevel ||
            oldStrand !== subject.strand ||
            // oldSection !== subject.section ||
            oldTrack !== subject.track;

        if (criticalFieldsChanged) {
            studentsToRemoveFrom = await Student.find({
                "subjects.subjectId": subject._id,
                $or: [
                    { gradeLevel: { $ne: subject.gradeLevel } },
                    { semester: { $ne: subject.semester } },
                    { strand: { $ne: subject.strand } },
                    // { section: { $ne: subject.section } },
                    { track: { $ne: subject.track } }
                ]
            });

            const removeOps = studentsToRemoveFrom.map(async (student) => {
                student.subjects = student.subjects.filter(
                    s => s.subjectId.toString() !== subject._id.toString()
                );

                const lastIndex = student.registrationHistory.length - 1;
                if (lastIndex >= 0) {
                    student.registrationHistory[lastIndex].subjects = 
                        student.registrationHistory[lastIndex].subjects.filter(
                            s => s.subjectId.toString() !== subject._id.toString()
                        );
                }

                return student.save();
            });

            await Promise.all(removeOps);

            await Subject.findByIdAndUpdate(subject._id, {
                $pull: { 
                    students: { 
                        $in: studentsToRemoveFrom.map(s => s._id) 
                    } 
                }
            });
        }

        studentsWithSubject = await Student.find({
            "subjects.subjectId": subject._id,
            gradeLevel: subject.gradeLevel,
            semester: subject.semester,
            strand: subject.strand,
            // section: subject.section,
            track: subject.track
        });

        const updateExistingOps = studentsWithSubject.map(async (student) => {
            const subjectIndex = student.subjects.findIndex(
                s => s.subjectId.toString() === subject._id.toString()
            );
            if (subjectIndex !== -1) {
                student.subjects[subjectIndex].subjectName = subject.subjectName;
                student.subjects[subjectIndex].subjectTeacher = subject.teacher || "";
                student.subjects[subjectIndex].semester = subject.semester;
            }

            const lastIndex = student.registrationHistory.length - 1;
            if (lastIndex >= 0) {
                const latestHistory = student.registrationHistory[lastIndex];
                const historySubjectIndex = latestHistory.subjects.findIndex(
                    s => s.subjectId.toString() === subject._id.toString()
                );
                
                if (historySubjectIndex !== -1) {
                    latestHistory.subjects[historySubjectIndex].subjectName = subject.subjectName;
                    latestHistory.subjects[historySubjectIndex].subjectTeacher = subject.teacher || "";
                    latestHistory.subjects[historySubjectIndex].semester = subject.semester;
                }
            }

            return student.save();
        });

        await Promise.all(updateExistingOps);

        studentsToAddTo = await Student.find({
            gradeLevel: subject.gradeLevel,
            semester: subject.semester,
            strand: subject.strand,
            track: subject.track,
            "subjects.subjectId": { $ne: subject._id }
        });

        const addOps = studentsToAddTo.map(async (student) => {
            student.subjects.push({
                subjectId: subject._id,
                subjectName: subject.subjectName,
                subjectTeacher: subject.teacher || "",
                semester: subject.semester
            });

            const lastIndex = student.registrationHistory.length - 1;
            if (lastIndex >= 0) {
                const latestHistory = student.registrationHistory[lastIndex];
                if (latestHistory.semester === subject.semester && 
                    latestHistory.gradeLevel === subject.gradeLevel) {
                    latestHistory.subjects.push({
                        subjectId: subject._id,
                        subjectName: subject.subjectName,
                        subjectTeacher: subject.teacher || "",
                        semester: subject.semester
                    });
                }
            }

            return student.save();
        });

        await Promise.all(addOps);

        await Subject.findByIdAndUpdate(subject._id, {
            $addToSet: { 
                students: { $each: studentsToAddTo.map(s => s._id) } 
            }
        });

        res.status(200).json({ 
            message: "Subject updated and synced to students successfully."});

    } catch (error) {
        console.error("Error updating subject:", error);
        res.status(500).json({ message: error.message });
    }
};





export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const studentsWithSubject = await Student.find({ "subjects.subjectId": subject._id });

    const removeOps = studentsWithSubject.map(async (student) => {
      student.subjects = student.subjects.filter(
        s => s.subjectId.toString() !== subject._id.toString()
      );

      const lastIndex = student.registrationHistory.length - 1;
      if (lastIndex >= 0) {
        student.registrationHistory[lastIndex].subjects = 
          student.registrationHistory[lastIndex].subjects.filter(
            s => s.subjectId.toString() !== subject._id.toString()
          );
      }

      return student.save();
    });

    await Promise.all(removeOps);

    await Subject.findByIdAndDelete(id);

    res.status(200).json({
      message: "Subject deleted successfully",
      deletedSubject: subject,
      affectedStudents: studentsWithSubject.length
    });

  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: error.message });
  }
};