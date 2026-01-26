import React, { useLayoutEffect, useState, useContext } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";

const ChangePassword = () => {
    const { setTextHeader, profile } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = "Current password is required";
        }

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = "New password is required";
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = "Please confirm your new password";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = "New password must be different from current password";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/change_password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }),
                credentials: "include",
            });

            const data = await res.json();
            
            if (!res.ok) {
                if (data.message.includes("current password")) {
                    setErrors({ currentPassword: data.message });
                } else {
                    throw new Error(data.message);
                }
                return;
            }

            showAlert(data.message || "Password changed successfully!", 'success');
            
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Navigate after showing alert
            setTimeout(() => {
                navigate(-1);
            }, 1500);
            
        } catch (error) {
            showAlert("Failed to change password: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setErrors({});
        navigate(-1);
    };

    if (!profile) {
        return (
            <div className="container mt-4">
                <div className="alert alert-info bg-info bg-opacity-10 border-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Loading profile data...
                </div>
            </div>
        );
    }

    
    return (
        <>
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-10">
                        <form onSubmit={handleSubmit}>
                            {/* Header */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <h4 className="fw-bold text-capitalize mb-1">Change Password</h4>
                                    <p className="text-muted mb-0">Update your account password</p>
                                </div>
                            </div>


                            {/* Password Change Form */}
                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-bold text-danger mb-0">Password Information</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        {/* Current Password */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Current Password <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type={showPasswords.current ? "text" : "password"}
                                                    name="currentPassword"
                                                    className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your current password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => togglePasswordVisibility('current')}
                                                >
                                                    <i className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                {errors.currentPassword && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.currentPassword}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                New Password <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    name="newPassword"
                                                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your new password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => togglePasswordVisibility('new')}
                                                >
                                                    <i className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                {errors.newPassword && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.newPassword}
                                                    </div>
                                                )}
                                            </div>
                                            <small className="text-muted">
                                                Password must be at least 6 characters long
                                            </small>
                                        </div>

                                        {/* Confirm New Password */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Confirm New Password <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    name="confirmPassword"
                                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Confirm your new password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                >
                                                    <i className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                {errors.confirmPassword && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.confirmPassword}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Tips */}
                            <div className="card shadow-sm border-0 mb-4 bg-light">
                                <div className="card-body p-3">
                                    <h6 className="fw-bold text-dark mb-2">
                                        <i className="fa-solid fa-shield-halved text-danger me-2"></i>
                                        Password Security Tips
                                    </h6>
                                    <ul className="small text-muted mb-0 ps-4">
                                        <li>Use at least 6 characters</li>
                                        <li>Mix uppercase and lowercase letters</li>
                                        <li>Include numbers and special characters</li>
                                        <li>Avoid common words or personal information</li>
                                        <li>Don't reuse passwords from other accounts</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-danger"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Changing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Change Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

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

export default ChangePassword;