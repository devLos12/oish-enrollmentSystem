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



    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(students.length / itemsPerPage);

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
                                    <div className="col-12">
                                        
                                        <p className="m-0 fs-4 fw-bold mb-1 text-capitalize">{subjectInfo.subjectName}</p>

                                    </div>
                                    <div className="col-12 d-flex gap-2 align-items-center  text-muted">
                                        <p className="m-0 text-capitalize fw-bold">subject code:</p>
                                        <p className="m-0 badge bg-info bg-opacity-10 text-info border-info border">{subjectInfo.subjectCode}</p>
                                    </div>

                                    <div className="col-6 mt-1 d-flex gap-2 align-items-center  text-muted">
                                        <p className="m-0 text-capitalize fw-bold">semester: </p>
                                        <p className="m-0 text-capitalize small badge bg-primary">{subjectInfo?.semester === 1 ? "First" : "Second"}</p>
                                    </div>

                                    <div className="col-6 mt-1 text-end text-muted">
                                        <strong>Total Students:</strong> {students.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Enrolled Students</h5>
                            </div>
                            
                            {students.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">No students enrolled yet</p>
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
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, students.length)} of {students.length} entries
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