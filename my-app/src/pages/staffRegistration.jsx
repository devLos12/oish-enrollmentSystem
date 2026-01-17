import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const StaffRegistration = () => {
    const location = useLocation();
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
        setPassword(newPassword);
        const error = validatePassword(newPassword);
        setPasswordError(error);
    };

    const handleForm = async (e) => {
        e.preventDefault();

        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
            alert(passwordValidationError);
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (!email.endsWith('@gmail.com')) {
            alert("Please use a Gmail address!");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff_registration`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ 
                    verificationCode, 
                    firstName, 
                    lastName, 
                    email, 
                    password 
                }),
                credentials: "include", 
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            alert(data.message);
            
            navigate("/login/admin-staff", { state: "admin staff", replace: true });

        } catch (error) {
            alert(error.message);
            console.log("Error: ", error.message);
        }
    }    

    return (
        <div className="container">
            <div className="row my-5 py-5 justify-content-center">
                <div className="col-12 col-md-5 col-lg-7 d-none d-md-block">
                    <div className="px-2 px-md-2 px-lg-5 d-flex align-items-center gap-2 cursor"
                    onClick={()=> navigate(-1)}
                    >
                        <i className="fa fa-arrow-left text-danger"></i>
                        <p className="m-0 text-capitalize fw-bold text-danger">back</p>
                    </div>
                    <div className="p-2 p-md-2 p-lg-5">
                        <p className="m-0 text-capitalize fs-1 fw-bold">admin staff registration</p>
                        <p className="m-0 text-capitalize">create your account to become a faculty staff member.</p>
                    </div>
                </div>
                <div className="col-12 col-md-7 col-lg-5">
                    <div className="card-body bg-light p-5 rounded-4 shadow">
                        <p className="text-capitalize fs-5 fw-bold text-center text-danger">register as staff</p>

                        <form action="#" onSubmit={handleForm}>
                            {/* Verification Code */}
                            <div className="mt-4">
                                <div className="d-flex align-items-center gap-1 my-2">
                                    <i className="fa fa-shield text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">verification code:</label>
                                    <p className="small m-0 text-danger fw-semibold ms-1">*  Required</p>
                                </div>
                                <input type="text" 
                                placeholder="Enter verification code" 
                                value={verificationCode}
                                onChange={(e)=>setVerificationCode(e.target.value)}
                                className="form-control shadow-sm"
                                required
                                />
                                <small className="text-muted">*Requested from IT Admin.</small>

                            </div>

                            {/* First Name */}
                            <div className="mt-2">
                                <div className="d-flex align-items-center gap-1 my-2">
                                    <i className="fa fa-user text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">first name:</label>
                                </div>
                                <input type="text" 
                                placeholder="Enter first name" 
                                value={firstName}
                                onChange={(e)=>setFirstName(e.target.value)}
                                className="form-control shadow-sm"
                                required
                                />
                            </div>


                            {/* Last Name */}
                            <div className="mt-2">
                                <div className="d-flex align-items-center gap-1 my-2">
                                    <i className="fa fa-user text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">last name:</label>
                                </div>
                                <input type="text" 
                                placeholder="Enter last name" 
                                value={lastName}
                                onChange={(e)=>setLastName(e.target.value)}
                                className="form-control shadow-sm"
                                required
                                />
                            </div>


                            {/* Email */}
                            <div className="mt-2">
                                <div className="d-flex align-items-center gap-1 my-2">
                                    <i className="fa fa-envelope text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">email address:</label>
                                </div>
                                <input type="email" 
                                placeholder="yourname@gmail.com" 
                                value={email}
                                onChange={(e)=>setEmail(e.target.value)}
                                className="form-control shadow-sm"
                                required
                                />
                                <small className="text-muted">*Should be a Gmail account.</small>
                            </div>


                            {/* Password */}
                            <div className="mt-2">
                                <div className="d-flex align-items-center gap-1 my-2" 
                                >
                                    <i className="fa fa-lock text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">password:</label>
                                </div>
                                <div className="position-relative "
                                style={{zIndex: 1}}
                                >
                                    <input type={showPassword ? "text" : "password"}
                                    placeholder="Enter password" 
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="form-control shadow-sm"/>
                                    <i 
                                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted cursor`}
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
                            <div className="mt-2">
                                <div className="d-flex align-items-center gap-1 my-2">
                                    <i className="fa fa-lock text-muted"></i>
                                    <label className="m-0 text-capitalize fw-bold text-muted">confirm password:</label>
                                </div>
                                <div className="position-relative">
                                    <input type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="form-control shadow-sm"/>
                                    <i 
                                        className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute text-muted cursor`}
                                        style={{right: '15px', top: '50%', transform: 'translateY(-50%)', 
                                        }}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    ></i>
                                </div>
                            </div>
                            
                            <button className="btn btn-danger text-capitalize mt-4 w-100 shadow-lg">register</button>
                        </form>
                        
                        <div className="mt-3 d-flex justify-content-center align-items-center gap-2 small">
                            <p className="m-0 text-capitalize">already have an account?</p>
                            <p className="m-0 text-capitalize text-danger fw-bold cursor"
                            onClick={()=> navigate("/login/admin-staff", { state: "staff" })}
                            >login now.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StaffRegistration;