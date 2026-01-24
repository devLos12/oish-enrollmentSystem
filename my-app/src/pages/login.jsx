import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { globalContext } from "../context/global.jsx";
import imageBackground from "../assets/image/shsBackground.jpg"; // Same background from Home




const Login = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const { setAdminAuth, setStaffAuth, setStudentAuth, setRole, setIsLoggingOut } = useContext(globalContext);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Error states for inputs
    const [identifierError, setIdentifierError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('success');
    const [loginData, setLoginData] = useState(null);

    // Handle modal animation
    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                    if (modalType === 'success' && loginData) {
                        handleNavigation();
                    }
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showModal]);

    const showNotification = (message, type = "success", role = null) => {
        setModalMessage(message);
        setModalType(type);
        
        if (role) {
            setLoginData({ role });
        }
        
        setShowModal(true);
    };

    const handleNavigation = () => {
        if (!loginData) return;
        
        switch(loginData.role) {
            case "staff":
                navigate("/staff", { replace: true });
                break;
            case "admin":
                navigate("/admin", { replace: true });
                break;
            case "student":
                navigate("/student", { replace: true });
                break;
            default:
                break;
        }
    };

    const handleForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        setIdentifierError('');
        setPasswordError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ 
                    identifier,
                    password
                }),
                credentials: "include", 
            });

            const data = await res.json();
            
            if(!res.ok) {
                if (data.showModal || data.verificationStatus) {
                    showNotification(data.message, "error");
                    setLoading(false);
                    return;
                }
                
                if (data.field === 'identifier' || data.field === 'email' || data.field === 'studentNumber') {
                    setIdentifierError(data.message || 'Invalid email or student number');
                } else if (data.field === 'password') {
                    setPasswordError(data.message || 'Invalid password');
                } else {
                    setIdentifierError(data.message || 'Login failed. Please check your credentials.');
                }
                setLoading(false);
                return;
            }

            setIsLoggingOut(false);
            
            switch(data.role) {
                case "staff":
                    setStaffAuth(true);
                    setRole(data.role);
                    break;
                case "admin":
                    setAdminAuth(true);
                    setRole(data.role);
                    break;
                case "student":
                    setStudentAuth(true);
                    setRole(data.role);
                    break;
                default:
                    break;
            }

            showNotification(data.message || 'Login successful!', 'success', data.role);

        } catch (error) {
            showNotification(error.message || 'Network error occurred', 'error');
            console.log("Error: ", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div 
                className="d-flex  position-relative"
                style={{
                    backgroundImage: `url(${imageBackground})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* Overlay - same opacity as Home */}
                <div 
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1}}
                ></div>

                {/* Content */}
                <div className="container position-relative" style={{zIndex: 2, marginTop: "50px"}}
                
                >
                    <div className="row py-5 justify-content-center "
                    >
                        {/* Login Form - Full Width */}
                        <div className="col-12 col-md-8 col-lg-5">
                            {/* Back Button */}
                            {/* <div className="px-2 mb-3 d-flex align-items-center gap-2 cursor"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fa fa-arrow-left text-white"></i>
                                <p className="m-0 text-capitalize fw-bold text-white">back</p>
                            </div> */}

                            {/* Login Card */}
                            <div className="card-body bg-white p-5 shadow-lg">
                                <p className="text-capitalize fs-5 fw-bold text-center text-danger">Login your account</p>

                                <form onSubmit={handleForm}>
                                    <div className="mt-5">
                                        <div className="d-flex align-items-center gap-1 my-2">
                                            <i className="fa-solid fa-user text-muted"></i>
                                            <label className="m-0 text-capitalize fw-bold text-muted">
                                                Email or Student Number
                                            </label>
                                        </div>

                                        <input 
                                            type="text" 
                                            placeholder="Enter Email or Student Number"
                                            value={identifier}
                                            onChange={(e) => {
                                                setIdentifier(e.target.value);
                                                setIdentifierError('');
                                            }}
                                            className={`form-control shadow-sm ${identifierError ? 'is-invalid border-danger' : ''}`}
                                            required
                                            disabled={loading}
                                        />
                                        {identifierError && (
                                            <small className="text-danger mt-1 d-block">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                {identifierError}
                                            </small>
                                        )}
                                    </div>

                                    <div className="mt-3">
                                        <div className="d-flex align-items-center gap-1 my-2">
                                            <i className="fa fa-lock text-muted"></i>
                                            <label className="m-0 text-capitalize fw-bold text-muted">Password</label>
                                        </div>

                                        <div className="position-relative">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter password" 
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setPasswordError('');
                                                }}
                                                required
                                                className={`form-control shadow-sm ${passwordError ? ' border-danger' : ''}`}
                                                style={{ paddingRight: "40px" }}
                                                disabled={loading}
                                            />
                                            <i 
                                                className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} position-absolute text-muted`}
                                                style={{
                                                    right: "15px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => setShowPassword(!showPassword)}
                                            ></i>
                                        </div>
                                        {passwordError && (
                                            <small className="text-danger mt-1 d-block">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                {passwordError}
                                            </small>
                                        )}
                                    </div>
                                    
                                    <button 
                                        className="btn btn-danger text-capitalize mt-4 w-100 shadow-lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Logging in...
                                            </>
                                        ) : (
                                            'Login'
                                        )}
                                    </button>
                                </form>
                                
                                <div className="mt-4">
                                    <p className="m-0 text-capitalize text-danger small"
                                        style={{cursor: "pointer"}}
                                        onClick={() => navigate('/forgot_password')}
                                    >
                                        Forgot password?
                                    </p>
                                </div>

                                <div className="mt-3 d-flex justify-content-center align-items-center gap-2 small cursor"
                                    onClick={() => navigate("/staff_registration")}
                                >
                                    Sign up for new Teacher account.
                                </div>

                                <div className="mt-2 d-flex justify-content-center align-items-center gap-2 small cursor"
                                    onClick={() => navigate("/enrollment/step1", { state: { allowed: true }})}
                                >
                                    Enroll now for student account.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success/Error Modal with Animation */}
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
                                {modalType === "success" ? "Login Successful!" : "Login Failed"}
                            </h5>
                            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{modalMessage}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Login;