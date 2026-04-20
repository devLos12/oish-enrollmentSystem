import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import usePrograms from "./hooks/useProgram";









const SubjectManagement = () => {
    const { setTextHeader } = useContext(globalContext);
    const [subjectList, setSubjectList] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStrand, setFilterStrand] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');

    const gradeOptions = [11, 12];
    const semesterOptions = [1, 2];
    const subjectTypeOptions = ['core', 'specialized', 'applied'];
    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   
    
    const { trackOptions, getStrandOptions, allStrands } = usePrograms();

    

    const location = useLocation();
    const [teachersList, setTeachersList] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [modalLoading, setModalLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSubjects = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);

    // ✅ Redesigned import state — matches SubjectDetails flow
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState('upload'); // 'upload' | 'preview'
    const [excelFile, setExcelFile] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [isProcessingExcel, setIsProcessingExcel] = useState(false);
    const [editingRows, setEditingRows] = useState({});

    const [manualRows, setManualRows] = useState([]);

    const navigate = useNavigate();



    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        fetchSubjectsData();
        fetchTeachers();
    }, []);


    useEffect(() => {
        let filtered = subjectList.filter(subject =>
            subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (subject.teacher || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterGrade) filtered = filtered.filter(subject => subject.gradeLevel === parseInt(filterGrade));
        if (filterSemester) filtered = filtered.filter(subject => subject.semester === parseInt(filterSemester));
        if (filterStrand) filtered = filtered.filter(subject => subject.strand === filterStrand);
        setFilteredSubjects(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterGrade, filterSemester, filterStrand, subjectList]);



    useEffect(() => {
        if (selectedSubject?.gradeLevel && selectedSubject?.strand && selectedSubject?.track && selectedSubject?.semester) {
            fetchSections(selectedSubject.gradeLevel, selectedSubject.track, selectedSubject.strand, selectedSubject.semester);
        }
    }, [selectedSubject?.gradeLevel, selectedSubject?.strand, selectedSubject?.track, selectedSubject?.semester]);






    const fetchSections = async (gradeLevel, track, strand, semester) => {
        try {
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSubjetSections?gradeLevel=${gradeLevel}&track=${track}&strand=${strand}&semester=${semester}`,
                { method: "GET", credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAvailableSections(data);
        } catch (error) {
            showAlert("Failed to load sections", 'error');
            setAvailableSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getTeachers`, { method: "GET", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTeachersList(data);
        } catch (error) {
            showAlert("Failed to load teachers list", 'error');
        } finally {
            setLoadingTeachers(false);
        }
    };

    const fetchSubjectsData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSubjects`, { method: "GET", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setSubjectList(sortedData);
            setFilteredSubjects(sortedData);
        } catch (error) {
            showAlert("Failed to load subjects data", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubject = (subject) => {
        navigate("/admin/subject_details", { state: { subjectId: subject._id, title: "subjects" } });
    };

    const handleAddSubject = () => {
        setSelectedSubject({
            subjectName: '',
            subjectCode: '',
            gradeLevel: 11,
            strand: '',
            subjectType: 'core',
            track: '',
            teacher: '',
        });
        setModalType('add');
        setShowModal(true);
    };

    const handleEditSubject = (subject) => {
        setSelectedSubject({ ...subject });
        setModalType('edit');
        setShowModal(true);
    };

    const handleDeleteSubject = (subject) => {
        setSelectedSubject(subject);
        setModalType('delete');
        setShowModal(true);
    };

    const formatTime12Hour = (time24) => {
        if (!time24) return 'N/A';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const handleSubmitSubject = async () => {
        if (
            !selectedSubject.subjectName.trim() ||
            !selectedSubject.subjectCode.trim() ||
            !selectedSubject.gradeLevel ||
            !selectedSubject.strand.trim() ||
            !selectedSubject.subjectType.trim() ||
            !selectedSubject.track.trim() ||
            !selectedSubject.teacher.trim()
        ) {
            showAlert("Input Field Required!", 'error');
            return;
        }

        try {
            setModalLoading(true);
            const url = modalType === 'add'
                ? `${import.meta.env.VITE_API_URL}/api/addSubjects`
                : `${import.meta.env.VITE_API_URL}/api/updateSubjects/${selectedSubject._id}`;
            const method = modalType === 'add' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectName: selectedSubject.subjectName,
                    subjectCode: selectedSubject.subjectCode,
                    gradeLevel: parseInt(selectedSubject.gradeLevel),
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
            showAlert(`Failed to ${modalType === 'add' ? 'add' : 'update'} subject: ${error.message}`, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            setModalLoading(true);
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
            showAlert("Failed to delete subject", 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    const getSubjectTypeBadge = (type) => {
        const badges = { core: 'bg-primary', specialized: 'bg-success', applied: 'bg-info' };
        return badges[type] || 'bg-secondary';
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

        pages.push(
            <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <i className="fa fa-chevron-left"></i>
                </button>
            </li>
        );
        if (startPage > 1) {
            pages.push(<li key={1} className="page-item"><button className="page-link" onClick={() => handlePageChange(1)}>1</button></li>);
            if (startPage > 2) pages.push(<li key="e1" className="page-item disabled"><span className="page-link">...</span></li>);
        }
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
                </li>
            );
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<li key="e2" className="page-item disabled"><span className="page-link">...</span></li>);
            pages.push(<li key={totalPages} className="page-item"><button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button></li>);
        }
        pages.push(
            <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    <i className="fa fa-chevron-right"></i>
                </button>
            </li>
        );
        return pages;
    };

    // ============================================================
    // ✅ EXCEL IMPORT — Matches SubjectDetails style
    // ============================================================

    const downloadTemplate = () => {
        const templateData = [
            ['Subject Code', 'Subject Name', 'Grade Level', 'Track', 'Strand', 'Subject Type', 'Teacher Name'],
            ['GENMATH-01', 'General Mathematics', '11', 'Academic', 'STEM', 'core', 'Juan Dela Cruz'],
            ['ENGLISH-01', 'Oral Communication', '11', 'Academic', 'HUMSS', 'specialized', 'Maria Santos'],
            ['ICT-01', 'Computer Systems Servicing', '12', 'TVL', 'ICT', 'applied', 'Pedro Reyes'],
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);

        ws['!cols'] = [
            { wch: 18 }, { wch: 30 }, { wch: 14 },
            { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 25 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Subjects Template');
        XLSX.writeFile(wb, `subjects_import_template.xlsx`);
    };

    const processExcelFile = async (file) => {
        try {
            setIsProcessingExcel(true);
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const errors = [];
            const parsed = jsonData.map((row, index) => {
                const rowNum = index + 2;

                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
                    const keyMap = {
                        'subjectcode': 'subjectCode',
                        'subjectname': 'subjectName',
                        'gradelevel': 'gradeLevel',
                        'grade': 'gradeLevel',
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

                let gradeLevel = normalizedRow.gradeLevel;
                if (typeof gradeLevel === 'string') gradeLevel = parseInt(gradeLevel.replace(/\D/g, ''));
                normalizedRow.gradeLevel = gradeLevel;

                if (normalizedRow.track) {
                    const track = normalizedRow.track.toString().trim();
                    normalizedRow.track = track.charAt(0).toUpperCase() + track.slice(1).toLowerCase();
                }

                if (normalizedRow.strand) {
                    normalizedRow.strand = normalizedRow.strand.toString().trim().toUpperCase();
                }

                const rowErrors = [];
                if (!normalizedRow.subjectCode?.toString().trim()) rowErrors.push('Subject Code is required');
                if (!normalizedRow.subjectName?.toString().trim()) rowErrors.push('Subject Name is required');
                if (!normalizedRow.gradeLevel) rowErrors.push('Grade Level is required');
                if (!normalizedRow.track?.toString().trim()) rowErrors.push('Track is required');
                if (!normalizedRow.strand?.toString().trim()) rowErrors.push('Strand is required');
                if (!normalizedRow.subjectType?.toString().trim()) rowErrors.push('Subject Type is required');
                if (!normalizedRow.teacherName?.toString().trim()) rowErrors.push('Teacher Name is required');

                if (normalizedRow.gradeLevel && ![11, 12].includes(parseInt(normalizedRow.gradeLevel)))
                    rowErrors.push('Grade Level must be 11 or 12');

                if (normalizedRow.track && !trackOptions.includes(normalizedRow.track.toString().trim()))
                    rowErrors.push(`Invalid Track (must be: ${validTracks.join(', ')})`);

                const subjectType = normalizedRow.subjectType?.toString().toLowerCase().trim();
                if (subjectType && !subjectTypeOptions.includes(subjectType))
                    rowErrors.push('Invalid Subject Type (must be core, specialized, or applied)');

                // Teacher matching
                const teacher = normalizedRow.teacherName
                    ? teachersList.find(t =>
                        t.fullName.toLowerCase() === normalizedRow.teacherName.toString().trim().toLowerCase()
                    )
                    : null;

                if (!rowErrors.length && normalizedRow.teacherName && !teacher) {
                    rowErrors.push(`Teacher "${normalizedRow.teacherName}" not found`);
                }

                if (rowErrors.length > 0) {
                    errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
                }

                return {
                    id: `row-${index}-${Date.now()}`,
                    subjectCode: normalizedRow.subjectCode?.toString().trim().toUpperCase() || '',
                    subjectName: normalizedRow.subjectName?.toString().trim().replace(/\b\w/g, c => c.toUpperCase()) || '',
                    gradeLevel: parseInt(normalizedRow.gradeLevel) || 11,
                    track: normalizedRow.track?.toString().trim() || '',
                    strand: normalizedRow.strand?.toString().trim().toUpperCase() || '',
                    subjectType: subjectType || 'core',
                    teacherName: normalizedRow.teacherName?.toString().trim() || '',
                    teacherId: teacher?._id || '',
                    hasError: rowErrors.length > 0,
                    errorMessages: rowErrors,
                };
            });

            setExcelData(parsed);
            setImportErrors(errors);
            setImportStep('preview');
        } catch (error) {
            showAlert('Error processing Excel file: ' + error.message, 'error');
        } finally {
            setIsProcessingExcel(false);
        }
    };

    const handleFileUpload = (file) => {
        if (!file) return;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            showAlert('Please upload a valid Excel file (.xlsx or .xls)', 'error');
            return;
        }
        setExcelFile(file);
        processExcelFile(file);
    };

    // ✅ Re-validate a row after inline edit
    const updateExcelRow = (index, fields) => {
        setExcelData(prev => {
            const updated = [...prev];
            const updatedRow = { ...updated[index], ...fields };

            const rowErrors = [];
            if (!updatedRow.subjectCode?.trim()) rowErrors.push('Subject Code is required');
            if (!updatedRow.subjectName?.trim()) rowErrors.push('Subject Name is required');
            if (!updatedRow.gradeLevel) rowErrors.push('Grade Level is required');
            if (!updatedRow.track?.trim()) rowErrors.push('Track is required');
            if (!updatedRow.strand?.trim()) rowErrors.push('Strand is required');
            if (!updatedRow.subjectType?.trim()) rowErrors.push('Subject Type is required');
            if (!updatedRow.teacherName?.trim()) rowErrors.push('Teacher is required');
            else {
                const teacher = teachersList.find(t =>
                    t.fullName.toLowerCase() === updatedRow.teacherName.toLowerCase()
                );
                if (!teacher) {
                    rowErrors.push(`Teacher "${updatedRow.teacherName}" not found`);
                } else {
                    updatedRow.teacherId = teacher._id;
                }
            }

            updatedRow.hasError = rowErrors.length > 0;
            updatedRow.errorMessages = rowErrors;
            updated[index] = updatedRow;
            return updated;
        });
    };

    const toggleEditRow = (index) => {
        setEditingRows(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const removeExcelRow = (index) => {
        setExcelData(prev => prev.filter((_, i) => i !== index));
    };

    const resetImportState = () => {
        setExcelFile(null);
        setExcelData([]);
        setImportErrors([]);
        setManualRows([]);
        setEditingRows({});
        setImportStep('upload');
    };

    const handleOpenImportModal = () => {
        resetImportState();
        setShowImportModal(true);
    };

    const handleCloseImportModal = () => {
        setShowImportModal(false);
        resetImportState();
    };

    // ✅ Manual rows
    const createEmptyRow = () => ({
        id: `manual-${Date.now()}-${Math.random()}`,
        subjectCode: '',
        subjectName: '',
        gradeLevel: 11,
        track: '',
        strand: '',
        subjectType: 'core',
        teacherName: '',
        teacherId: '',
        hasError: true,
        errorMessages: ['Fill in all fields'],
        isManual: true,
    });

    const handleAddManualRow = () => {
        setManualRows(prev => [...prev, createEmptyRow()]);
        // Auto-switch to preview if still on upload
        if (importStep === 'upload') setImportStep('preview');
    };

    const updateManualRow = (id, fields) => {
        setManualRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updatedRow = { ...r, ...fields };

            const rowErrors = [];
            if (!updatedRow.subjectCode?.trim()) rowErrors.push('Subject Code required');
            if (!updatedRow.subjectName?.trim()) rowErrors.push('Subject Name required');
            if (!updatedRow.track) rowErrors.push('Track required');
            if (!updatedRow.strand) rowErrors.push('Strand required');
            if (!updatedRow.subjectType) rowErrors.push('Type required');
            if (!updatedRow.teacherName) {
                rowErrors.push('Teacher required');
            } else {
                const teacher = teachersList.find(t => t.fullName === updatedRow.teacherName);
                if (teacher) updatedRow.teacherId = teacher._id;
            }

            updatedRow.hasError = rowErrors.length > 0;
            updatedRow.errorMessages = rowErrors;
            return updatedRow;
        }));
    };

    const handleDeleteManualRow = (id) => setManualRows(prev => prev.filter(r => r.id !== id));

    const handleBulkImport = async () => {
        const allRows = [...excelData, ...manualRows];
        const errorRows = allRows.filter(r => r.hasError);

        if (errorRows.length > 0) {
            showAlert(`Please fix ${errorRows.length} row(s) with errors before importing.`, 'error');
            return;
        }
        if (allRows.length === 0) {
            showAlert('No data to import', 'error');
            return;
        }

        try {
            setIsProcessingExcel(true);
            const subjects = allRows.map(row => ({
                subjectCode: row.subjectCode.trim().toUpperCase(),
                subjectName: row.subjectName.trim(),
                gradeLevel: parseInt(row.gradeLevel),
                track: row.track,
                strand: row.strand,
                subjectType: row.subjectType,
                teacherId: row.teacherId,
                teacherName: row.teacherName,
            }));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bulkAddSubjects`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjects }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(`Successfully imported ${data.imported} subject(s)!`, 'success');
            handleCloseImportModal();
            fetchSubjectsData();
        } catch (error) {
            showAlert('Failed to import: ' + error.message, 'error');
        } finally {
            setIsProcessingExcel(false);
        }
    };

    const allRows = [...excelData, ...manualRows];
    const errorCount = allRows.filter(r => r.hasError).length;
    const validCount = allRows.filter(r => !r.hasError).length;

    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5">
                <div className="row mb-4">
                    <div className="col-12">
                        <h4 className="text-capitalize fw-bold mb-1">subject management</h4>
                        <p className="text-muted small mb-0">Manage academic subjects by grade level</p>
                    </div>
                    <div className="col-12 mt-2 d-flex justify-content-md-end gap-2">
                        <button className="btn btn-outline-danger btn-sm" onClick={handleOpenImportModal}>
                            <i className="fa fa-file-excel me-2"></i>Import Excel
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={handleAddSubject}>
                            <i className="fa fa-plus me-2"></i>Add Subject
                        </button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchSubjectsData} disabled={loading} title="Refresh">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fa fa-refresh"></i>}
                        </button>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12 col-md-12 my-2">
                        <div className="input-group">
                            <span className="input-group-text bg-white"><i className="fa fa-search text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search by name, code or teacher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-6 col-md-4 mt-2 mt-md-0">
                        <select className="form-select" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
                            <option value="">All Grades</option>
                            {gradeOptions.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
                        </select>
                    </div>
                    {/* <div className="col-6 col-md-2 mt-2 mt-md-0">
                        <select className="form-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                            <option value="">All Semesters</option>
                            {semesterOptions.map(sem => <option key={sem} value={sem}>{sem === 1 ? "First" : "Second"}</option>)}
                        </select>
                    </div> */}
                    <div className="col-6 col-md-4 mt-2 mt-md-0">
                        <select className="form-select" value={filterStrand} onChange={(e) => setFilterStrand(e.target.value)}>
                            <option value="">All Strands</option>
                            {allStrands.map(strand => <option key={strand} value={strand}>{strand}</option>)}
                        </select>
                    </div>
                    <div className="col-12 col-md-4 mt-2 mt-md-0 text-end">
                        <p className="text-muted mb-0 mt-2">Total: <strong>{filteredSubjects.length}</strong></p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status"></div>
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
                                                        <th className="fw-semibold">#</th>
                                                        <th className="fw-semibold">Subject Code</th>
                                                        <th className="fw-semibold">Subject Name</th>
                                                        <th className="fw-semibold">Grade</th>
                                                        <th className="fw-semibold">Strand</th>
                                                        <th className="fw-semibold">Semester</th>
                                                        <th className="fw-semibold">Type</th>
                                                        <th className="fw-semibold">Teacher</th>
                                                        <th className="fw-semibold text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentSubjects.map((subject, index) => (
                                                        <tr key={subject._id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle"><span className="badge bg-info text-dark font-monospace ">{subject.subjectCode}</span></td>
                                                            <td className="align-middle fw-semibold text-capitalize">{subject.subjectName}</td>
                                                            <td className="align-middle">Grade {subject.gradeLevel}</td>
                                                            <td className="align-middle">
                                                                <p className="m-0 text-muted fw-semibold ">{subject.strand}</p>
                                                            </td>
                                                            <td className="align-middle small">{subject.semester === 1 ? "First" : "Second"}</td>
                                                            <td className="align-middle"><span className={`badge ${getSubjectTypeBadge(subject.subjectType)} text-capitalize`}>{subject.subjectType}</span></td>
                                                            <td className="align-middle text-capitalize">{subject.teacher || 'N/A'}</td>
                                                            <td className="align-middle">
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewSubject(subject)}>sections</button>
                                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditSubject(subject)}><i className="fa fa-edit"></i></button>
                                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSubject(subject)}><i className="fa fa-trash"></i></button>
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
                                                <nav><ul className="pagination mb-0">{renderPagination()}</ul></nav>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit/Delete Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className={`modal-dialog modal-dialog-centered ${modalType !== "delete" && "modal-lg"}`}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'add' && 'Add New Subject'}
                                    {modalType === 'edit' && 'Edit Subject'}
                                    {modalType === 'delete' && 'Delete Subject'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>

                            {(modalType === 'add' || modalType === 'edit') && (
                                <>
                                    <div className="modal-body">
                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Track</label>
                                                <select className="form-select" value={selectedSubject?.track || ''}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, track: e.target.value, strand: '' })}>
                                                    <option value="">Select Track</option>
                                                    {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Strand</label>
                                                <select className="form-select" value={selectedSubject?.strand || ''}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, strand: e.target.value })}
                                                    disabled={!selectedSubject?.track}>
                                                    <option value="">{!selectedSubject?.track ? 'Select Track First' : 'Select Strand'}</option>
                                                    {selectedSubject?.track && getStrandOptions(selectedSubject.track).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Subject Code</label>
                                                <input type="text" className="form-control font-monospace"
                                                    value={selectedSubject?.subjectCode || ''}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, subjectCode: e.target.value.toUpperCase() })}
                                                    placeholder="e.g. GENMATH-01" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Subject Name</label>
                                                <input type="text" className="form-control text-capitalize"
                                                    value={selectedSubject?.subjectName || ''}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, subjectName: e.target.value })}
                                                    placeholder="e.g. General Mathematics" />
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Subject Type</label>
                                                <select className="form-select" value={selectedSubject?.subjectType || 'core'}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, subjectType: e.target.value })}>
                                                    {subjectTypeOptions.map(t => <option key={t} value={t} className="text-capitalize">{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Teacher</label>
                                                <select className="form-select" value={selectedSubject?.teacher || ""}
                                                    onChange={(e) => {
                                                        const selectedTeacher = teachersList.find(t => t.fullName === e.target.value);
                                                        setSelectedSubject({ ...selectedSubject, teacher: e.target.value, teacherId: selectedTeacher?._id || "" });
                                                    }}
                                                    disabled={loadingTeachers}>
                                                    <option value="">{loadingTeachers ? 'Loading teachers...' : 'Select Teacher'}</option>
                                                    {teachersList.map(t => <option key={t._id} value={t.fullName}>{t.fullName}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Grade Level</label>
                                                <select className="form-select" value={selectedSubject?.gradeLevel || 11}
                                                    onChange={(e) => setSelectedSubject({ ...selectedSubject, gradeLevel: parseInt(e.target.value) })}>
                                                    {gradeOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={handleSubmitSubject} disabled={modalLoading}>
                                            {modalLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>{modalType === 'add' ? 'Adding...' : 'Updating...'}</>
                                            ) : (
                                                <><i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>{modalType === 'add' ? 'Add Subject' : 'Update Subject'}</>
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
                                            <br />This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={modalLoading}>
                                            {modalLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</> : <><i className="fa fa-trash me-2"></i>Yes, Delete</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999999999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
                                <p className="text-muted mb-4">{alertMessage}</p>
                                <button type="button" className={`btn ${alertType === 'success' ? 'btn-success' : 'btn-danger'} px-4`} onClick={() => setShowAlertModal(false)}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                ✅ Import Excel Modal — Redesigned to match SubjectDetails
            ============================================================ */}
            {showImportModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fa fa-file-excel me-2 text-success"></i>
                                    Import Subjects from Excel
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseImportModal} disabled={isProcessingExcel}></button>
                            </div>

                            <div className="modal-body">

                                {/* ---- STEP: UPLOAD ---- */}
                                {importStep === 'upload' && (
                                    <div>
                                        {/* Info Banner */}
                                        <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
                                            <i className="fa fa-info-circle mt-1"></i>
                                            <div>
                                                <strong>Prepare your Excel file before uploading.</strong><br />
                                                <span className="text-muted small">
                                                    Teacher names must exactly match existing teacher records. Grade Level must be 11 or 12.
                                                    Track must be <strong>Academic</strong> or <strong>TVL</strong>.
                                                    Subject Type must be <strong>core</strong>, <strong>specialized</strong>, or <strong>applied</strong>.
                                                </span>
                                            </div>
                                        </div>

                                        {/* Download Template */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <p className="text-muted mb-0 small">
                                                <i className="fa fa-lightbulb-o me-1 text-warning"></i>
                                                Download the template first, fill it in, then upload below.
                                            </p>
                                            <button className="btn btn-sm btn-outline-success" onClick={downloadTemplate}>
                                                <i className="fa fa-download me-2"></i>Download Template (.xlsx)
                                            </button>
                                        </div>

                                        {/* Column Guide */}
                                        <div className="table-responsive mb-4">
                                            <table className="table table-sm table-bordered text-center mb-0" style={{ fontSize: '0.85rem' }}>
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Column A</th>
                                                        <th>Column B</th>
                                                        <th>Column C</th>
                                                        <th>Column D</th>
                                                        <th>Column E</th>
                                                        <th>Column F</th>
                                                        <th>Column G</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Subject Code</strong><br /><span className="text-muted">e.g. GENMATH-01</span></td>
                                                        <td><strong>Subject Name</strong><br /><span className="text-muted">e.g. General Mathematics</span></td>
                                                        <td><strong>Grade Level</strong><br /><span className="text-muted">11 or 12</span></td>
                                                        <td><strong>Track</strong><br /><span className="text-muted">Academic or TVL</span></td>
                                                        <td><strong>Strand</strong><br /><span className="text-muted">e.g. STEM, ABM</span></td>
                                                        <td><strong>Subject Type</strong><br /><span className="text-muted">core / specialized / applied</span></td>
                                                        <td><strong>Teacher Name</strong><br /><span className="text-muted">Must match exactly</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Drag & Drop Upload Area */}
                                        <div
                                            className="border border-2 border-dashed rounded-3 text-center p-5"
                                            style={{ borderColor: '#dee2e6', background: '#f8f9fa', cursor: 'pointer' }}
                                            onClick={() => document.getElementById('subjectExcelInput').click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files[0];
                                                if (file) handleFileUpload(file);
                                            }}
                                        >
                                            {isProcessingExcel ? (
                                                <>
                                                    <span className="spinner-border text-danger mb-3 d-block mx-auto" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                                                    <p className="mb-0 fw-semibold text-muted">Processing file...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-cloud-upload fa-3x text-muted mb-3 d-block"></i>
                                                    <p className="mb-1 fw-semibold">Click to upload or drag & drop</p>
                                                    <p className="text-muted small mb-0">Accepts .xlsx or .xls files</p>
                                                </>
                                            )}
                                            <input
                                                id="subjectExcelInput"
                                                type="file"
                                                accept=".xlsx,.xls"
                                                className="d-none"
                                                onChange={(e) => handleFileUpload(e.target.files[0])}
                                            />
                                        </div>

                                        {/* Or add manually */}
                                        <div className="text-center mt-3">
                                            <span className="text-muted small">— or —</span>
                                            <div className="mt-2">
                                                <button className="btn btn-sm btn-outline-success" onClick={handleAddManualRow}>
                                                    <i className="fa fa-plus me-1"></i>Add Row Manually
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ---- STEP: PREVIEW ---- */}
                                {importStep === 'preview' && (
                                    <div>
                                        {/* Summary Bar */}
                                        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                                            <span className="badge bg-primary fs-6 px-3 py-2">
                                                <i className="fa fa-table me-1"></i>{allRows.length} row(s)
                                            </span>
                                            {validCount > 0 && (
                                                <span className="badge bg-success fs-6 px-3 py-2">
                                                    <i className="fa fa-check me-1"></i>{validCount} valid
                                                </span>
                                            )}
                                            {errorCount > 0 && (
                                                <span className="badge bg-danger fs-6 px-3 py-2">
                                                    <i className="fa fa-times me-1"></i>{errorCount} error(s)
                                                </span>
                                            )}
                                            <button
                                                className="btn btn-sm btn-outline-secondary ms-auto"
                                                onClick={() => setImportStep('upload')}
                                                disabled={isProcessingExcel}
                                            >
                                                <i className="fa fa-arrow-left me-1"></i>Upload Different File
                                            </button>
                                        </div>

                                        {/* Error Summary */}
                                        {importErrors.length > 0 && (
                                            <div className="alert alert-warning mb-3" style={{ fontSize: '0.85rem' }}>
                                                <strong><i className="fa fa-exclamation-triangle me-1"></i>Fix errors before importing:</strong>
                                                <ul className="mb-0 mt-2 ps-3">
                                                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Preview Table */}
                                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <table className="table table-sm table-bordered align-middle">
                                                <thead className="table-light sticky-top">
                                                    <tr>
                                                        <th style={{ width: '40px' }}>#</th>
                                                        <th>Code</th>
                                                        <th>Subject Name</th>
                                                        <th>Grade</th>
                                                        <th>Track</th>
                                                        <th>Strand</th>
                                                        <th>Type</th>
                                                        <th>Teacher</th>
                                                        <th style={{ width: '100px' }} className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Excel rows */}
                                                    {excelData.map((row, idx) => {
                                                        const isEditing = editingRows[idx];
                                                        const rowClass = row.hasError ? 'table-danger' : 'table-success';
                                                        return (
                                                            <tr key={row.id} className={rowClass}>
                                                                <td className="text-center">
                                                                    {row.hasError
                                                                        ? <i className="fa fa-times-circle text-danger" title={row.errorMessages?.join(', ')}></i>
                                                                        : <i className="fa fa-check-circle text-success"></i>
                                                                    }
                                                                </td>

                                                                {/* Subject Code */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <input type="text" className="form-control form-control-sm font-monospace"
                                                                            value={row.subjectCode}
                                                                            onChange={(e) => updateExcelRow(idx, { subjectCode: e.target.value.toUpperCase() })} />
                                                                    ) : (
                                                                        <span className="font-monospace">{row.subjectCode || <span className="text-danger fst-italic">missing</span>}</span>
                                                                    )}
                                                                </td>

                                                                {/* Subject Name */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <input type="text" className="form-control form-control-sm text-capitalize"
                                                                            value={row.subjectName}
                                                                            onChange={(e) => updateExcelRow(idx, { subjectName: e.target.value })} />
                                                                    ) : row.subjectName || <span className="text-danger fst-italic">missing</span>}
                                                                </td>

                                                                {/* Grade Level */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm"
                                                                            value={row.gradeLevel}
                                                                            onChange={(e) => updateExcelRow(idx, { gradeLevel: parseInt(e.target.value) })}>
                                                                            <option value={11}>Grade 11</option>
                                                                            <option value={12}>Grade 12</option>
                                                                        </select>
                                                                    ) : `Grade ${row.gradeLevel}`}
                                                                </td>

                                                                {/* Track */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm"
                                                                            value={row.track}
                                                                            onChange={(e) => updateExcelRow(idx, { track: e.target.value, strand: '' })}>
                                                                            <option value="">Select</option>
                                                                            {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                        </select>
                                                                    ) : row.track || <span className="text-danger fst-italic">missing</span>}
                                                                </td>

                                                                {/* Strand */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm"
                                                                            value={row.strand}
                                                                            onChange={(e) => updateExcelRow(idx, { strand: e.target.value })}
                                                                            disabled={!row.track}>
                                                                            <option value="">Select</option>
                                                                            {row.track && getStrandOptions(row.track).map(s => <option key={s} value={s}>{s}</option>)}
                                                                        </select>
                                                                    ) : row.strand || <span className="text-danger fst-italic">missing</span>}
                                                                </td>

                                                                {/* Subject Type */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm"
                                                                            value={row.subjectType}
                                                                            onChange={(e) => updateExcelRow(idx, { subjectType: e.target.value })}>
                                                                            {subjectTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                        </select>
                                                                    ) : row.subjectType}
                                                                </td>

                                                                {/* Teacher */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm"
                                                                            value={row.teacherName}
                                                                            onChange={(e) => {
                                                                                const teacher = teachersList.find(t => t.fullName === e.target.value);
                                                                                updateExcelRow(idx, { teacherName: e.target.value, teacherId: teacher?._id || '' });
                                                                            }}>
                                                                            <option value="">Select</option>
                                                                            {teachersList.map(t => <option key={t._id} value={t.fullName}>{t.fullName}</option>)}
                                                                        </select>
                                                                    ) : row.teacherName || <span className="text-danger fst-italic">missing</span>}
                                                                </td>

                                                                {/* Actions */}
                                                                <td className="text-center">
                                                                    <div className="d-flex gap-1 justify-content-center">
                                                                        <button
                                                                            className={`btn btn-sm ${isEditing ? 'btn-success' : 'btn-outline-warning'}`}
                                                                            onClick={() => toggleEditRow(idx)}
                                                                            title={isEditing ? 'Done' : 'Edit'}
                                                                            disabled={isProcessingExcel}
                                                                        >
                                                                            <i className={`fa ${isEditing ? 'fa-check' : 'fa-edit'}`}></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => removeExcelRow(idx)}
                                                                            title="Remove row"
                                                                            disabled={isProcessingExcel}
                                                                        >
                                                                            <i className="fa fa-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Manual rows */}
                                                    {manualRows.map((row) => (
                                                        <tr key={row.id} className={row.hasError ? 'table-danger' : 'table-success'}>
                                                            <td className="text-center">
                                                                {row.hasError
                                                                    ? <i className="fa fa-times-circle text-danger" title={row.errorMessages?.join(', ')}></i>
                                                                    : <i className="fa fa-check-circle text-success"></i>
                                                                }
                                                            </td>
                                                            <td>
                                                                <input type="text" className="form-control form-control-sm font-monospace"
                                                                    value={row.subjectCode} placeholder="CODE"
                                                                    onChange={(e) => updateManualRow(row.id, { subjectCode: e.target.value.toUpperCase() })} />
                                                            </td>
                                                            <td>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    value={row.subjectName} placeholder="Subject Name"
                                                                    onChange={(e) => updateManualRow(row.id, { subjectName: e.target.value })} />
                                                            </td>
                                                            <td>
                                                                <select className="form-select form-select-sm" value={row.gradeLevel}
                                                                    onChange={(e) => updateManualRow(row.id, { gradeLevel: parseInt(e.target.value) })}>
                                                                    <option value={11}>Grade 11</option>
                                                                    <option value={12}>Grade 12</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select className="form-select form-select-sm" value={row.track}
                                                                    onChange={(e) => updateManualRow(row.id, { track: e.target.value, strand: '' })}>
                                                                    <option value="">Select</option>
                                                                    {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select className="form-select form-select-sm" value={row.strand}
                                                                    onChange={(e) => updateManualRow(row.id, { strand: e.target.value })}
                                                                    disabled={!row.track}>
                                                                    <option value="">Select</option>
                                                                    {row.track && getStrandOptionsForTrack(row.track).map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select className="form-select form-select-sm" value={row.subjectType}
                                                                    onChange={(e) => updateManualRow(row.id, { subjectType: e.target.value })}>
                                                                    {subjectTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select className="form-select form-select-sm" value={row.teacherName}
                                                                    onChange={(e) => updateManualRow(row.id, { teacherName: e.target.value })}>
                                                                    <option value="">Select</option>
                                                                    {teachersList.map(t => <option key={t._id} value={t.fullName}>{t.fullName}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="text-center">
                                                                <button className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteManualRow(row.id)}
                                                                    disabled={isProcessingExcel}>
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Add manual row button */}
                                        <div className="p-3 border-top d-flex align-items-center gap-3">
                                            <button className="btn btn-sm btn-outline-success" onClick={handleAddManualRow}>
                                                <i className="fa fa-plus me-1"></i>Add Row Manually
                                            </button>
                                            {manualRows.length > 0 && (
                                                <small className="text-muted">{manualRows.length} manual row(s) added</small>
                                            )}
                                        </div>

                                        {errorCount > 0 && (
                                            <p className="text-muted small mt-2 mb-0">
                                                <i className="fa fa-info-circle me-1"></i>
                                                Red rows have errors. Click the <strong>edit</strong> button to fix them inline, or <strong>remove</strong> the row.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseImportModal} disabled={isProcessingExcel}>
                                    Cancel
                                </button>
                                {importStep === 'preview' && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleBulkImport}
                                        disabled={allRows.length === 0 || errorCount > 0 || isProcessingExcel}
                                    >
                                        {isProcessingExcel ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Importing...</>
                                        ) : (
                                            <><i className="fa fa-upload me-2"></i>Import {validCount} Subject(s)</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubjectManagement;