import { useContext, useState } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { globalContext } from "../context/global";


const ProtectedRoute = ({ children, isAuthenticated}) => {
    const { authLoading, isLoggingOut } = useContext(globalContext);

    if(authLoading || isLoggingOut ) return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-white">
            <div className="spinner-border text-danger" role="status" 
            style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-secondary fw-semibold">Loading...</p>
        </div>
    );

    const getRedirectPath = () => {
        return "/404_forbidden"
    }

    return isAuthenticated ? children : <Navigate to={getRedirectPath()} replace/>
}

export default ProtectedRoute;