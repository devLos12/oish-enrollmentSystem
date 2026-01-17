import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";

const StudentManagement = () => {
    const { role, setTextHeader, studentList, setStudentList } = useContext(globalContext);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStrand, setFilterStrand] = useState('');
    const [studentType, setStudentType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const navigate = useNavigate();
    
    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success'); // 'success' or 'error'
    
    const gradeOptions = [11, 12];
    const statusOptions = ['pending','enrolled','unenrolled', 'dropped', 'graduated'];
    const semesterOptions = [1, 2];
    
    // Dynamic strand options from actual student data
    const strandOptions = [...new Set(
        studentList
            .map(student => student.strand)
            .filter(strand => strand) // Remove null/undefined
    )].sort();
    
    const location = useLocation();

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title, setTextHeader]);

    useEffect(() => {
        fetchStudentsData();
        
        const handleClickOutside = (e) => {
            if (!e.target.closest('.action-dropdown')) {
                setOpenDropdown(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        let filtered = studentList.filter(student => {
            const fullName = `${student.lastName} ${student.firstName} ${student.middleName || ''}`.toLowerCase();
            const lrn = student.lrn?.toLowerCase() || '';
            const studentNumber = student.studentNumber?.toLowerCase() || '';
            const email = student.email?.toLowerCase() || '';
            
            return fullName.includes(searchTerm.toLowerCase()) ||
                   lrn.includes(searchTerm.toLowerCase()) ||
                   studentNumber.includes(searchTerm.toLowerCase()) ||
                   email.includes(searchTerm.toLowerCase());
        });

        // Filter by student type
        if (studentType === 'regular') {
            filtered = filtered.filter(student => student.studentType === 'regular');
        } else if (studentType === 'repeater') {
            filtered = filtered.filter(student => student.studentType === 'repeater');
        }
        // if 'all', don't filter by student type

        if (filterGrade) {
            filtered = filtered.filter(student => student.gradeLevel === parseInt(filterGrade));
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(student => student.status === filterStatus);
        }

        if (filterSemester) {
            filtered = filtered.filter(student => student.semester === parseInt(filterSemester));
        }

        if (filterStrand) {
            filtered = filtered.filter(student => student.strand === filterStrand);
        }

        setFilteredStudents(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterGrade, filterStatus, filterSemester, filterStrand, studentType, studentList]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    const fetchStudentsData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getStudents`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setStudentList(data);
            setFilteredStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error.message);
            showAlert("Failed to load students data", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudent = (student) => {
        setOpenDropdown(null);
        navigate(`/${role}/registration_form`, { state: student})
    };

    const handleEditStudent = (student) => {
        setOpenDropdown(null);
        navigate(`/${role}/edit_student`, { 
            state: { 
                title: "Update Student", 
                selectedStudent: student
            }
        })
    };

    const handleDeleteStudent = (student) => {
        setOpenDropdown(null);
        setSelectedStudent(student);
        setModalType('delete');
        setShowModal(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteStudent/${selectedStudent._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert("Student deleted successfully!", 'success');
            fetchStudentsData();
        } catch (error) {
            console.error("Error deleting student:", error.message);
            showAlert("Failed to delete student", 'error');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-secondary',
            enrolled: 'bg-success',
            dropped: 'bg-danger',
            graduated: 'bg-primary'
        };
        return badges[status] || 'bg-secondary';
    };

    const getStatusCounts = () => {
        return {
            all: studentList.length,
            pending: studentList.filter(s => s.status === 'pending').length,
            enrolled: studentList.filter(s => s.status === 'enrolled').length,
            dropped: studentList.filter(s => s.status === 'dropped').length,
            graduated: studentList.filter(s => s.status === 'graduated').length
        };
    };

    const statusCounts = getStatusCounts();

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

    const FilterSelect = ({ value, onChange, options, placeholder, renderOption }) => (
        <select className="form-select" value={value} onChange={onChange}>
            <option value="">{placeholder}</option>
            {options.map(option => renderOption(option))}
        </select>
    );

    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5 ">
                <div className="row mb-3 ">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h4 className="text-capitalize fw-bold mb-1">student management</h4>
                                <p className="text-muted small mb-0">Manage enrolled students and their information</p>
                            </div>
                            <div className="btn-group" role="group">
                                <button 
                                    type="button" 
                                    className={`btn ${studentType === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                    onClick={() => setStudentType('all')}
                                >
                                    <i className="fa fa-users me-2"></i>All
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${studentType === 'regular' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={() => setStudentType('regular')}
                                >
                                    <i className="fa fa-user me-2"></i>Regular
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${studentType === 'repeater' ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => setStudentType('repeater')}
                                >
                                    <i className="fa fa-redo me-2"></i>Repeater
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-12">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name, LRN, student #..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <FilterSelect
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            options={gradeOptions}
                            placeholder="All Grade Levels"
                            renderOption={(grade) => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            )}
                        />
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status ({statusCounts.all})</option>
                            <option value="pending">Pending ({statusCounts.pending})</option>
                            <option value="enrolled">Enrolled ({statusCounts.enrolled})</option>
                            <option value="dropped">Dropped ({statusCounts.dropped})</option>
                            <option value="graduated">Graduated ({statusCounts.graduated})</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <FilterSelect
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            options={semesterOptions}
                            placeholder="All Semesters"
                            renderOption={(semester) => (
                                <option key={semester} value={semester}>Semester {semester}</option>
                            )}
                        />
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
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
                    <div className="col-12 col-md-4 mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-3">
                        <p className="text-muted mb-0 text-capitalize">
                            total: <strong>{filteredStudents.length}</strong>
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
                                                        {['#', 'Student No', 'LRN', 'Full Name', 'Grade', 'semester', 'Strand', 'Section', 'Sex', 'Status', 'Actions'].map(header => (
                                                            <th key={header} className={`text-capitalize fw-semibold ${header === 'Actions' ? 'text-center' : ''}`}>
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentStudents.map((student, index) => (
                                                        <tr key={student._id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-info text-dark font-monospace">
                                                                    {student.studentNumber}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-secondary font-monospace">
                                                                    {student.lrn}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle fw-semibold text-capitalize">
                                                                {`${student.lastName}, ${student.firstName} ${student.middleName } 
                                                                ${(student.extensionName === "N/A") || (student.extensionName === "n/a") ? "" : student.extensionName }`.trim()}
                                                            </td>
                                                            <td className="align-middle">Grade {student.gradeLevel}</td>
                                                            <td className="align-middle">{student.semester}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-danger">
                                                                    {student.strand || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">{student.section || 'No Section'}</td>
                                                            <td className="align-middle">{student.sex}</td>
                                                            <td className="align-middle">
                                                                <span className={`badge ${getStatusBadge(student.status)} text-capitalize`}>
                                                                    {student.status}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle  text-center">
                                                                <div className="position-relative action-dropdown ">
                                                                    <button 
                                                                        className="btn btn-sm btn-light border-0"
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenDropdown(openDropdown === student._id ? null : student._id);
                                                                        }}
                                                                    >
                                                                        <i className="fa fa-ellipsis"></i>
                                                                    </button>
                                                                    {openDropdown === student._id && (
                                                                        <div 
                                                                            className="position-absolute bg-white border rounded shadow-sm py-2 "
                                                                            style={{
                                                                                minWidth: '180px',
                                                                                zIndex: 1050,
                                                                                right: '0',
                                                                                top: '100%',
                                                                                marginTop: '5px'
                                                                            }}
                                                                        >
                                                                            <DropdownItem 
                                                                                icon="eye" 
                                                                                text="View Details" 
                                                                                color="primary"
                                                                                onClick={() => handleViewStudent(student)}
                                                                            />
                                                                            <DropdownItem 
                                                                                icon="edit" 
                                                                                text="Edit Student" 
                                                                                color="warning"
                                                                                onClick={() => handleEditStudent(student)}
                                                                            />
                                                                            <hr className="my-1" />
                                                                            <DropdownItem 
                                                                                icon="trash" 
                                                                                text="Delete Student" 
                                                                                color="danger"
                                                                                onClick={() => handleDeleteStudent(student)}
                                                                                danger
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 0 && (
                                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
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

            {/* Delete Confirmation Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            {modalType === 'delete' && selectedStudent && (
                                <>
                                    <div className="modal-header">
                                        <h5 className="modal-title text-capitalize">Delete Student</h5>
                                        <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <div className="text-muted">
                                            <p className="mb-2">Do you really want to delete student:</p>
                                            <strong className="text-capitalize d-block mb-2">
                                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                                            </strong>
                                            <span className="badge bg-secondary">
                                                {selectedStudent?.studentNumber}
                                            </span>
                                            <small className="text-danger mt-3 d-block">This action cannot be undone.</small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                                            <i className="fa fa-trash me-2"></i>Yes, Delete
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

const DropdownItem = ({ icon, text, color, onClick, danger = false }) => (
    <button 
        className={`dropdown-item d-flex align-items-center px-3 py-2 border-0 bg-transparent w-100 text-start ${danger ? 'text-danger' : ''}`}
        onClick={onClick}
        style={{cursor: 'pointer'}}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
    >
        <i className={`fa fa-${icon} text-${color} me-2`} style={{width: '20px'}}></i>
        <span>{text}</span>
    </button>
);

export default StudentManagement;