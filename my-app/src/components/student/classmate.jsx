import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../../context/global";

const StudentTable = () => {
    const location = useLocation();
    const [studentList, setStudentList] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const { setTextHeader} = useContext(globalContext);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);

    useEffect(() => {
        console.log(location?.state?.data);
    })

    // Fetch student data from location state
    useEffect(() => {
        if (location?.state?.data.students) {
            setStudentList(location.state.data.students);
            setFilteredStudents(location.state.data.students);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [location?.state?.data.students]);

    // Search filter
    useEffect(() => {
        const filtered = studentList.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStudents(filtered);
        setCurrentPage(1);
    }, [searchTerm, studentList]);

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const formatTo12Hour = (time) => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
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

    const subjectData = location?.state?.data;

    return (
        <>
            <div className="container-fluid py-4 ">
                {/* Header Section with Schedule */}
                <div className="row justify-content-center mb-4">
                    <div className="col-12 col-md-11 col-lg-11">
                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-8">
                                        <div className="d-flex gap-2 align-items-center">
                                            <h4 className="text-capitalize fw-bold mb-1">
                                                {`${subjectData?.subjectName || 'Subject'}`}
                                            </h4>
                                            <div>|</div>
                                            <p className="m-0 badge bg-info">{subjectData?.subjectCode}</p>
                                        </div>
                                       
                                       <div>
                                        <p className="m-0 fw-semibold">
                                            {subjectData?.gradeLevel} - {subjectData.sectionName}
                                        </p>
                                       </div>

                                        <p className="m-0 text-muted  ">
                                            List of students enrolled in this subject
                                        </p>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="d-flex flex-column gap-1">
                                      
                                           
                                            {subjectData?.scheduleDay && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="fa fa-calendar text-muted small"></i>
                                                    <small className="text-muted">Schedule:</small>
                                                    <small className="fw-bold">{subjectData.scheduleDay}</small>
                                                </div>
                                            )}
                                            {(subjectData?.scheduleStartTime && subjectData?.scheduleEndTime) && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="fa fa-clock text-muted small"></i>
                                                    <small className="text-muted">Time:</small>
                                                    <small className="fw-bold">
                                                        {formatTo12Hour(subjectData.scheduleStartTime)} - {formatTo12Hour(subjectData.scheduleEndTime)}
                                                    </small>
                                                </div>
                                            )}

                                            {subjectData?.teacher && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="fa fa-user text-muted small"></i>
                                                    <small className="text-muted">Teacher:</small>
                                                    <small className="fw-bold text-capitalize">{subjectData.teacher}</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="row justify-content-center mb-3">
                    <div className="col-12 col-md-11 ">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name, section, or student number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-11 text-end">
                        <p className="text-muted mb-0 mt-2">
                            Total Students: <strong>{filteredStudents.length}</strong>
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="row justify-content-center">
                    <div className="col-12 col-md-11 col-lg-11">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2">Loading student data...</p>
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
                                                        <th className="text-capitalize fw-bold">#</th>
                                                        <th className="text-capitalize fw-bold">Student Number</th>
                                                        <th className="text-capitalize fw-bold">Name</th>
                                                        <th className="text-capitalize fw-bold">Email</th>
                                                        <th className="text-capitalize  fw-bold">Grade & Section</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentStudents.map((student, index) => (
                                                        <tr key={student.id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-secondary">
                                                                    {student.studentNumber}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className="text-capitalize fw-semibold">
                                                                    {student.name}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                {student.email}
                                                            </td>
                                                            <td className="align-middle">
                                                                {student.gradeLevel} - {student.section}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Pagination */}
                                        {totalPages >= 1 && (
                                            <div className="d-flex justify-content-between align-items-center pt-3 px-3 pb-3 border-top">
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

            {/* View Modal */}
            {showModal && selectedStudent && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">Student Details</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-3">
                                    <div className="avatar bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                                        style={{width: '80px', height: '80px', fontSize: '32px'}}>
                                        {selectedStudent.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted small text-uppercase">Student Number</label>
                                    <p className="fw-semibold">{selectedStudent.studentNumber}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted small text-uppercase">Full Name</label>
                                    <p className="fw-semibold text-capitalize">{selectedStudent.name}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted small text-uppercase">Section</label>
                                    <p className="fw-semibold">{selectedStudent.section}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted small text-uppercase">Student ID</label>
                                    <p className="fw-semibold font-monospace small">{selectedStudent.id}</p>
                                </div>
                                
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentTable;