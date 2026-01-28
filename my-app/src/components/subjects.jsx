import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';




const SubjectManagement = () => {
    const { setTextHeader } = useContext(globalContext);
    const [subjectList, setSubjectList] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStrand, setFilterStrand] = useState(''); // ✅ Added strand filter
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');

    const gradeOptions = [11, 12];
    const semesterOptions = [1, 2];
    const subjectTypeOptions = ['core', 'specialized', 'applied'];
    const trackOptions = ['Academic', 'TVL'];
    
    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // ✅ ADD THIS LINE

    // ✅ All strand options for filter dropdown
    const allStrandOptions = ['STEM', 'ABM', 'HUMSS', 'Home Economics', 'ICT', 'Industrial Arts'];


    const getStrandOptionsForTrack = (track) => {
        const trackToStrand = {
            'Academic': ['STEM', 'ABM', 'HUMSS'],
            'TVL': ['Home Economics', 'ICT', 'Industrial Arts'],
        };
        return trackToStrand[track] || [];
    };

    const location = useLocation();

    const [teachersList, setTeachersList] = useState([]); // ✅ State for teachers
    const [loadingTeachers, setLoadingTeachers] = useState(false);


    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success'); // 'success' or 'error'

    const [modalLoading, setModalLoading] = useState(false); // ✅ ADD THIS




    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);


    // Ilagay mo ito after ng mga state declarations, bago ang functions
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSubjects = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);


    //fetch section state
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);



    const [showImportModal, setShowImportModal] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [excelPreview, setExcelPreview] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [isProcessingExcel, setIsProcessingExcel] = useState(false);

    

    // After existing states (around line 40)
    const [manualRows, setManualRows] = useState([]);





    const navigate = useNavigate();


    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);


    useEffect(() => {
        fetchSubjectsData();
        fetchTeachers();
    }, []);



    useEffect(() => {
        let filtered = subjectList.filter(subject => 
            subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterGrade) {
            filtered = filtered.filter(subject => subject.gradeLevel === parseInt(filterGrade));
        }

        if (filterSemester) {
            filtered = filtered.filter(subject => subject.semester === parseInt(filterSemester));
        }

        // ✅ Added strand filter logic
        if (filterStrand) {
            filtered = filtered.filter(subject => subject.strand === filterStrand);
        }

        setFilteredSubjects(filtered);
        setCurrentPage(1); 
    }, [searchTerm, filterGrade, filterSemester, filterStrand, subjectList]); // ✅ Added filterStrand dependency


    // Ilagay after ng existing useEffect hooks
    useEffect(() => {
        if (selectedSubject?.gradeLevel && selectedSubject?.strand && selectedSubject?.track && selectedSubject?.semester) {
            fetchSections(
                selectedSubject.gradeLevel, 
                selectedSubject.track,
                selectedSubject.strand,
                selectedSubject.semester
            );
        }
    }, [selectedSubject?.gradeLevel, selectedSubject?.strand, selectedSubject?.track, selectedSubject?.semester]);




    // Ilagay mo after ng fetchTeachers function
    const fetchSections = async (gradeLevel, track, strand, semester) => {
        try {
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSubjetSections?gradeLevel=${gradeLevel}&track=${track}&strand=${strand}&semester=${semester}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAvailableSections(data);
            console.log(data);
        } catch (error) {
            console.error("Error fetching sections:", error.message);
            showAlert("Failed to load sections", 'error');
            setAvailableSections([]);
        } finally {
            setLoadingSections(false);
        }
    };






    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getTeachers`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTeachersList(data);
            
        } catch (error) {
            console.error("Error fetching teachers:", error.message);
            showAlert("Failed to load teachers list", 'error');

        } finally {
            setLoadingTeachers(false);
        }
    };


    const fetchSubjectsData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSubjects`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            // ✅ SORT BY CREATED DATE (newest first)
            const sortedData = [...data].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            setSubjectList(sortedData);
            setFilteredSubjects(sortedData);
        } catch (error) {
            showAlert("Failed to load subjects data", 'error');
            console.error("Error fetching subjects:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubject = (subject) => {

        navigate("/admin/subject_details",  { 
            state: { subjectId: subject._id, title: "subjects" }})

        // setSelectedSubject(subject);
        // setModalType('view');
        // setShowModal(true);
    };


    const handleAddSubject = () => {
        setSelectedSubject({
            subjectName: '',
            subjectCode: '',
            gradeLevel: 11,
            strand: '',
            semester: 1,
            subjectType: 'core',
            track: '',
            teacher: '',
            // ✅ SIMPLE SCHEDULE FIELDS
            // scheduleDay: '',
            // scheduleStartTime: '',
            // scheduleEndTime: '',
            // room: ''
            // section: '',

        });
        setModalType('add');
        setShowModal(true);
    };



    const handleEditSubject = (subject) => {
        setSelectedSubject({...subject});
        setModalType('edit');
        setShowModal(true);
    };

    const handleDeleteSubject = (subject) => {
        setSelectedSubject(subject);
        setModalType('delete');
        setShowModal(true);
    };



        // Add this helper function sa component mo
    const formatTime12Hour = (time24) => {
        if (!time24) return 'N/A';
        
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert 0 to 12
        
        return `${hour12}:${minutes} ${ampm}`;
    };


    const handleSubmitSubject = async () => {

        if (
            !selectedSubject.subjectName.trim() ||
            !selectedSubject.subjectCode.trim() ||
            !selectedSubject.gradeLevel ||
            !selectedSubject.strand.trim() ||
            !selectedSubject.semester ||
            !selectedSubject.subjectType.trim() ||
            !selectedSubject.track.trim() ||
            !selectedSubject.teacher.trim()
        ) {
            showAlert("Input Field Required!", 'error');
            return;
        }

        try {
            setModalLoading(true); // ✅ START LOADING
            
            const url = modalType === 'add' 
                ? `${import.meta.env.VITE_API_URL}/api/addSubjects`
                : `${import.meta.env.VITE_API_URL}/api/updateSubjects/${selectedSubject._id}`;
            
            const method = modalType === 'add' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectName: selectedSubject.subjectName,
                    subjectCode: selectedSubject.subjectCode,
                    gradeLevel: parseInt(selectedSubject.gradeLevel),
                    semester: parseInt(selectedSubject.semester),
                    subjectType: selectedSubject.subjectType,
                    track: selectedSubject.track,
                    strand: selectedSubject.strand,
                    teacherId: selectedSubject.teacherId,
                    teacherName: selectedSubject.teacher,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(data.message, 'success');
            setShowModal(false);
            fetchSubjectsData();
        } catch (error) {
            console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} subject:`, error.message);
            showAlert(`Failed to ${modalType === 'add' ? 'add' : 'update'} subject: ${error.message}`, 'error');
        } finally {
            setModalLoading(false); // ✅ STOP LOADING
        }
    };





    const confirmDelete = async () => {
        try {
            setModalLoading(true); // ✅ START LOADING
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteSubject/${selectedSubject._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert("Subject deleted successfully!", 'success');
            setShowModal(false);
            fetchSubjectsData();
        } catch (error) {
            console.error("Error deleting subject:", error.message);
            showAlert("Failed to delete subject", 'error');
        } finally {
            setModalLoading(false); // ✅ STOP LOADING
        }
    };
    






    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };




    const getSubjectTypeBadge = (type) => {
        const badges = {
            core: 'bg-primary',
            specialized: 'bg-success',
            applied: 'bg-info'
        };
        return badges[type] || 'bg-secondary';
    };




        // Ilagay mo ito bago ang return statement
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        pages.push(
            <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <i className="fa fa-chevron-left"></i>
                </button>
            </li>
        );

        if (startPage > 1) {
            pages.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => handlePageChange(1)}>
                        1
                    </button>
                </li>
            );
            if (startPage > 2) {
                pages.push(
                    <li key="ellipsis1" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>
                        {i}
                    </button>
                </li>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <li key="ellipsis2" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
            pages.push(
                <li key={totalPages} className="page-item">
                    <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                    </button>
                </li>
            );
        }

        pages.push(
            <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <i className="fa fa-chevron-right"></i>
                </button>
            </li>
        );

        return pages;
    };

        
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if Excel file
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            showAlert('Please upload a valid Excel file (.xlsx or .xls)', 'error');
            return;
        }
        
        setExcelFile(file);
        processExcelFile(file);
    };



    const processExcelFile = async (file) => {
        try {
            setIsProcessingExcel(true);
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const validatedData = [];
            const errors = [];
            
            jsonData.forEach((row, index) => {
                const rowNum = index + 2;
                const rowErrors = [];
                


                // ✅ NORMALIZE KEYS - handle spaces and case variations
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
                    const keyMap = {
                        'subjectcode': 'subjectCode',
                        'subjectname': 'subjectName',
                        'gradelevel': 'gradeLevel',
                        'grade': 'gradeLevel',
                        'semester': 'semester',
                        'semeseter': 'semester',
                        'track': 'track',
                        'strand': 'strand',
                        'subjecttype': 'subjectType',
                        'type': 'subjectType',
                        'teachername': 'teacherName',
                        'teacher': 'teacherName'
                    };
                    const mappedKey = keyMap[normalizedKey] || key;
                    normalizedRow[mappedKey] = row[key];
                });
                
                // ✅ Parse Grade Level (handle "Grade 11" or just "11")
                let gradeLevel = normalizedRow.gradeLevel;
                if (typeof gradeLevel === 'string') {
                    gradeLevel = parseInt(gradeLevel.replace(/\D/g, ''));
                }
                normalizedRow.gradeLevel = gradeLevel;
                


                // ✅ Parse Semester (handle "First", "1st", "1" -> 1)
                let semester = normalizedRow.semester;
                if (typeof semester === 'string') {
                    const semesterLower = semester.toLowerCase().trim();
                    if (semesterLower === 'first' || semesterLower === '1st') {
                        semester = 1;
                    } else if (semesterLower === 'second' || semesterLower === '2nd') {
                        semester = 2;
                    } else {
                        semester = parseInt(semester);
                    }
                } else {
                    semester = parseInt(semester);
                }
                normalizedRow.semester = semester;


                // ✅ Normalize Track (capitalize first letter)
                if (normalizedRow.track) {
                    const track = normalizedRow.track.toString().trim();
                    normalizedRow.track = track.charAt(0).toUpperCase() + track.slice(1).toLowerCase();
                }

                // ✅ Normalize Strand (uppercase)
                if (normalizedRow.strand) {
                    normalizedRow.strand = normalizedRow.strand.toString().trim().toUpperCase();
                }

                
                // Required field validation
                if (!normalizedRow.subjectCode?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Subject Code is required`);
                }
                if (!normalizedRow.subjectName?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Subject Name is required`);
                }
                if (!normalizedRow.gradeLevel) {
                    rowErrors.push(`Row ${rowNum}: Grade Level is required`);
                }
                if (!normalizedRow.semester) {
                    rowErrors.push(`Row ${rowNum}: Semester is required`);
                }
                if (!normalizedRow.track?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Track is required`);
                }
                if (!normalizedRow.strand?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Strand is required`);
                }
                if (!normalizedRow.subjectType?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Subject Type is required`);
                }
                if (!normalizedRow.teacherName?.toString().trim()) {
                    rowErrors.push(`Row ${rowNum}: Teacher Name is required`);
                }
                
                // Value validation
                if (normalizedRow.gradeLevel && ![11, 12].includes(parseInt(normalizedRow.gradeLevel))) {
                    rowErrors.push(`Row ${rowNum}: Grade Level must be 11 or 12`);
                }
                if (normalizedRow.semester && ![1, 2].includes(parseInt(normalizedRow.semester))) {
                    rowErrors.push(`Row ${rowNum}: Semester must be 1 or 2`);
                }
                if (normalizedRow.track && !trackOptions.includes(normalizedRow.track.toString().trim())) {
                    rowErrors.push(`Row ${rowNum}: Invalid Track (must be Academic or TVL)`);
                }
                
                // ✅ Handle "CORE" vs "core"
                const subjectType = normalizedRow.subjectType?.toString().toLowerCase().trim();
                if (subjectType && !subjectTypeOptions.includes(subjectType)) {
                    rowErrors.push(`Row ${rowNum}: Invalid Subject Type (must be core, specialized, or applied)`);
                }
                
                if (rowErrors.length > 0) {
                    errors.push(...rowErrors);
                } else {
                    const teacher = teachersList.find(t => 
                        t.fullName.toLowerCase() === normalizedRow.teacherName.toString().trim().toLowerCase()
                    );
                    
                    if (!teacher) {
                        errors.push(`Row ${rowNum}: Teacher "${normalizedRow.teacherName}" not found`);
                    } else {
                        validatedData.push({
                            subjectCode: normalizedRow.subjectCode.toString().trim().toUpperCase(),
                            subjectName: normalizedRow.subjectName.toString().trim().replace(/\b\w/g, char => char.toUpperCase()),
                            gradeLevel: parseInt(normalizedRow.gradeLevel),
                            semester: parseInt(normalizedRow.semester),
                            track: normalizedRow.track.toString().trim().charAt(0).toUpperCase() + normalizedRow.track.toString().trim().slice(1).toLowerCase(),
                            strand: normalizedRow.strand.toString().trim().toUpperCase(),
                            subjectType: subjectType,
                            teacherId: teacher._id,
                            teacherName: teacher.fullName
                        });
                    }
                }
            });
            
            setExcelData(validatedData);
            setExcelPreview(validatedData.slice(0, 10));
            setImportErrors(errors);
            
        } catch (error) {
            console.error('Error processing Excel:', error);
            showAlert('Error processing Excel file: ' + error.message, 'error');
        } finally {
            setIsProcessingExcel(false);
        }
    };






    const handleBulkImport = async () => {


        // ✅ VALIDATE MANUAL ROWS
        const validManualRows = [];
        const errors = [];
        
        manualRows.forEach((row, idx) => {
            // Skip completely empty rows
            if (!row.subjectCode && !row.subjectName) return;
            
            const rowNum = `Manual Row ${idx + 1}`;
            
            // Validate required fields
            if (!row.subjectCode.trim()) errors.push(`${rowNum}: Subject Code required`);
            if (!row.subjectName.trim()) errors.push(`${rowNum}: Subject Name required`);
            if (!row.track) errors.push(`${rowNum}: Track required`);
            if (!row.strand) errors.push(`${rowNum}: Strand required`);
            if (!row.teacherId) errors.push(`${rowNum}: Teacher required`);
            
            if (errors.length === 0) {
                validManualRows.push({
                    subjectCode: row.subjectCode.trim().toUpperCase(),
                    subjectName: row.subjectName.trim(),
                    gradeLevel: row.gradeLevel,
                    semester: row.semester,
                    track: row.track,
                    strand: row.strand,
                    subjectType: row.subjectType,
                    teacherId: row.teacherId,
                    teacherName: row.teacherName
                });
            }
        });
        


        if (errors.length > 0) {
            showAlert(errors.join('\n'), 'error');
            return;
        }
        
        // ✅ COMBINE EXCEL + MANUAL
        const allSubjects = [...excelData, ...validManualRows];
        
        if (allSubjects.length === 0) {
            showAlert('No data to import', 'error');
            return;
        }


        try {
            setIsProcessingExcel(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bulkAddSubjects`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjects: allSubjects }),
                credentials: "include",
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(`Successfully imported ${data.imported} subject(s)!`, 'success');
            setShowImportModal(false);
            resetImportState();
            fetchSubjectsData();
            
        } catch (error) {
            console.error('Bulk import error:', error);
            showAlert('Failed to import: ' + error.message, 'error');
        } finally {
            setIsProcessingExcel(false);
        }
    };


    const resetImportState = () => {
        setExcelFile(null);
        setExcelData([]);
        setExcelPreview([]);
        setImportErrors([]);
        setManualRows([]); // ✅ ADD THIS
    };


    const createEmptyRow = () => ({
        id: `manual-${Date.now()}-${Math.random()}`, // unique ID
        subjectCode: '',
        subjectName: '',
        gradeLevel: 11,
        semester: 1,
        track: '',
        strand: '',
        subjectType: 'core',
        teacherName: '',
        teacherId: ''
    });

    const handleAddManualRow = () => {
        setManualRows([...manualRows, createEmptyRow()]);
    };


    const updateManualRow = (id, field, value) => {
        setManualRows(manualRows.map(row => 
            row.id === id 
                ? { ...row, [field]: value } 
                : row
        ));
        console.log('Updated row:', id, field, value); // ✅ ADD THIS
    };





    const handleDeleteManualRow = (id) => {
        setManualRows(manualRows.filter(row => row.id !== id));
    };

    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5">
                <div className="row mb-4">
                    <div className="col-12">
                        <h4 className="text-capitalize fw-bold mb-1">subject management</h4>
                        <p className="text-muted small mb-0">Manage academic subjects by grade level</p>
                    </div>
                    <div className="col-12 mt-2 d-flex justify-content-md-end gap-2">
                
                        <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setShowImportModal(true)}
                        >
                            <i className="fa fa-file-excel me-2"></i>
                            Import Excel
                        </button>
                        <button 
                            className="btn btn-danger btn-sm"
                            onClick={handleAddSubject}
                        >
                            <i className="fa fa-plus me-2"></i>
                            Add Subject
                        </button>

                            {/* ✅ ADD REFRESH BUTTON HERE */}
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={fetchSubjectsData}
                            disabled={loading}
                            title="Refresh subjects data"
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="fa fa-refresh"></i>
                            )}
                        </button>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12 col-md-3">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-6 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                        >
                            <option value="">All Grades</option>
                            {gradeOptions.map(grade => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-6 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="">All Semesters</option>
                            {semesterOptions.map(sem => (
                                <option key={sem} value={sem}>{sem === 1 ? "First" : "Second"}</option>
                            ))}
                        </select>
                    </div>
                    {/* ✅ Added Strand Filter Dropdown */}
                    <div className="col-6 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterStrand}
                            onChange={(e) => setFilterStrand(e.target.value)}
                        >
                            <option value="">All Strands</option>
                            {allStrandOptions.map(strand => (
                                <option key={strand} value={strand}>{strand}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-3 mt-2 mt-md-0 text-end">
                        <p className="text-muted mb-0 mt-2">
                            Total: <strong>{filteredSubjects.length}</strong>
                        </p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2">Loading subjects data...</p>
                                    </div>
                                ) : filteredSubjects.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fa fa-book fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No subjects found</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="text-capitalize fw-semibold">#</th>
                                                    <th className="text-capitalize fw-semibold">Subject Code</th>
                                                    <th className="text-capitalize fw-semibold">Subject Name</th>
                                                    <th className="text-capitalize fw-semibold">Grade</th>
                                                    <th className="text-capitalize fw-semibold">Track</th>
                                                    <th className="text-capitalize fw-semibold">Strand</th>
                                                    {/* <th className="text-capitalize fw-semibold">Section</th> */}
                                                    <th className="text-capitalize fw-semibold">Semester</th>
                                                    <th className="text-capitalize fw-semibold">Type</th>
                                                    <th className="text-capitalize fw-semibold text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentSubjects.map((subject, index) => (
                                                    <tr key={subject._id}>
                                                        <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                        <td className="align-middle">
                                                            <span className="badge bg-secondary font-monospace">
                                                                {subject.subjectCode}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle fw-semibold text-capitalize">
                                                            {subject.subjectName}
                                                        </td>
                                                        <td className="align-middle">
                                                            Grade {subject.gradeLevel}
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className="badge bg-warning text-dark">
                                                                {subject.track || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className="badge bg-danger">
                                                                {subject.strand || 'N/A'}
                                                            </span>
                                                        </td>
                                                        {/* <td className="align-middle">
                                                            <span className="badge bg-success">
                                                                {subject.section || 'N/A'}
                                                            </span>
                                                        </td> */}
                                                        <td className="align-middle small">
                                                            {subject.semester === 1 ? "First" : "Second"}
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className={`badge ${getSubjectTypeBadge(subject.subjectType)} text-capitalize`}>
                                                                {subject.subjectType}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle">
                                                            <div className="d-flex gap-2 justify-content-center">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => handleViewSubject(subject)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="fa fa-eye"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-warning"
                                                                    onClick={() => handleEditSubject(subject)}
                                                                    title="Edit"
                                                                >
                                                                    <i className="fa fa-edit"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteSubject(subject)}
                                                                    title="Delete"
                                                                >
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     
                                    </div>
                                    {totalPages > 0 && (
                                        <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                            <div className="text-muted small">
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubjects.length)} of {filteredSubjects.length} entries
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {renderPagination()}
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                    </>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className={`modal-dialog modal-dialog-centered 
                        ${modalType !== "delete" && "modal-lg" }
                        `}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'view' && 'Subject Details'}
                                    {modalType === 'add' && 'Add New Subject'}
                                    {modalType === 'edit' && 'Edit Subject'}
                                    {modalType === 'delete' && 'Delete Subject'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            {modalType === 'view' && (
                                <div className="modal-body">
                                    {/* Subject Identity */}
                                    <div className="card border-0 bg-light mb-3">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-muted small text-uppercase mb-1">
                                                        <i className="fa fa-barcode me-1"></i>Subject Code
                                                    </label>
                                                    <p className="fw-bold font-monospace fs-5 mb-0">
                                                        {selectedSubject?.subjectCode}
                                                    </p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-muted small text-uppercase mb-1">
                                                        <i className="fa fa-book me-1"></i>Subject Name
                                                    </label>
                                                    <p className="fw-bold text-capitalize fs-5 mb-0">
                                                        {selectedSubject?.subjectName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Details */}
                                    <div className="mb-3">
                                        <h6 className="text-uppercase text-muted mb-3">
                                            <i className="fa fa-graduation-cap me-2"></i>Academic Information
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-3">
                                                <label className="text-muted small">Grade Level</label>
                                                <p className="fw-semibold mb-0">Grade {selectedSubject?.gradeLevel}</p>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="text-muted small">Semester</label>
                                                <p className="fw-semibold mb-0">
                                                    {selectedSubject?.semester === 1 ? '1st' : '2nd'} Semester
                                                </p>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="text-muted small">Track</label>
                                                <p className="fw-semibold mb-0">{selectedSubject?.track || 'N/A'}</p>
                                            </div>
                                            <div className="col-md-3 d-flex flex-column">
                                                <label className="text-muted small">Strand</label>
                                                <p className="m-0 w-50 badge bg-danger small mt-1">
                                                    {selectedSubject?.strand || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-3" />

                                    {/* Section & Class Details */}
                                    <div className="mb-3">
                                        <h6 className="text-uppercase text-muted mb-3">
                                            <i className="fa fa-users me-2"></i>Class Information
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-4 d-flex flex-column ">
                                                <label className="text-muted small">Section</label>
                                                <p className="fw-bold badge bg-success w-50 mt-1">
                                                    {selectedSubject?.section || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="col-md-4 d-flex flex-column ">
                                                <label className="text-muted small">Subject Type</label>
                                                <span className={`badge w-50 mt-1 ${
                                                    selectedSubject?.subjectType === 'core' ? 'bg-primary' :
                                                    selectedSubject?.subjectType === 'specialized' ? 'bg-success' : 'bg-info'
                                                } text-capitalize `}>
                                                    {selectedSubject?.subjectType}
                                                </span>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="text-muted small">Teacher</label>
                                                <p className="fw-semibold mb-0 text-capitalize">
                                                    <i className="fa fa-chalkboard-teacher me-1 text-muted"></i>
                                                    {selectedSubject?.teacher || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-3" />

                                    {/* Schedule & Location */}
                                    <div className="mb-3">
                                        <h6 className="text-uppercase text-muted mb-3">
                                            <i className="fa fa-clock me-2"></i>Schedule & Location
                                        </h6>
                                        <div className="card border">
                                            <div className="card-body">
                                                <div className="row g-3">
                                                    <div className="col-md-3">
                                                        <label className="text-muted small">Day</label>
                                                        <p className="fw-bold mb-0">
                                                            <i className="fa fa-calendar-day me-1 text-primary"></i>
                                                            {selectedSubject?.scheduleDay || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="text-muted small">Start Time</label>
                                                        <p className="fw-semibold mb-0">
                                                            <i className="fa fa-clock me-1 text-success"></i>
                                                            {formatTime12Hour(selectedSubject?.scheduleStartTime)}
                                                        </p>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="text-muted small">End Time</label>
                                                        <p className="fw-semibold mb-0">
                                                            <i className="fa fa-clock me-1 text-danger"></i>
                                                            {formatTime12Hour(selectedSubject?.scheduleEndTime)}
                                                        </p>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="text-muted small">Room</label>
                                                        <p className="fw-semibold mb-0 text-capitalize">
                                                            <i className="fa fa-door-open me-1 text-warning"></i>
                                                            {selectedSubject?.room || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-3" />

                                    {/* Footer Info */}
                                    <div className="text-muted small">
                                        <i className="fa fa-info-circle me-1"></i>
                                        Created on {formatDate(selectedSubject?.createdAt)}
                                    </div>
                                </div>
                            )}

                            {(modalType === 'add' || modalType === 'edit') && (
                                <>
                                    <div className="modal-body">
                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Track</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.track || ''}
                                                    onChange={(e) => {
                                                        setSelectedSubject({
                                                            ...selectedSubject, 
                                                            track: e.target.value,
                                                            strand: '',
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select Track</option>
                                                    {trackOptions.map(track => (
                                                        <option key={track} value={track}>{track}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Strand</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.strand || ''}
                                                    onChange={(e) => {
                                                        setSelectedSubject({
                                                            ...selectedSubject, 
                                                            strand: e.target.value,
                                                        });
                                                    }}
                                                    disabled={!selectedSubject?.track || selectedSubject?.track === ''}
                                                >
                                                    <option value="">
                                                        {!selectedSubject?.track ? 'Select Track First' : 'Select Strand'}
                                                    </option>
                                                    {selectedSubject?.track && 
                                                        getStrandOptionsForTrack(selectedSubject.track).map(strand => (
                                                            <option key={strand} value={strand}>{strand}</option>
                                                        ))
                                                    }
                                                </select>
                                                {!selectedSubject?.track && (
                                                    <small className="text-muted d-block mt-1">
                                                        <i className="fa fa-info-circle me-1"></i>
                                                        Select Track first to enable Strand selection
                                                    </small>
                                                )}
                                            </div>

                                        </div>

                                        

                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Subject Code</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control font-monospace"
                                                    value={selectedSubject?.subjectCode || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, subjectCode: e.target.value.toUpperCase()})}
                                                    placeholder="e.g. GENMATH-01"
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Subject Name</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control text-capitalize"
                                                    value={selectedSubject?.subjectName || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, subjectName: e.target.value})}
                                                    placeholder="e.g. General Mathematics"
                                                />
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Subject Type</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.subjectType || 'core'}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, subjectType: e.target.value})}
                                                >
                                                    {subjectTypeOptions.map(type => (
                                                        <option key={type} value={type} className="text-capitalize">{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Teacher</label>
                                                <select 
                                                    className="form-select text-capitalize"
                                                    value={selectedSubject?.teacher || ""}
                                                    onChange={(e) =>{ 

                                                        const selectedTeacher = teachersList.find(t => t.fullName === e.target.value);
                                                        setSelectedSubject({
                                                            ...selectedSubject,
                                                            teacher: e.target.value,  // fullName
                                                            teacherId: selectedTeacher?._id || ""  // ✅ Get ID based on fullName
                                                        });

                                                    }}
                                                    disabled={loadingTeachers}
                                                >
                                                    <option value="">
                                                        {loadingTeachers ? 'Loading teachers...' : 'Select Teacher'}
                                                    </option>
                                                    {teachersList.map(teacher => (
                                                        <option key={teacher._id} value={teacher.fullName}>
                                                            {teacher.fullName}
                                                        </option>
                                                    ))}
                                                </select>
                                                {teachersList.length === 0 && !loadingTeachers && (
                                                    <small className="text-muted d-block mt-1">
                                                        <i className="fa fa-info-circle me-1"></i>
                                                        No teachers available. Please add staff members first.
                                                    </small>
                                                )}
                                            </div>
                                        </div>


                                        <div className="row mb-3 ">
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Grade Level</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.gradeLevel || 11}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, gradeLevel: parseInt(e.target.value)})}
                                                >
                                                    {gradeOptions.map(grade => (
                                                        <option key={grade} value={grade}>Grade {grade}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">Semester</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.semester || 1}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, semester: parseInt(e.target.value)})}
                                                >
                                                    {semesterOptions.map(sem => (
                                                        <option key={sem} value={sem}>{sem === 1 ? "First" : "Second"}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleSubmitSubject}
                                            disabled={modalLoading}
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    {modalType === 'add' ? 'Adding...' : 'Updating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                                                    {modalType === 'add' ? 'Add Subject' : 'Update Subject'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {modalType === 'delete' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <p className="text-muted">
                                            Do you really want to delete <strong>{selectedSubject?.subjectName}</strong> ({selectedSubject?.subjectCode})?
                                            <br/>This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={confirmDelete}
                                            disabled={modalLoading}
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-trash me-2"></i>
                                                    Yes, Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}





            {/* Alert Modal - Success/Error Messages */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999999999}}>
                    <div className="modal-dialog modal-dialog-centered ">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
                                <p className="text-muted mb-4">{alertMessage}</p>
                                <button 
                                    type="button" 
                                    className={`btn ${alertType === 'success' ? 'btn-success' : 'btn-danger'} px-4`}
                                    onClick={() => setShowAlertModal(false)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fa fa-file-excel me-2 text-success"></i>
                                    Import Subjects from Excel
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        resetImportState();
                                    }}
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* File Upload Section */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">
                                        <i className="fa fa-upload me-2"></i>Select Excel File
                                    </label>
                                    <input 
                                        type="file"
                                        className="form-control"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                    />
                                    <small className="text-muted d-block mt-2">
                                        <i className="fa fa-info-circle me-1"></i>
                                        Required columns: Subject Code, Subject Name, Grade Level, Semester, Track, Strand, Subject Type, Teacher Name
                                    </small>
                                </div>
                                
                                {/* Errors Display */}
                                {importErrors.length > 0 && (
                                    <div className="alert alert-danger">
                                        <h6 className="alert-heading">
                                            <i className="fa fa-exclamation-triangle me-2"></i>
                                            Validation Errors ({importErrors.length})
                                        </h6>
                                        <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                            {importErrors.map((error, idx) => (
                                                <small key={idx} className="d-block">{error}</small>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Preview Table */}
                                {excelPreview.length > 0 && (
                                    <>
                                        <div className="alert alert-success">
                                            <i className="fa fa-check-circle me-2"></i>
                                            Found {excelData.length} valid subject(s) ready to import
                                        </div>
                                        
                                        <label className="form-label fw-bold">Preview (First 10 records)</label>
                                        <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                            <table className="table table-sm table-bordered">
                                                <thead className="bg-light sticky-top">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Code</th>
                                                        <th>Subject Name</th>
                                                        <th>Grade</th>
                                                        <th>Sem</th>
                                                        <th>Track</th>
                                                        <th>Strand</th>
                                                        <th>Type</th>
                                                        <th>Teacher</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {excelPreview.map((subject, idx) => (
                                                        <tr key={idx}>
                                                            <td>{idx + 1}</td>
                                                            <td className="font-monospace">{subject.subjectCode}</td>
                                                            <td>{subject.subjectName}</td>
                                                            <td>Grade {subject.gradeLevel}</td>
                                                            <td>{subject.semester}</td>
                                                            <td>{subject.track}</td>
                                                            <td>{subject.strand}</td>
                                                            <td>{subject.subjectType}</td>
                                                            <td>{subject.teacherName}</td>
                                                        </tr>
                                                    ))}


                                                    {manualRows.map((row) => (
                                                        <tr key={row.id} className="table-warning">
                                                            <td>
                                                                <span className="badge bg-success">NEW</span>
                                                            </td>
                                                            
                                                            {/* Subject Code */}
                                                            <td>
                                                                <input 
                                                                    type="text"
                                                                    className="form-control form-control-sm text-monospace"
                                                                    value={row.subjectCode}
                                                                    
                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, subjectCode: e.target.value.toUpperCase() }
                                                                                : r
                                                                        ));
                                                                    }}
                                                                    placeholder="CODE"
                                                                />
                                                            </td>
                                                            
                                                            {/* Subject Name */}
                                                            <td>
                                                                <input 
                                                                    type="text"
                                                                    className="form-control form-control-sm text-capitalize"
                                                                    value={row.subjectName}
                                                                    
                                                                     
                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, subjectName: e.target.value }
                                                                                : r
                                                                        ));
                                                                    }}
                                                                    
                                                                    placeholder="Subject Name"
                                                                />
                                                            </td>
                                                            
                                                            {/* Grade Level */}
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.gradeLevel}
                                                                    
                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, gradeLevel: e.target.value }
                                                                                : r
                                                                        ));
                                                                    }}
                                                                
                                                                
                                                                >
                                                                    <option value="11">Grade 11</option>
                                                                    <option value="12">Grade 12</option>
                                                                </select>
                                                            </td>
                                                            
                                                            {/* Semester */}
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.semester}
                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, semester: e.target.value }
                                                                                : r
                                                                        ));
                                                                    }}
                                                                
                                                                >
                                                                    <option value="1">First</option>
                                                                    <option value="2">Second</option>
                                                                </select>
                                                            </td>
                                                            
                                                            {/* Track */}
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.track}
                                                                    onChange={(e) => {
                                                                        const newTrack = e.target.value;
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, track: newTrack, strand: '' }
                                                                                : r
                                                                        ));  // ✅ Use prevRows instead of manualRows
                                                                    }}
                                                                >
                                                                    <option value="">Select</option>
                                                                    {trackOptions.map(t => (
                                                                        <option key={t} value={t}>{t}</option>
                                                                    ))}
                                                                </select>   
                                                            </td>


                                                            {/* Strand */}
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.strand}
                                                                    
                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, strand: e.target.value }
                                                                                : r
                                                                        ));
                                                                    }}


                                                                    disabled={!row.track}
                                                                >
                                                                    <option value="">Select</option>
                                                                    {row.track && getStrandOptionsForTrack(row.track).map(s => (
                                                                        <option key={s} value={s}>{s}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            
                                                            {/* Subject Type */}
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.subjectType}

                                                                    onChange={(e) => {
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { ...r, subjectType: e.target.value }
                                                                                : r
                                                                        ));
                                                                    }}


                                                                >
                                                                    <option value="core">Core</option>
                                                                    <option value="specialized">Specialized</option>
                                                                    <option value="applied">Applied</option>
                                                                </select>
                                                            </td>
                                                            
                                                            {/* Teacher */}
                                                            <td>
                                                               <select 
                                                                    className="form-select form-select-sm"
                                                                    value={row.teacherName}
                                                                    onChange={(e) => {
                                                                        const selectedTeacherName = e.target.value;
                                                                        const teacher = teachersList.find(t => t.fullName === selectedTeacherName);
                                                                        
                                                                        setManualRows(prevRows => prevRows.map(r => 
                                                                            r.id === row.id 
                                                                                ? { 
                                                                                    ...r, 
                                                                                    teacherName: selectedTeacherName,
                                                                                    teacherId: teacher?._id || '' 
                                                                                }
                                                                                : r
                                                                        ));  // ✅ Use prevRows
                                                                    }}
                                                                >
                                                                    <option value="">Select</option>
                                                                    {teachersList.map(t => (
                                                                        <option key={t._id} value={t.fullName}>{t.fullName}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            
                                                            {/* ✅ DELETE BUTTON (optional) */}
                                                            <td>
                                                                <button 
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteManualRow(row.id)}
                                                                    title="Remove row"
                                                                >
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* ✅ ADD ROW BUTTON */}
                                            <div className="p-3 border-top">
                                                <button 
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={handleAddManualRow}
                                                >
                                                    <i className="fa fa-plus me-1"></i>
                                                    Add Row Manually
                                                </button>
                                                {manualRows.length > 0 && (
                                                    <small className="text-muted ms-3">
                                                        {manualRows.length} manual row(s) added
                                                    </small>
                                                )}
                                            </div>


                                        </div>
                                        {excelData.length > 10 && (
                                            <small className="text-muted d-block mt-2">
                                                ...and {excelData.length - 10} more
                                            </small>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        resetImportState();
                                    }}
                                >
                                    Cancel
                                </button>
                               <button 
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleBulkImport}
                                    disabled={excelData.length === 0 && manualRows.length === 0 || isProcessingExcel}
                                >
                                    {isProcessingExcel ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-upload me-2"></i>
                                            Import {excelData.length + manualRows.length} Subject(s)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubjectManagement;