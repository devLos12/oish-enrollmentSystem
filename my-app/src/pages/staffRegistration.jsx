import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StaffRegistration = () => {
    const navigate = useNavigate();
    const [verificationCode, setVerificationCode] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [middleName, setMiddleName] = useState('');
    const [suffix, setSuffix] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('success');

    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                    if (modalType === 'success') {
                        navigate("/login", { replace: true });
                    }
                }, 300);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showModal, modalType, navigate]);

    const showNotification = (message, type = "success") => {
        setModalMessage(message);
        setModalType(type);
        setShowModal(true);
    };

    const validatePassword = (pwd) => {
        if (pwd.length < 8) return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
        if (!/\d/.test(pwd)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character";
        return "";
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordError(validatePassword(newPassword));
    };

    const handleForm = async (e) => {
        e.preventDefault();
        setLoading(true);

        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
            showNotification(passwordValidationError, "error");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match!", "error");
            setLoading(false);
            return;
        }

        if (!email.endsWith('@gmail.com')) {
            showNotification("Please use a Gmail address!", "error");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff_registration`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    verificationCode,
                    firstName,
                    middleName,
                    lastName,
                    suffix,
                    email,
                    password
                }),
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                showNotification(data.message, "error");
                setLoading(false);
                return;
            }

            showNotification(data.message || 'Registration successful!', 'success');

        } catch (error) {
            showNotification(error.message || 'Network error occurred', 'error');
            console.log("Error: ", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="container bg-light min-vh-100">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-12 col-lg-10">
                        <div className="p-0 p-md-4 mt-5">
                            <div className="card border-0 rounded-0 shadow-sm my-5">
                                <div className="card-body p-4">
                                    <h2 className="h5 fw-bold text-danger text-uppercase text-center mb-4">
                                        register as faculty member
                                    </h2>

                                    <form onSubmit={handleForm}>

                                        {/* Section 1: Personal Information */}
                                        <p className="fw-bold text-muted text-uppercase small border-bottom pb-1 mb-3">
                                            Personal Information
                                        </p>

                                        {/* Row 1: First Name | Middle Name */}
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-user text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">first name:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>

                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter first name"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-user text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">middle name:</label>
                                                    <span className="small text-muted ms-1">(optional)</span>

                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter middle name"
                                                    value={middleName}
                                                    onChange={(e) => setMiddleName(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Last Name | Suffix */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-user text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">last name:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter last name"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-user text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">suffix:</label>
                                                    <span className="small text-muted ms-1">(optional)</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Jr., Sr., II, III, MD, PhD, CPA, Esq."
                                                    value={suffix}
                                                    onChange={(e) => setSuffix(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {/* Section 2: Verification & Security */}
                                        <p className="fw-bold text-muted text-uppercase small border-bottom pb-1 mb-3">
                                            Verification & Security 
                                        </p>

                                        {/* Row 3: Verification Code | Email */}
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-shield text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">verification code:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter verification code"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    required
                                                    disabled={loading}
                                                />
                                                <small className="text-muted">*Requested from IT Admin.</small>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-envelope text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">email address:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>
                                                </div>
                                                <input
                                                    type="email"
                                                    placeholder="yourname@gmail.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="form-control shadow-sm"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 4: Password | Confirm Password */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-lock text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">password:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>
                                                </div>
                                                <div className="position-relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter password"
                                                        value={password}
                                                        onChange={handlePasswordChange}
                                                        required
                                                        className="form-control shadow-sm"
                                                        disabled={loading}
                                                    />
                                                    <i
                                                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted`}
                                                        style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
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
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center gap-1 mb-2">
                                                    <i className="fa fa-lock text-muted"></i>
                                                    <label className="m-0 text-capitalize fw-bold text-muted small">confirm password:</label>
                                                    <span className="small text-danger fw-semibold ms-1">*</span>
                                                </div>
                                                <div className="position-relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Re-enter password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        className="form-control shadow-sm"
                                                        disabled={loading}
                                                    />
                                                    <i
                                                        className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted`}
                                                        style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    ></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Register Button - full width */}
                                        <button
                                            className="btn btn-danger text-capitalize w-100 shadow-sm"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Registering...
                                                </>
                                            ) : (
                                                'Register'
                                            )}
                                        </button>

                                        {/* Login Link */}
                                        <div className="mt-3 d-flex justify-content-center align-items-center gap-2 small">
                                            <p className="m-0 text-capitalize">already have an account?</p>
                                            <p
                                                className="m-0 text-capitalize text-danger fw-bold"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate("/login")}
                                            >
                                                login now.
                                            </p>
                                        </div>

                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Modal */}
            {showModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000 }}
                >
                    <div
                        className="bg-white rounded-4 shadow-lg text-center"
                        style={{
                            maxWidth: "350px",
                            width: "90%",
                            transform: isModalVisible ? "scale(1)" : "scale(0.7)",
                            opacity: isModalVisible ? 1 : 0,
                            transition: "all 0.3s ease-in-out",
                            padding: "2rem 1.5rem"
                        }}
                    >
                        <div className="mb-3">
                            {modalType === "success" ? (
                                <div
                                    className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    style={{ width: "80px", height: "80px" }}
                                >
                                    <i className="fa fa-check-circle text-success" style={{ fontSize: "50px" }}></i>
                                </div>
                            ) : (
                                <div
                                    className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                                    style={{ width: "80px", height: "80px" }}
                                >
                                    <i className="fa fa-exclamation-circle text-danger" style={{ fontSize: "50px" }}></i>
                                </div>
                            )}
                        </div>
                        <h5 className={`fw-bold mb-2 ${modalType === "success" ? "text-success" : "text-danger"}`}>
                            {modalType === "success" ? "Registration Successful!" : "Registration Failed"}
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{modalMessage}</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default StaffRegistration;