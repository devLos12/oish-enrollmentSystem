import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../context/global.jsx";
import { useLocation } from "react-router-dom";

const Schedule = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterStrand, setFilterStrand] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        title: '',
        date: '',
        time: '',
        description: ''
    });
    const [emailHistory, setEmailHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    
    // Email history delete states
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [historyItemsPerPage] = useState(10);

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const gradeOptions = [11, 12];

    const sectionOptions = [...new Set(students.map(student => student.section))].sort();
    const strandOptions = [...new Set(students.map(student => student.strand))].sort();


    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // Calculate email history pagination
  

    const [historyDateFilter, setHistoryDateFilter] = useState('');
    const [filteredEmailHistory, setFilteredEmailHistory] = useState([]);



    const historyIndexOfLastItem = historyCurrentPage * historyItemsPerPage;
    const historyIndexOfFirstItem = historyIndexOfLastItem - historyItemsPerPage;
    const currentEmailHistory = filteredEmailHistory.slice(historyIndexOfFirstItem, historyIndexOfLastItem);
    const historyTotalPages = Math.ceil(filteredEmailHistory.length / historyItemsPerPage);


    // Alert function
    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);

    useEffect(() => {
        getAllStudents();
        getEmailHistory();
    }, []);

    useEffect(() => {
        let filtered = students.filter(student => 
            student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterGrade) {
            filtered = filtered.filter(student => student.gradeLevel === parseInt(filterGrade));
        }

        if (filterStrand) {
            filtered = filtered.filter(student => student.strand === filterStrand);
        }

        if (filterSection) {
            filtered = filtered.filter(student => student.section === filterSection);
        }


        setFilteredStudents(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterGrade, filterStrand, filterSection, students]);







    // Filter email history by date
    useEffect(() => {
        let filtered = emailHistory;

        if (historyDateFilter) {
            filtered = filtered.filter(email => {
                const emailDate = new Date(email.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
                return emailDate === historyDateFilter;
            });
        }

        setFilteredEmailHistory(filtered);
        setHistoryCurrentPage(1);
    }, [historyDateFilter, emailHistory]);




    
    const getAllStudents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllStudents`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setStudents(data);
            setFilteredStudents(data);
        } catch (error) {
            console.log("Error: ", error.message);
            showAlert("Failed to load students data", 'error');
        } finally {
            setLoading(false);
        }
    };

   

    const getEmailHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getEmailHistory`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            const reversed = data.reverse();
            setEmailHistory(reversed);
            setFilteredEmailHistory(reversed);
        } catch (error) {
            console.log("Error fetching email history: ", error.message);
            showAlert("Failed to load email history", 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleSelectAll = () => {
        if (currentStudents.every(student => selectedStudents.includes(student._id))) {
            setSelectedStudents(prev => prev.filter(id => !currentStudents.map(s => s._id).includes(id)));
        } else {
            const currentPageIds = currentStudents.map(student => student._id);
            setSelectedStudents(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleScheduleRequirements = () => {
        if (selectedStudents.length === 0) {
            showAlert("Please select at least one student!", 'error');
            return;
        }
        setShowModal(true);
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedStudents([]);
    };

    const handleSubmitSchedule = async () => {
        if (!scheduleData.title.trim() || !scheduleData.date || !scheduleData.time || !scheduleData.description.trim()) {
            showAlert("All fields are required!", 'error');
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/scheduleRequirements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: selectedStudents,
                    title: scheduleData.title,
                    date: scheduleData.date,
                    time: scheduleData.time,
                    description: scheduleData.description
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert("Requirements scheduled successfully! Emails will be sent to selected students.", 'success');
            setShowModal(false);
            setSelectedStudents([]);
            setIsSelectionMode(false);
            setScheduleData({ title: '', date: '', time: '', description: '' });
            getEmailHistory();
        } catch (error) {
            console.error("Error scheduling requirements:", error.message);
            showAlert("Failed to schedule requirements: " + error.message, 'error');
        }
    };

    // Email history delete functions
    const handleSelectEmail = (emailId) => {
        setSelectedEmails(prev => {
            if (prev.includes(emailId)) {
                return prev.filter(id => id !== emailId);
            } else {
                return [...prev, emailId];
            }
        });
    };

    const handleSelectAllEmails = () => {
        if (currentEmailHistory.every(email => selectedEmails.includes(email._id))) {
            setSelectedEmails(prev => prev.filter(id => !currentEmailHistory.map(e => e._id).includes(id)));
        } else {
            const currentPageIds = currentEmailHistory.map(email => email._id);
            setSelectedEmails(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteMode(false);
        setSelectedEmails([]);
    };

    const handleDeleteEmails = async () => {

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteEmailHistory`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailIds: selectedEmails
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(data.message, 'success');
            setShowDeleteConfirm(false);
            setIsDeleteMode(false);
            setSelectedEmails([]);
            getEmailHistory();
        } catch (error) {
            console.error("Error deleting email history:", error.message);
            showAlert("Failed to delete email history: " + error.message, 'error');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleHistoryPageChange = (pageNumber) => {
        setHistoryCurrentPage(pageNumber);
    };

    const renderPagination = (currentPg, totalPgs, onPageChange) => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPg - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPgs, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        pages.push(
            <li key="prev" className={`page-item ${currentPg === 1 ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => onPageChange(currentPg - 1)}
                    disabled={currentPg === 1}
                >
                    <i className="fa fa-chevron-left"></i>
                </button>
            </li>
        );

        if (startPage > 1) {
            pages.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => onPageChange(1)}>
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
                <li key={i} className={`page-item ${currentPg === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(i)}>
                        {i}
                    </button>
                </li>
            );
        }

        if (endPage < totalPgs) {
            if (endPage < totalPgs - 1) {
                pages.push(
                    <li key="ellipsis2" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
            pages.push(
                <li key={totalPgs} className="page-item">
                    <button className="page-link" onClick={() => onPageChange(totalPgs)}>
                        {totalPgs}
                    </button>
                </li>
            );
        }

        pages.push(
            <li key="next" className={`page-item ${currentPg === totalPgs ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => onPageChange(currentPg + 1)}
                    disabled={currentPg === totalPgs}
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
                                <h4 className="text-capitalize fw-bold mb-1">schedule requirements</h4>
                                <p className="text-muted small mb-0">Select students and schedule requirements submission</p>
                            </div>
                            <div>
                                {!isSelectionMode ? (
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => setIsSelectionMode(true)}
                                    >
                                        <i className="fa fa-check-square me-2"></i>
                                        Select Students
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={handleCancelSelection}
                                        >
                                            <i className="fa fa-times me-2"></i>
                                            Cancel
                                        </button>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={handleScheduleRequirements}
                                            disabled={selectedStudents.length === 0}
                                        >
                                            <i className="fa fa-calendar me-2"></i>
                                            Schedule Requirements ({selectedStudents.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12 col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name, student number, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-4 col-md-2 mt-2 mt-md-0">
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
                    <div className="col-4 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterStrand}
                            onChange={(e) => setFilterStrand(e.target.value)}
                        >
                            <option value="">All Strands</option>
                            {strandOptions.map(strand => (
                                <option key={strand} value={strand}>{strand}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-4 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {sectionOptions.map(section => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0 text-end">
                        <p className="text-muted mb-0 mt-2">
                            Total: <strong>{filteredStudents.length}</strong>
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
                                        <p className="text-muted mt-2">Loading students data...</p>
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No students found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="text-capitalize fw-semibold">#</th>
                                                        <th className="text-capitalize fw-semibold">Student Number</th>
                                                        <th className="text-capitalize fw-semibold">Full Name</th>
                                                        <th className="text-capitalize fw-semibold">Email</th>
                                                        <th className="text-capitalize fw-semibold">Grade</th>
                                                        {/* <th className="text-capitalize fw-semibold">Track</th> */}
                                                        <th className="text-capitalize fw-semibold">Strand</th>
                                                        <th className="text-capitalize fw-semibold">Section</th>
                                                        <th className="text-capitalize fw-semibold">Status</th>
                                                        {isSelectionMode && (
                                                            <th className="text-capitalize fw-semibold text-center">
                                                                <input 
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={currentStudents.length > 0 && currentStudents.every(student => selectedStudents.includes(student._id))}
                                                                    onChange={handleSelectAll}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                />
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentStudents.map((student, index) => (
                                                        <tr key={student._id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-secondary font-monospace">
                                                                    {student.studentNumber}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle fw-semibold text-capitalize">
                                                                {student.firstName} {student.middleName} {student.lastName}
                                                            </td>
                                                            <td className="align-middle">
                                                                <small>{student.email}</small>
                                                            </td>
                                                            <td className="align-middle">
                                                                Grade {student.gradeLevel}
                                                            </td>
                                                            {/* <td className="align-middle">
                                                                <span className="badge bg-warning text-dark">
                                                                    {student.track}
                                                                </span>
                                                            </td> */}
                                                            <td className="align-middle">
                                                                <span className="badge bg-danger">
                                                                    {student.strand}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-info">
                                                                    {student.section}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className={`badge ${student.status === 'enrolled' ? 'bg-success' : 'bg-secondary'} text-capitalize`}>
                                                                    {student.status}
                                                                </span>
                                                            </td>
                                                            {isSelectionMode && (
                                                                <td className="align-middle text-center">
                                                                    <input 
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={selectedStudents.includes(student._id)}
                                                                        onChange={() => handleSelectStudent(student._id)}
                                                                        style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                    />
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {totalPages > 0 && (
                                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                                <div className="text-muted small">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
                                                </div>
                                                <nav>
                                                    <ul className="pagination mb-0">
                                                        {renderPagination(currentPage, totalPages, handlePageChange)}
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

             

                {/* Email History Table */}
                <div className="row mt-4">

                


                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    

                                    <h5 className="mb-0 text-capitalize fw-bold">
                                        <i className="fa fa-history me-2"></i>
                                        Email History
                                    </h5>


                                    {/* DATE FILTER */}
                                    <div className="d-flex gap-2 align-items-center">
                                        <label className="text-muted small mb-0">Filter by Sent Date:</label>
                                        <div className="input-group" style={{width: '200px'}}>
                                            <span className="input-group-text bg-white">
                                                <i className="fa fa-calendar text-muted"></i>
                                            </span>
                                            <input 
                                                type="date" 
                                                className="form-control border-start-0"
                                                value={historyDateFilter}
                                                onChange={(e) => setHistoryDateFilter(e.target.value)}
                                            />
                                            {historyDateFilter && (
                                                <button 
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setHistoryDateFilter('')}
                                                    title="Clear date filter"
                                                >
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>



                                    <div>
                                        {!isDeleteMode ? (
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setIsDeleteMode(true)}
                                                disabled={emailHistory.length === 0}
                                            >
                                                <i className="fa fa-trash me-2"></i>
                                                Select for Delete
                                            </button>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={handleCancelDelete}
                                                >
                                                    <i className="fa fa-times me-2"></i>
                                                    Cancel
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    disabled={selectedEmails.length === 0}
                                                >
                                                    <i className="fa fa-trash me-2"></i>
                                                    Delete Selected ({selectedEmails.length})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {historyDateFilter && (
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <div className="alert alert-info py-2 mb-0 rounded-0">
                                            <i className="fa fa-calendar me-2"></i>
                                            Showing email history for: <strong>{new Date(historyDateFilter).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}


                            <div className="card-body p-0">
                                {loadingHistory ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-danger spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : emailHistory.length === 0 ? (
                                    <div className="text-center py-4">
                                        <i className="fa fa-inbox fa-2x text-muted mb-2"></i>
                                        <p className="text-muted mb-0">No email history yet</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="text-capitalize fw-semibold">#</th>
                                                    <th className="text-capitalize fw-semibold">Title</th>
                                                    <th className="text-capitalize fw-semibold">Scheduled Date & Time</th>
                                                    <th className="text-capitalize fw-semibold">Participants</th>
                                                    <th className="text-capitalize fw-semibold">Description</th>
                                                    <th className="text-capitalize fw-semibold">Sent At</th>
                                                    {isDeleteMode && (
                                                        <th className="text-capitalize fw-semibold text-center">
                                                            <input 
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={currentEmailHistory.length > 0 && currentEmailHistory.every(email => selectedEmails.includes(email._id))}
                                                                onChange={handleSelectAllEmails}
                                                                style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                            />
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentEmailHistory.map((email, index) => (
                                                    <tr key={email._id}>
                                                        <td className="align-middle text-muted">{historyIndexOfFirstItem + index + 1}</td>
                                                        <td className="align-middle text-muted small text-capitalize fw-semibold">{email.title}</td>
                                                        <td className="align-middle">
                                                            <div>
                                                                <i className="fa fa-calendar me-1 small"></i>
                                                                {new Date(email.scheduledDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                            <div className="text-muted small">
                                                                <i className="fa fa-clock me-1"></i>
                                                                {email.scheduledTime}
                                                            </div>
                                                        </td>
                                                        <td className="align-middle small text-muted">
                                                            <span className="text-capitalize">
                                                                <i className="fa fa-users me-1"></i>
                                                                {email.participantCount === 1 
                                                                ? `${email.participantCount} student` 
                                                                : `${email.participantCount} students`}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle">
                                                            <small className="text-muted text-capitalize" title={email.description}>
                                                                {email.description}
                                                            </small>
                                                        </td>
                                                        <td className="align-middle">
                                                            <small className="text-muted">
                                                                {formatDate(email.createdAt)}
                                                            </small>
                                                        </td>
                                                        {isDeleteMode && (
                                                            <td className="align-middle text-center">
                                                                <input 
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={selectedEmails.includes(email._id)}
                                                                    onChange={() => handleSelectEmail(email._id)}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                />
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {historyTotalPages > 0 && (
                                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                                <div className="text-muted small">
                                                    Showing {historyIndexOfFirstItem + 1} to {Math.min(historyIndexOfLastItem, filteredEmailHistory.length)} of {filteredEmailHistory.length} entries
                                                    {historyDateFilter && (
                                                        <span className="text-primary"> (filtered)</span>
                                                    )}
                                                </div>
                                                <nav>
                                                    <ul className="pagination mb-0">
                                                        {renderPagination(historyCurrentPage, historyTotalPages, handleHistoryPageChange)}
                                                    </ul>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    <i className="fa fa-calendar-check me-2"></i>
                                    Schedule Requirements Submission
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <i className="fa fa-info-circle me-2"></i>
                                    <strong>{selectedStudents.length}</strong> student(s) selected. They will receive an email notification.
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-capitalize fw-bold">
                                        Title <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control text-capitalize"
                                        value={scheduleData.title}
                                        onChange={(e) => setScheduleData({...scheduleData, title: e.target.value})}
                                        placeholder="e.g., Submit Grade 11 Requirements"
                                    />
                                </div>

                                <div className="row mb-3">
                                    <div className="col-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Date <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            className="form-control"
                                            value={scheduleData.date}
                                            onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Time <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="time" 
                                            className="form-control"
                                            value={scheduleData.time}
                                            onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-capitalize fw-bold">
                                        Description <span className="text-danger">*</span>
                                    </label>
                                    <textarea 
                                        className="form-control"
                                        rows="5"
                                        value={scheduleData.description}
                                        onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})}
                                        placeholder="Provide detailed description of requirements to be submitted..."
                                    ></textarea>
                                    <small className="text-muted">
                                        This description will be included in the email notification.
                                    </small>
                                </div>
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
                                    onClick={handleSubmitSchedule}
                                >
                                    <i className="fa fa-paper-plane me-2"></i>
                                    Schedule & Send Notifications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 text-danger">
                                    <i className="fa fa-exclamation-triangle fa-3x"></i>
                                </div>
                                <h5 className="fw-bold mb-2">Confirm Delete</h5>
                                <p className="text-muted mb-4">
                                    Are you sure you want to delete <strong>{selectedEmails.length}</strong> email history record(s)? 
                                    This action cannot be undone.
                                </p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary px-4"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger px-4"
                                        onClick={handleDeleteEmails}
                                    >
                                        <i className="fa fa-trash me-2"></i>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
                    <div className="modal-dialog modal-dialog-centered">
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

export default Schedule;