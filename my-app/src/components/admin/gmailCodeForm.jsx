import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../../context/global";
import { useLocation } from "react-router-dom";




const GmailCodeForm = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [resData, setResData] = useState({});
    
    
    
    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title])




    const handleSubmit = async(e) => {
        e.preventDefault();

        setResData(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail_code`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ email }),
                credentials: "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            setTimeout(() => {
                setResData(data);
            }, 1000);
        } catch (error) {
            console.log("Error: ", error.message);
        }

    }

    
    return(
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-12 col-md-7">
                    <div className="card-body mt-3">
                        <p className="m-0 fs-4 text-capitalize text-center my-2 fw-bold">Gmail Access Code</p>

                        <div className="d-flex align-items-center gap-2 mt-4">
                            <i className="fa-solid fa-info-circle text-danger"></i>
                            <p className="m-0 text-capitalize fw-bold small text-danger">note:</p>
                            <p className="m-0 text-capitalize small">make sure you have gmail account.</p>
                        </div>

                        <p className="m-0 text-capitalize small fw-semibold mt-2">this will generate random code via gmail to access registration for staff members.</p>

                        <form action="" onSubmit={handleSubmit} className="mt-4">
                            <div className="d-flex flex-column gap-3">
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center gap-1 text-danger">
                                    <i className="fa-solid fa-envelope"></i>
                                    <label htmlFor="" className="text-capitalize fw-bold">Email Address: </label>
                                </div>
                                <input type="text" className="form-control" 
                                placeholder="Type Email Address"
                                value={email}
                                onChange={(e)=> setEmail(e.target.value)}
                                style={{fontSize: "14px"}}
                                required
                                />
                            </div>

                                <button className="btn btn-dark text-capitalize">request code</button>
                            </div>

                        </form>
                        
                        {resData?.code && (
                            <div className="card-body mt-3 text-center">
                                <p className="m-0 text-capitalize fw-semibold text-success">{resData?.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 

export default GmailCodeForm;