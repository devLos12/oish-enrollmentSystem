import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";




const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [verifyCode, setVerifyCode] = useState("");

    const [isLoading, setIsLoading] = useState({
        forgot: false,
        verify: false,
        changePass: false
    });

    const [message, setMessage] = useState({
        success: "",
        error: ""
    });
    const [verifyMessage, setVerifyMessage] = useState("")
    const navigate = useNavigate();
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verified, setVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [changepassSuccess, setChangePassSuccess] = useState('');
    const [loadingChange, setLoadingChange] = useState(false);



    useEffect(() => {
        let timer;

        if(verified) return


        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }else if (cooldown === 0 && sent ){
            setSent(false);
            setVerifyCode("");
            setVerifyMessage("");
        }    

        return () => clearTimeout(timer);
    }, [cooldown, sent, verified]);



    
    const handleRequestCode = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage("Please enter your email address");
            return;
        }

        setIsLoading((prev) => ({...prev, forgot: true, verify: false }));
        setMessage("");
        setChangePassSuccess("")


        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requestCode`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if(!response.ok) throw new Error(data.message);
            

            setTimeout(() => {
                setMessage((prev) => ({...prev, 
                    success: data.message, 
                    error: "" 
                })); 
                setIsLoading((prev) => ({...prev, forgot: false, verify: false }));
                setSent(true);


                const now = Date.now();
                const remainingTime = Math.max(Math.floor((data.cooldown - now) / 1000), 0);
                setCooldown(remainingTime);

            }, 1500);


        } catch (error) {
            setTimeout(() => {

                setMessage((prev) => ({...prev, 
                    success: "", 
                    error: `Error: ${error.message}` 
                }));
                setChangePassSuccess("");

                setIsLoading((prev) => ({...prev, forgot: false, verify: false }));
                setSent(false);
            }, 1500);

        } 
    };


    const handleResetPassword = async() => {
        if (!email || !verifyCode) {
            setMessage("Please enter both email and verification code");
            return;
        }

        setIsLoading((prev) => ({...prev, verify: true, forgot: false }));
        setVerifyMessage("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verifyCode`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ email, verifyCode })
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

           
            setTimeout(() => {
                setVerified(true);

                setMessage((prev) => ({...prev, 
                    success: "", 
                    error: "" 
                })); 
                

                setVerifyMessage(`${data.message} change your password now.`);
                setIsLoading((prev) => ({...prev, verify: false, forgot: false }));

            }, 1500);


        } catch (error) {
            setTimeout(() => {
                setVerifyMessage(error.message);
                setIsLoading((prev) => ({...prev, verify: false, forgot: false }));
            }, 1500);

        }
    };




    const handleChangePassword = async(e) => {
        e.preventDefault();
        setPasswordError({ newPassword: '', confirmPassword: '' });
        

        // // Validation
        if (!newPassword) {
            setPasswordError(prev => ({ ...prev, newPassword: 'New password is required' }));
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
            return;
        }

        if (!confirmPassword) {
            setPasswordError(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        setLoadingChange(true);


        try {
            // Your API call here

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/changePassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email, newPassword, confirmPassword})
            })

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);


            setTimeout(()=> {
                setVerified(false);
                setVerifyMessage("");
                setLoadingChange(false);
                setCooldown(0);
                setMessage((prev) => ({...prev, success: "", error: ""}));
                setEmail("");
                setVerifyCode("");
                setNewPassword("");
                setConfirmPassword("");
                setChangePassSuccess(`${data.message}`);
            }, 1500);


        } catch (error) {
            setTimeout(()=> {
                setVerifyMessage("");
                setLoadingChange(false);
                setNewPassword("");
                setConfirmPassword("");
                setChangePassSuccess(`${error.message}. pls try again.`);
            }, 1500);
            console.log("Error: ", error.message);
        }
    }


    return (
        <div className="container vh-100">
            <div className="row justify-content-center"
            style={{ marginTop: "120px"}}
            >
                <div className="col-12 col-md-6 col-lg-7 d-none d-md-block">
                    <div className="px-2 px-md-2 px-lg-5 d-flex align-items-center gap-2 cursor"
                    onClick={()=> navigate(-1)}
                    >
                        <i className="fa fa-arrow-left text-danger "></i>
                        <p className="m-0 text-capitalize fw-bold text-danger">back</p>
                    </div>

                    
                    <div className="p-2 p-md-2 p-lg-5">
                        <p className="m-0 text-capitalize fw-bold text-muted mb-2 fs-1">forgot password?.</p>
                        <p className="m-0 text-capitalize mb-2 fw-semibold">request a code to change your password.</p>
                        <p className="m-0 text-capitalize text-muted small">
                            make sure your gmail account is linked to your account.
                        </p>
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-5">

                    { message?.success  && (
                        <div className={`alert ${cooldown > 0 ? "alert-success text-success" : "alert-danger"} 
                        mt-3 small`}>

                            {cooldown > 0 ? (
                                <>
                                    {message?.success}

                                    <p className="fw-bold m-0 mt-1 text-capitalize ">
                                        {`Expiration left: ${cooldown}`}
                                    </p>
                                </>
                            ) : (
                                 <p className="fw-bold m-0 mt-1 text-capitalize text-danger">
                                    {`Verification code expired! request again.`}
                                </p>
                            )}
                        </div>
                    )}


                    { message?.error  && (
                        <div className={`alert alert-danger mt-3`}>
                            <p className="fw-bold m-0 small mt-1 text-capitalize text-danger">
                                {message?.error}
                            </p>
                        </div>
                    )}

                    {verifyMessage && (
                        <div className={`alert mt-3 
                            ${verifyMessage.includes("Verified") ? "alert-success" : "alert-danger"} `}>
                            <p className={`fw-bold m-0 small mt-1 text-capitalize 
                                ${verifyMessage.includes("Verified") ? "text-success" : "text-danger"}
                                `}>
                                {verifyMessage}
                            </p>
                        </div>
                    )}


                    {changepassSuccess && (
                        <div className={`alert alert-success mt-3 
                            ${changepassSuccess.includes("changed") ? "alert-success" : "alert-danger"}`}>
                            <p className={`fw-bold m-0 small mt-1 text-capitalize 
                                ${changepassSuccess.includes("changed") ? "text-success" : "text-danger"}`}>
                                {changepassSuccess}
                            </p>
                        </div>
                    )}
              

                    <div className="card p-4 d-flex flex-column gap-4 mt-4">
                        <form action="#" onSubmit={handleRequestCode}>
                            <div className="d-flex flex-column gap-2">
                                <div className="align-items-center d-flex gap-2 text-muted">
                                    <i className="fa fa-envelope "></i>
                                <label className="text-capitalize  fw-bold">email address: </label>
                                </div>
                                <div className="d-flex gap-2">
                                    <input 
                                        type="email" 
                                        className={`form-control bg-opacity-10
                                            ${ sent ? "bg-secondary" : "bg-light"}`} 
                                        placeholder="Type Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading?.forgot || sent}
                                        required
                                    />
                                    
                                    <button 
                                        className={`m-0 border-0 p-1 text-capitalize text-white small rounded-3 bg-danger 
                                        ${ sent || isLoading?.forgot  ? "bg-opacity-50" : "bg-opacity-100"}`}
                                        style={{width: "100px"}}
                                        disabled={isLoading?.forgot || sent}
                                    >
                                        {isLoading?.forgot ? "Sending.." : 
                                        sent ? "Sent"  : "request"}
                                    </button>
                                </div>
                                <small className="text-capitalize text-muted"
                                style={{fontSize: "12px"}}
                                >*your gmail account.</small>
                            </div>
                        </form>
                        
                        {!verified && (

                        <form action="#" onSubmit={handleResetPassword}>
                            <div className="d-flex flex-column gap-2">

                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="fa-solid fa-shield-halved "></i>
                                    <label className="text-capitalize fw-bold">verify code: </label>
                                </div>

                                <div className="d-flex flex-column gap-2">
                                    <input 
                                        type="text" 
                                        className={`form-control 
                                            ${ !sent ? "bg-secondary bg-opacity-10 " : "bg-white"}
                                            ${ verifyMessage.includes("Invalid") && "border-danger" }
                                            `}
                                        placeholder="Type Verification Code"
                                        style={{fontSize: "14px"}}
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        disabled={!email || !sent}
                                        required
                                    />

                                    { ( cooldown > 0 &&  verifyMessage ) && (
                                        <p className={`m-0 small text-capitalize 
                                        ${verifyMessage.includes("Verified") ? "text-success" : "text-danger"}`}
                                        >{verifyMessage}</p>
                                    )}

                                    <button 
                                        className={`bg-danger border-0 p-2 text-capitalize rounded small text-white shadow-lg ${!email || !sent  || isLoading?.verify || verifyMessage.includes("Verified")
                                            ? "opacity-50" : ""
                                        }`}
                                        onClick={handleResetPassword}
                                        disabled={ !email || !sent || isLoading?.verify }
                                       
                                    >
                                        {isLoading?.verify ? "sending.." : verifyMessage.includes("Verified") ? verifyMessage  : "verify code"}
                                    </button>
                                </div>
                            </div>
                        </form>
                        )}

                        { verified  &&  
                        
                        <form action="#" onSubmit={handleChangePassword}>

                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-lock small"></i>
                                    <label className="text-capitalize small fw-bold">new password: </label>
                                </div>
                            
                                <input 
                                    type="password" 
                                    className={`form-control bg-opacity-10 ${passwordError.newPassword ? 'border-danger' : ''}`}
                                    placeholder="Type New Password"
                                    style={{fontSize: "14px"}}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                {passwordError.newPassword && (
                                    <p className="m-0 small text-danger text-capitalize">
                                        {passwordError.newPassword}
                                    </p>
                                )}


                            </div>

                            <div className="d-flex flex-column gap-2 mt-3">

                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-lock small"></i>
                                    <label className="text-capitalize small fw-bold">confirm password: </label>
                                </div>

                                <input 
                                    type="password" 
                                    className={`form-control bg-opacity-10 ${passwordError.confirmPassword ? 'border-danger' : ''}`}
                                    placeholder="Type Confirm Password"
                                    style={{fontSize: "14px"}}
                                    value={confirmPassword}
                                    onChange={(e)=> setConfirmPassword(e.target.value)}
                                />
                                {passwordError.confirmPassword && (
                                    <p className="m-0 small text-danger text-capitalize">
                                        {passwordError.confirmPassword}
                                    </p>
                                )}

                                <button className={`border-0 bg-danger text-white p-2 small text-capitalize rounded-3
                                ${loadingChange ? "opacity-50" : "opacity-100"}
                                `}
                                disabled={loadingChange}
                                >
                                    {loadingChange ? "sending.." : "change password"}
                                </button>
                            </div>
                        </form>
                        }
                        
                    </div>
                </div>
               
            </div>
        </div>
    );
}

export default ForgotPassword;