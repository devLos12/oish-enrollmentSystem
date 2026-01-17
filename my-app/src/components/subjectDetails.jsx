import { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../context/global.jsx";

const SubjectDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const subjectId = location?.state?.subjectId;
    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { setTextHeader } = useContext(globalContext);
    
    // Section modal states
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedSection, setSelectedSection] = useState(null);
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);
    
    // Alert modal
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);        
    }, [location?.state?.title]);

    useEffect(() => {
        if (subjectId) {
            getSubjectDetails();
        }
    }, [subjectId]);

    
    useEffect(() => {
        if (subjectData?.gradeLevel && subjectData?.strand && subjectData?.track && subjectData?.semester) {
            fetchAvailableSections();
        }
    }, [subjectData?.gradeLevel, subjectData?.strand, subjectData?.track, subjectData?.semester]);





    const getSubjectDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSubjectDetails/${subjectId}`, {
                method: "GET",
                credentials: "include"
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            if (data.success) {
                setSubjectData(data.data);
                console.log(data);
            }
        } catch (error) {
            console.log("Error: ", error.message);
            showAlert("Failed to load subject details", 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSections = async () => {
        try {
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSubjetSections?gradeLevel=${subjectData.gradeLevel}&track=${subjectData.track}&strand=${subjectData.strand}&semester=${subjectData.semester}}&subjectId=${subjectId}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAvailableSections(data);
        } catch (error) {
            console.error("Error fetching sections:", error.message);
            showAlert("Failed to load sections", 'error');
            setAvailableSections([]);
        } finally {
            setLoadingSections(false);
        }
    };


    const handleAddSection = () => {
        setSelectedSection({
            sectionName: '',
            scheduleDay: '',
            scheduleStartTime: '',
            scheduleEndTime: '',
            room: '',
            gradeLevel: ''
        });
        setModalType('add');
        setShowSectionModal(true);
    };

    const handleEditSection = (section) => {
        setSelectedSection({...section});
        setModalType('edit');
        setShowSectionModal(true);
    };

    const handleDeleteSection = (section) => {
        setSelectedSection(section);
        setModalType('delete');
        setShowSectionModal(true);
    };

    const handleViewStudents = (section) => {
        // navigate("/teacher/students", {
        //     state: {
        //         subjectId: subjectId,
        //         sectionId: section.sectionId
        //     }
        // });
    };

    const handleSubmitSection = async () => {
        if (
            !selectedSection.sectionName?.trim() ||
            !selectedSection.scheduleDay ||
            !selectedSection.scheduleStartTime ||
            !selectedSection.scheduleEndTime ||
            !selectedSection.room?.trim()
        ) {
            showAlert("All fields are required!", 'error');
            return;
        }
        
       

        try {
            const url = modalType === 'add' 
                ? `${import.meta.env.VITE_API_URL}/api/addSubjectSection/${subjectId}`
                : `${import.meta.env.VITE_API_URL}/api/updateSubjectSection/${subjectId}/${selectedSection._id}`;
            
            const method = modalType === 'add' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectionName: selectedSection.sectionName,
                    scheduleDay: selectedSection.scheduleDay,
                    scheduleStartTime: selectedSection.scheduleStartTime,
                    scheduleEndTime: selectedSection.scheduleEndTime,
                    room: selectedSection.room,
                    gradeLevel: subjectData.gradeLevel

                }),
                credentials: "include",
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(data.message, 'success');
            setShowSectionModal(false);
            getSubjectDetails();
        } catch (error) {
            console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} section:`, error.message);
            showAlert(`Failed to ${modalType === 'add' ? 'add' : 'update'} section: ${error.message}`, 'error');
        }
    };




    const confirmDeleteSection = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/deleteSubjectSection/${subjectId}/${selectedSection._id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert("Section deleted successfully!", 'success');
            setShowSectionModal(false);
            getSubjectDetails();
        } catch (error) {
            console.error("Error deleting section:", error.message);
            showAlert("Failed to delete section", 'error');
        }
    };

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    const formatTime12Hour = (time24) => {
        if (!time24) return 'N/A';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSections = subjectData?.sections?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const totalPages = Math.ceil((subjectData?.sections?.length || 0) / itemsPerPage);

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

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading subject details...</p>
                </div>
            </div>
        );
    }

    if (!subjectData) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">Subject not found</div>
            </div>
        );
    }

    return (
        <>
            <div className="container py-4">
                {/* Subject Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <h4 className="fw-bold mb-1 text-capitalize">{subjectData.subjectName}</h4>
                                <p className="text-muted mb-2">
                                    <span className="badge bg-info me-2">{subjectData.subjectCode}</span>
                                    <span className="badge bg-danger me-2">{subjectData.strand}</span>
                                </p>
                                <p className="mb-0 gap-2 d-flex">
                                    <strong>Teacher:</strong> {subjectData.teacher} 
                                </p>
                                <span className="fw-semibold">Grade {subjectData.gradeLevel} - Semester {subjectData.semester}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0">Sections ({subjectData.sections?.length || 0})</h5>
                                    <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={handleAddSection}
                                    >
                                        <i className="fa fa-plus me-2"></i>
                                        Add Section
                                    </button>
                                </div>
                                
                                {subjectData.sections && subjectData.sections.length > 0 ? (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Section Name</th>
                                                        <th>Schedule</th>
                                                        <th>Time</th>
                                                        <th>Room</th>
                                                        <th>Total Students</th>
                                                        <th className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentSections.map((section, index) => (
                                                        <tr key={index}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle fw-semibold">{section.sectionName}</td>
                                                            <td className="align-middle">{section.scheduleDay || 'N/A'}</td>
                                                            <td className="align-middle">
                                                                {formatTime12Hour(section.scheduleStartTime)} - {formatTime12Hour(section.scheduleEndTime)}
                                                            </td>
                                                            <td className="align-middle text-capitalize">{section.room || 'N/A'}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-info">
                                                                    {section.students?.length || 0}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    {/* <button 
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleViewStudents(section)}
                                                                        title="View Students"
                                                                    >
                                                                        <i className="fa fa-users"></i>
                                                                    </button> */}
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => handleEditSection(section)}
                                                                        title="Edit"
                                                                    >
                                                                        <i className="fa fa-edit"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleDeleteSection(section)}
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

                                        {totalPages > 1 && (
                                            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                                <div className="text-muted small">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, subjectData.sections.length)} of {subjectData.sections.length} entries
                                                </div>
                                                <nav>
                                                    <ul className="pagination mb-0">
                                                        {renderPagination()}
                                                    </ul>
                                                </nav>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fa fa-folder-open fa-3x text-muted mb-3"></i>
                                        <p className="text-muted mb-0">No sections available for this subject.</p>
                                        <button 
                                            className="btn btn-sm btn-outline-danger mt-3"
                                            onClick={handleAddSection}
                                        >
                                            <i className="fa fa-plus me-2"></i>
                                            Add First Section
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>  
                </div>
            </div>

            {/* Section Modal */}
            {showSectionModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className={`modal-dialog modal-dialog-centered ${modalType !== 'delete' && 'modal-lg'}`}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'add' && 'Add New Section'}
                                    {modalType === 'edit' && 'Edit Section'}
                                    {modalType === 'delete' && 'Delete Section'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowSectionModal(false)}
                                ></button>
                            </div>

                            {(modalType === 'add' || modalType === 'edit') && (
                                <>
                                    <div className="modal-body">
                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <label className="form-label text-capitalize fw-bold">
                                                    Section Name
                                                    {loadingSections && (
                                                        <span className="spinner-border spinner-border-sm ms-2" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </span>
                                                    )}
                                                </label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSection?.sectionName || ''}
                                                    onChange={(e) => setSelectedSection({...selectedSection, sectionName: e.target.value})}
                                                    disabled={loadingSections}
                                                >
                                                    <option value="">Select Section</option>
                                                    {availableSections.map(section => (
                                                        <option key={section._id} value={section.name}>
                                                            {section.name} ({section.students?.length || 0}/{section.maxCapacity})
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableSections.length === 0 && !loadingSections && (
                                                    <small className="text-warning d-block mt-1">
                                                        <i className="fa fa-exclamation-triangle me-1"></i>
                                                        No sections available for this combination
                                                    </small>
                                                )}
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <label className="form-label text-capitalize fw-bold">Schedule & Room</label>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Day</label>
                                                <select 
                                                    className="form-select"
                                                    value={selectedSection?.scheduleDay || ''}
                                                    onChange={(e) => setSelectedSection({...selectedSection, scheduleDay: e.target.value})}
                                                >
                                                    <option value="">Select Day</option>
                                                    {dayOptions.map(day => (
                                                        <option key={day} value={day}>{day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Room</label>
                                                <input 
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. Room 101"
                                                    value={selectedSection?.room || ''}
                                                    onChange={(e) => setSelectedSection({...selectedSection, room: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Start Time</label>
                                                <input 
                                                    type="time"
                                                    className="form-control"
                                                    value={selectedSection?.scheduleStartTime || ''}
                                                    onChange={(e) => setSelectedSection({...selectedSection, scheduleStartTime: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">End Time</label>
                                                <input 
                                                    type="time"
                                                    className="form-control"
                                                    value={selectedSection?.scheduleEndTime || ''}
                                                    onChange={(e) => setSelectedSection({...selectedSection, scheduleEndTime: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowSectionModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleSubmitSection}
                                        >
                                            <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                                            {modalType === 'add' ? 'Add Section' : 'Update Section'}
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
                                            Do you really want to delete section <strong>{selectedSection?.sectionName}</strong>?
                                            <br/>This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowSectionModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={confirmDeleteSection}
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

            {/* Alert Modal */}
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

export default SubjectDetails;