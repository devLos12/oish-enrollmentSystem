import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";





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
            console.log(data);

            
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
            setSubjectList(data);
            setFilteredSubjects(data);
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
            section: '',
            semester: 1,
            subjectType: 'core',
            track: '',
            teacher: '',
            // ✅ SIMPLE SCHEDULE FIELDS
            scheduleDay: '',
            scheduleStartTime: '',
            scheduleEndTime: '',
            room: ''
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
            // !selectedSubject.section.trim() || 
            !selectedSubject.semester ||
            !selectedSubject.subjectType.trim() ||
            !selectedSubject.track.trim() ||
            !selectedSubject.teacher.trim()
            // !selectedSubject.scheduleDay ||  // ✅ ADD
            // !selectedSubject.scheduleStartTime ||  // ✅ ADD
            // !selectedSubject.scheduleEndTime  ||// ✅ ADD
            // !selectedSubject.room
        ) {
            showAlert("Input Field Required!", 'error');
            return;
        }

        try {
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
                    // section: selectedSubject.section,
                    teacherId: selectedSubject.teacherId,
                    teacherName: selectedSubject.teacher,
                    // scheduleDay: selectedSubject.scheduleDay,  // ✅ ADD
                    // scheduleStartTime: selectedSubject.scheduleStartTime,  // ✅ ADD
                    // scheduleEndTime: selectedSubject.scheduleEndTime,  // ✅ ADD
                    // room: selectedSubject.room || ''  // ✅ ADD
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
        
        }
    };



    const confirmDelete = async () => {
        try {
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

        




    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5">
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="text-capitalize fw-bold mb-1">subject management</h4>
                                <p className="text-muted small mb-0">Manage academic subjects by grade level</p>
                            </div>
                            <button 
                                className="btn btn-danger"
                                onClick={handleAddSubject}
                            >
                                <i className="fa fa-plus me-2"></i>
                                Add Subject
                            </button>
                        </div>
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
                                <option key={sem} value={sem}>Semester {sem}</option>
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
                                                        <td className="align-middle">
                                                            {subject.semester}
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
                                                            section: '' 
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
                                                            section: ''  
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
                                        {/* ✅ SECTION ROW - ILAGAY DITO! */}
                                        {/* <div className="row mb-3">
                                            <div className="col-12">
                                                <label className="form-label text-capitalize fw-bold">
                                                    Section
                                                    {loadingSections && (
                                                        <span className="spinner-border spinner-border-sm ms-2" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </span>
                                                    )}
                                                </label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.section || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, section: e.target.value})}
                                                    disabled={!selectedSubject?.gradeLevel || !selectedSubject?.strand || !selectedSubject?.track || loadingSections}
                                                >
                                                    <option value="">Select Section</option>
                                                    {availableSections.map(section => (
                                                        <option key={section._id} value={section.name}>
                                                            {section.name} ({section.students?.length || 0}/{section.maxCapacity})
                                                        </option>
                                                    ))}
                                                </select>
                                                {(!selectedSubject?.gradeLevel || !selectedSubject?.strand || !selectedSubject?.track) && (
                                                    <small className="text-muted d-block mt-1">
                                                        <i className="fa fa-info-circle me-1"></i>
                                                        Select Grade Level, Track, Strand, and Semester first
                                                    </small>
                                                )}
                                                {availableSections.length === 0 && selectedSubject?.strand && !loadingSections && (
                                                    <small className="text-warning d-block mt-1">
                                                        <i className="fa fa-exclamation-triangle me-1"></i>
                                                        No sections available for this combination
                                                    </small>
                                                )}
                                            </div>
                                        </div> */}

                                        

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
                                                        <option key={sem} value={sem}>Semester {sem}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>



                                        {/* ✅ SCHEDULE SECTION */}
                                        {/* <div className="row mb-3">
                                            <div className="col-12">
                                                <label className="form-label text-capitalize fw-bold">Schedule & Room</label>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Day</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSubject?.scheduleDay || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, scheduleDay: e.target.value})}
                                                >
                                                    <option value="">Select Day</option>
                                                    {dayOptions.map(day => (
                                                        <option key={day} value={day}>{day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Start Time</label>
                                                <input 
                                                    type="time"
                                                    className="form-control"
                                                    value={selectedSubject?.scheduleStartTime || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, scheduleStartTime: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">End Time</label>
                                                <input 
                                                    type="time"
                                                    className="form-control"
                                                    value={selectedSubject?.scheduleEndTime || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, scheduleEndTime: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Room (Optional)</label>
                                                <input 
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. Room 101"
                                                    value={selectedSubject?.room || ''}
                                                    onChange={(e) => setSelectedSubject({...selectedSubject, room: e.target.value})}
                                                />
                                            </div>
                                        </div> */}

                                    </div>


                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleSubmitSubject}
                                        >
                                            <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                                            {modalType === 'add' ? 'Add Subject' : 'Update Subject'}
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
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={confirmDelete}
                                        >
                                            <i className="fa fa-trash me-2"></i>
                                            Yes, Delete
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
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
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
        </>
    );
};

export default SubjectManagement;