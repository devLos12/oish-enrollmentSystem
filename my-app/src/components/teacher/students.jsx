import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../../context/global";

const Students = () => {
    const location = useLocation();
    const subjectId = location?.state?.subjectId;
    const sectionId = location?.state?.sectionId;

    const [students, setStudents] = useState([]);
    const [subjectInfo, setSubjectInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { setTextHeader } = useContext(globalContext);


    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);



    useEffect(() => {
        if(subjectId && sectionId){
            getStudents();
        }
    }, [subjectId, sectionId]);


    
    const getStudents = async() => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getTeacherStudents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ subjectId, sectionId }),
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            if(data.success){
                console.log(data);
                setSubjectInfo(data.data.subject);
                setStudents(data.data.students);
            }
        } catch (error) {
            console.log("Error: ", error.message);
        } finally {
            setLoading(false);
        }
    }

    // ✅ Format time to 12-hour format (e.g., "10:39 AM")
    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Filter students based on search query
    const filteredStudents = students.filter(student => {
        const searchLower = searchQuery.toLowerCase().trim();
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        
        return (
            fullName.includes(searchLower) ||
            student.firstName.toLowerCase().includes(searchLower) ||
            student.lastName.toLowerCase().includes(searchLower) ||
            student.studentNumber.toLowerCase().includes(searchLower) ||
            student.section.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower)
        );
    });


    // Pagination logic (using filtered students)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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

    if(loading){
        return (
            <div className="container mt-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {subjectInfo && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="row">
                                    {/* Left Column - Subject Info */}
                                    <div className="col-12 col-lg-8">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <h2 className="m-0 fw-bold text-capitalize">{subjectInfo.subjectName}</h2>
                                            <span className="badge bg-info text-white">{subjectInfo.subjectCode}</span>
                                        </div>
                                        <p className="text-muted mb-2">
                                            {students.length > 0 ? `${students[0].gradeLevel} - ${students[0].section}` : 'No section info'}
                                        </p>
                                        <p className="text-muted mb-0">List of students enrolled in this subject</p>
                                    </div>
                                    
                                    {/* Right Column - Time and Teacher */}
                                    <div className="col-12 col-lg-4">
                                        <div className="text-lg-end mt-3 mt-lg-0">
                                            <div className="mb-2">
                                                <i className="fa fa-clock me-2 text-muted"></i>
                                                <span className="text-muted">Time: </span>
                                                <span className="fw-semibold">
                                                    {formatTime(subjectInfo.scheduleStartTime)} - {formatTime(subjectInfo.scheduleEndTime)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar and Total Students */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="position-relative">
                        {/* Search Input with Icon */}
                        <div className="input-group input-group-lg">
                            <span className="input-group-text bg-white border-end-0 ps-3">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-2"
                                placeholder="Search by name, section, or student number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ fontSize: '1rem' }}
                            />
                        </div>
                        {/* Total Students - Below Search Bar, Right Aligned */}
                        <div className="text-end mt-2">
                            <span className="text-muted">Total Students: </span>
                            <span className="fw-bold fs-5">{students.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Enrolled Students</h5>
                            </div>
                            
                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">
                                        {searchQuery ? 'No students found matching your search' : 'No students enrolled yet'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Student Number</th>
                                                    <th>Full Name</th>
                                                    <th>Email</th>
                                                    <th>Sex</th>
                                                    <th>Grade & Section</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentStudents.map((student, index) => (
                                                    <tr key={student.studentId}>
                                                        <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                        <td className="align-middle">
                                                            <span className="badge bg-secondary font-monospace">
                                                                {student.studentNumber}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle fw-semibold text-capitalize">
                                                            {student.firstName} {student.lastName}
                                                        </td>
                                                        <td className="align-middle">{student.email}</td>
                                                        <td className="align-middle">{student.sex}</td>
                                                        <td className="align-middle">
                                                            {student.gradeLevel} - {student.section}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {totalPages >= 1 && (
                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                            <div className="text-muted small">
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
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
    );
}

export default Students;