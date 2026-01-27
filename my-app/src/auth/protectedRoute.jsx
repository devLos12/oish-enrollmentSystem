import { useContext, useState } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { globalContext } from "../context/global";


const ProtectedRoute = ({ children, isAuthenticated}) => {
    const { authLoading, isLoggingOut } = useContext(globalContext);

    if(authLoading || isLoggingOut ) return <p>....loading</p>;

    const getRedirectPath = () => {
        return "/404_forbidden"
    }

    return isAuthenticated ? children : <Navigate to={getRedirectPath()} replace/>
}

export default ProtectedRoute;