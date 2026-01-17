import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../../context/global";
import { useLocation } from "react-router-dom";





const GenerateCodeForm = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const [resData, setResData] = useState({});
    


    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title])


    const handleSubmit = async(e) => {
        e.preventDefault();


        setResData(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate_code`, {
                method: "GET",
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
                        <p className="m-0 fs-4 text-capitalize text-center my-2 fw-bold">Generate Access Code</p>

                        <form action="" onSubmit={handleSubmit} >
                            <div className="d-flex flex-column gap-3">
                            <div className="d-flex flex-column gap-2 mt-4">
                                <div className="d-flex align-items-center gap-1 text-danger">
                                    <i className="fa-solid fa-info-circle small"></i>
                                    <label htmlFor="" className="text-capitalize fw-bold">note: </label>
                                </div>
                                <p className="m-0 text-capitalize small fw-semibold">this will generate random code to access registration for staff members.</p>
                              
                            </div>

                                <button className="btn btn-dark text-capitalize">generate code</button>
                            </div>
                        </form>

                        {resData?.code && (
                            <div className="card-body mt-3 text-center">
                                <p className="m-0 text-capitalize fw-semibold">{resData?.message}</p>
                                <p className="m-0 text-capitalize fs-2 fw-bold text-success">{resData?.code}</p>
                                <p className="m-0 text-capitalize small fw-bold">expiration 1hr.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 

export default GenerateCodeForm;