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


    // Add Faculty states - ilagay mo to after const [modalType, setModalType] = useState('');
    const [newStaff, setNewStaff] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);




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



    // 🔄 REFRESH STAFF TABLE
    const handleRefreshStaff = async () => {
        // Close all modals
        setShowModal(false);
        setShowAlertModal(false);
        
        setLoading(true);
        
        try {
            await fetchStaffData();
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };


    const validatePassword = (pwd) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (pwd.length < minLength) {
            return "Password must be at least 8 characters long";
        }
        if (!hasUpperCase) {
            return "Password must contain at least one uppercase letter";
        }
        if (!hasLowerCase) {
            return "Password must contain at least one lowercase letter";
        }
        if (!hasNumber) {
            return "Password must contain at least one number";
        }
        if (!hasSpecialChar) {
            return "Password must contain at least one special character";
        }
        return "";
    };



    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setNewStaff({...newStaff, password: newPassword});
        const error = validatePassword(newPassword);
        setPasswordError(error);
    };

    const handleAddStaff = () => {
        setNewStaff({
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setPasswordError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setModalType('add');
        setShowModal(true);
    };

    const handleSubmitNewStaff = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        const passwordValidationError = validatePassword(newStaff.password);
        if (passwordValidationError) {
            showAlert(passwordValidationError, "error");
            setSubmitLoading(false);
            return;
        }

        if (newStaff.password !== newStaff.confirmPassword) {
            showAlert("Passwords do not match!", "error");
            setSubmitLoading(false);
            return;
        }

        if (!newStaff.email.endsWith('@gmail.com')) {
            showAlert("Please use a Gmail address!", "error");
            setSubmitLoading(false);
            return;
        }

        const dataPost = {
            firstName: newStaff.firstName,
            middleName: newStaff.middleName,
            lastName: newStaff.lastName,
            email: newStaff.email,
            password: newStaff.password
        }


        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/create_facultyAccount`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(dataPost),
                credentials: "include", 
            });

            const data = await res.json();
            
            if(!res.ok) {
                showAlert(data.message, "error");
                setSubmitLoading(false);
                return;
            }
            
            setShowModal(false);
            showAlert(data.message || 'Faculty member added successfully!', 'success');
            fetchStaffData();

        } catch (error) {
            showAlert(error.message || 'Network error occurred', 'error');
            console.log("Error: ", error.message);
        } finally {
            setSubmitLoading(false);
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
                    middleName: selectedStaff.middleName,  // Add this line
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
                <div className="row mb-3">
                    <div className="col-12">
                        <h4 className="text-capitalize fw-bold mb-1">faculty member</h4>
                        <p className="text-muted small mb-0">Manage all faculty members</p>
                    </div>
                </div>




                {/* Search Bar */}
                <div className="row mb-4">
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
                    <div className="col-12 col-md-6 mt-2 mt-md-0 d-flex justify-content-start justify-content-md-end bg0 gap-2">
                        <button 
                            className="btn btn-danger btn-sm"
                            onClick={handleAddStaff}
                        >
                            <i className="fa fa-plus me-2"></i>Add Faculty Member
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleRefreshStaff}
                            title="Refresh staff list"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="fa fa-refresh"></i>
                            )}
                        </button>
                    </div>

                    <div className="col-12 mt-2 d-flex justify-content-start justify-content-md-end gap-2">
                        <p className="text-muted mb-0 text-capitalize">
                            Total: <strong>{filteredStaff.length}</strong>
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
                                                                    {staff.firstName}
                                                                     {`${staff.middleName ? ` ${staff.middleName.charAt(0)}. ` : " "}`} 
                                                                     {staff.lastName}
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
                    <div className="modal-dialog modal-dialog-centered modal-lg">
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
                                            {selectedStaff?.firstName} {selectedStaff?.middleName} {selectedStaff?.lastName}
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
                                            <label className="form-label text-capitalize fw-bold">Middle Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={selectedStaff?.middleName || ''}
                                                onChange={(e) => setSelectedStaff({...selectedStaff, middleName: e.target.value})}
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




                            {/* Add Modal */}
                            {modalType === 'add' && (
                                <form onSubmit={handleSubmitNewStaff}>
                                    
                                    <div className="modal-body">
                                     
                                        <h6 className="text-danger text-uppercase fw-bold mb-3 text-center">
                                            Register as faculty member
                                        </h6>
                                        
                                        <div className="row">
                                            {/* Left Column */}
                                            <div className="col-md-6">
                                                {/* First Name */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-user text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">first name:</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter first name" 
                                                        value={newStaff.firstName}
                                                        onChange={(e) => setNewStaff({...newStaff, firstName: e.target.value})}
                                                        className="form-control shadow-sm"
                                                        required
                                                        disabled={submitLoading}
                                                    />
                                                </div>

                                                {/* Middle Name */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-user text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">middle name:</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter middle name" 
                                                        value={newStaff.middleName}
                                                        onChange={(e) => setNewStaff({...newStaff, middleName: e.target.value})}
                                                        className="form-control shadow-sm"
                                                        required
                                                        disabled={submitLoading}
                                                    />
                                                </div>

                                                {/* Last Name */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-user text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">last name:</label>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter last name" 
                                                        value={newStaff.lastName}
                                                        onChange={(e) => setNewStaff({...newStaff, lastName: e.target.value})}
                                                        className="form-control shadow-sm"
                                                        required
                                                        disabled={submitLoading}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="col-md-6 border-start">
                                                {/* Email */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-envelope text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">email address:</label>
                                                    </div>
                                                    <input 
                                                        type="email" 
                                                        placeholder="yourname@gmail.com" 
                                                        value={newStaff.email}
                                                        onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                                                        className="form-control shadow-sm"
                                                        required
                                                        disabled={submitLoading}
                                                    />
                                                </div>

                                                {/* Password */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-lock text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">password:</label>
                                                    </div>
                                                    <div className="position-relative">
                                                        <input 
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter password" 
                                                            value={newStaff.password}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className="form-control shadow-sm"
                                                            disabled={submitLoading}
                                                        />
                                                        <i 
                                                            className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted`}
                                                            style={{right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer'}}
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        ></i>
                                                    </div>
                                                    {passwordError && (
                                                        <small className="text-danger d-block mt-1">{passwordError}</small>
                                                    )}
                                                    <small className="text-muted d-block mt-1">
                                                        Password must contain: 8+ characters, uppercase, lowercase, number, and special character
                                                    </small>
                                                </div>

                                                {/* Confirm Password */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center gap-1 mb-2">
                                                        <i className="fa fa-lock text-muted"></i>
                                                        <label className="m-0 text-capitalize fw-bold text-muted small">confirm password:</label>
                                                    </div>
                                                    <div className="position-relative">
                                                        <input 
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="Re-enter password" 
                                                            value={newStaff.confirmPassword}
                                                            onChange={(e) => setNewStaff({...newStaff, confirmPassword: e.target.value})}
                                                            required
                                                            className="form-control shadow-sm"
                                                            disabled={submitLoading}
                                                        />
                                                        <i 
                                                            className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted`}
                                                            style={{right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer'}}
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        ></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={submitLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-danger"
                                            disabled={submitLoading}
                                        >
                                            {submitLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-save me-2"></i>
                                                    Register Faculty
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
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