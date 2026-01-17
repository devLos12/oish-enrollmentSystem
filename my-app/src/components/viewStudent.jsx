import React from "react";
import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";
import { useEffect } from "react";
import { useLayoutEffect } from "react";




const ViewStudents = () => {
    const { setTextHeader, role } = useContext(globalContext);
    const location = useLocation();
    

    useLayoutEffect(() => {
        setTextHeader(location?.state.title);
    },[location?.state?.title]);


    return (
        <div className="container">
            <div className="row">
                <div className="col">

                </div>
            </div>
        </div>
    )
}

export default ViewStudents;