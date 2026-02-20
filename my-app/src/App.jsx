import { useContext, useEffect, useState } from 'react'
import {Routes, Route, Navigate, useLocation, useNavigate,} from 'react-router-dom';
import "./styles/App.css";
import Layout from './pages/layout.jsx';
import Admin from './pages/admin.jsx';
import ProtectedRoute from "./auth/protectedRoute.jsx";
import { globalContext } from './context/global.jsx';
import UrlForbidden from './pages/urlForbidden.jsx';
import Staff from './pages/staff.jsx';
import Student from './pages/student.jsx';






const App = () => {
  const { isAdminAuth,  setAdminAuth, authLoading, setAuthLoading, setRole, 
          isStaffAuth, setStaffAuth, isStudentAuth, setStudentAuth
  } = useContext(globalContext);
  const location = useLocation();


  useEffect(()=> {

      fetch(`${import.meta.env.VITE_API_URL}/api/urlAuthentication`, {
        method: "GET",
        credentials: "include"
      })
      .then(async(res) => {
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => {
        setRole(data.role);
        setAdminAuth(data.role === "admin");
        setStaffAuth(data.role === "staff");
        setStudentAuth(data.role === "student");
        setTimeout(()=>{
          setAuthLoading(false);
        }, 1500)

      })
      .catch((err) => {
        setTimeout(()=>{
          setAuthLoading(false);
        }, 1500)
        console.log("Error: ", err.message );
      })

  },[]);


  if(authLoading) return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-white">
      <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-secondary fw-semibold">Loading...</p>
    </div>
  )


  const getRedirectPath = () => {
    if(isAdminAuth) return "/admin";
    if(isStaffAuth) return "/staff";
    if(isStudentAuth) return "/student";
  };


  return (  
    <>
      <Routes>
        {/* <Route path="/*"  element={ isAdminAuth || isStaffAuth || isStudentAuth
          ? <Navigate to={getRedirectPath()}/> : <Layout/>}/> */}

        <Route path="/*" element={<Layout/>}/>

        <Route path='/admin/*' element={
          <ProtectedRoute isAuthenticated={isAdminAuth} >
            <Admin/>
          </ProtectedRoute>
        }/>

        <Route path='/staff/*' element={
          <ProtectedRoute isAuthenticated={isStaffAuth} >
            <Staff/>
          </ProtectedRoute>
        }/>

        <Route path='/student/*' element={
          <ProtectedRoute isAuthenticated={isStudentAuth} >
            <Student/>
          </ProtectedRoute>
        }/>

        <Route path='404_forbidden'  element={ <UrlForbidden/>} />
      </Routes>

    </>

  )
}

export default App