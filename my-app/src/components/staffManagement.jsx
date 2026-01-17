import React, { useContext, useLayoutEffect, useState, useEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";

const StaffManagement = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();
    
    const [staffList, setStaffList] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'view', 'edit', 'delete'

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success'); // 'success' or 'error'

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStaff = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    // Fetch staff data
    useEffect(() => {
        fetchStaffData();
    }, []);

    // Search filter
    useEffect(() => {
        const filtered = staffList.filter(staff => 
            staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStaff(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm, staffList]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    const fetchStaffData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff_list`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setStaffList(data);
            setFilteredStaff(data);
        } catch (error) {
            console.error("Error fetching staff:", error.message);
            showAlert("Failed to load staff data", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewStaff = (staff) => {
        setSelectedStaff(staff);
        setModalType('view');
        setShowModal(true);
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        setModalType('edit');
        setShowModal(true);
    };

    const handleDeleteStaff = (staff) => {
        setSelectedStaff(staff);
        setModalType('delete');
        setShowModal(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff_delete/${selectedStaff._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert("Staff member deleted successfully!", 'success');
            fetchStaffData(); // Refresh list
        } catch (error) {
            console.error("Error deleting staff:", error.message);
            showAlert("Failed to delete staff member", 'error');
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff_update/${selectedStaff._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: selectedStaff.firstName,
                    lastName: selectedStaff.lastName,
                    email: selectedStaff.email
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert("Staff member updated successfully!", 'success');
            fetchStaffData(); // Refresh list
        } catch (error) {
            console.error("Error updating staff:", error.message);
            showAlert("Failed to update staff member", 'error');
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
            <div className="container-fluid py-4 g-0 g-md-5 ">
                {/* Header Section */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="text-capitalize fw-bold mb-1">faculty member</h4>
                                <p className="text-muted small mb-0">Manage all faculty members</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="row mb-3">
                    <div className="col-12 col-md-6">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-6 text-end">
                        <p className="text-muted mb-0 mt-2">
                            Total Staff: <strong>{filteredStaff.length}</strong>
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2">Loading teacher data...</p>
                                    </div>
                                ) : filteredStaff.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No teacher members found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="text-capitalize fw-semibold">#</th>
                                                        <th className="text-capitalize fw-semibold">Teacher's Name</th>
                                                        <th className="text-capitalize fw-semibold">Email</th>
                                                        <th className="text-capitalize fw-semibold">Created At</th>
                                                        <th className="text-capitalize fw-semibold text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentStaff.map((staff, index) => (
                                                        <tr key={staff._id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="text-capitalize fw-semibold">
                                                                    {staff.firstName} {staff.lastName}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">{staff.email}</td>
                                                            <td className="align-middle text-muted small">
                                                                {formatDate(staff.createdAt)}
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleViewStaff(staff)}
                                                                        title="View Details"
                                                                    >
                                                                        <i className="fa fa-eye"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => handleEditStaff(staff)}
                                                                        title="Edit"
                                                                    >
                                                                        <i className="fa fa-edit"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleDeleteStaff(staff)}
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

                                        {/* Pagination */}
                                        {totalPages > 0 && (
                                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                                <div className="text-muted small">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStaff.length)} of {filteredStaff.length} entries
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

            {/* View/Edit/Delete Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'view' && 'Staff Details'}
                                    {modalType === 'edit' && 'Edit Staff Member'}
                                    {modalType === 'delete' && 'Delete Staff Member'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            {/* View Modal */}
                            {modalType === 'view' && (
                                <div className="modal-body">
                                    <div className="text-center mb-3">
                                        <div className="avatar bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                                            style={{width: '80px', height: '80px', fontSize: '32px'}}>
                                            {selectedStaff?.firstName.charAt(0)}{selectedStaff?.lastName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small text-uppercase">Full Name</label>
                                        <p className="fw-semibold text-capitalize">
                                            {selectedStaff?.firstName} {selectedStaff?.lastName}
                                        </p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small text-uppercase">Email Address</label>
                                        <p className="fw-semibold">{selectedStaff?.email}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small text-uppercase">Created At</label>
                                        <p className="fw-semibold">{formatDate(selectedStaff?.createdAt)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Edit Modal */}
                            {modalType === 'edit' && (
                                <form onSubmit={handleUpdateStaff}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize fw-bold">First Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={selectedStaff?.firstName || ''}
                                                onChange={(e) => setSelectedStaff({...selectedStaff, firstName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize fw-bold">Last Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={selectedStaff?.lastName || ''}
                                                onChange={(e) => setSelectedStaff({...selectedStaff, lastName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize fw-bold">Email</label>
                                            <input 
                                                type="email" 
                                                className="form-control"
                                                value={selectedStaff?.email || ''}
                                                onChange={(e) => setSelectedStaff({...selectedStaff, email: e.target.value})}
                                                required
                                            />
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
                                        <button type="submit" className="btn btn-warning">
                                            <i className="fa fa-save me-2"></i>
                                            Update Staff
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Delete Modal */}
                            {modalType === 'delete' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <p className="text-muted">
                                            Do you really want to delete <strong className="text-capitalize">
                                            {selectedStaff?.firstName} {selectedStaff?.lastName}</strong>?
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

export default StaffManagement;