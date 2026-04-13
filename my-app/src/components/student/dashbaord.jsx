import React, { useContext, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../../context/global";
import { useEffect } from "react";
import { useState } from "react";

const Dashboard = () => {
    const { setTextHeader, profile, setTrigger } = useContext(globalContext);
    const [isEnrollment, setEnrollment] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const location = useLocation();

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');



    useEffect(() => {  
        console.log("Profile data updated:", profile);
    }, [profile]);

    
    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {   
        setEnrollment(
            profile?.currentSection?.isOpenEnrollment && 
            !profile?.isEnrolledThisSem
        );
    }, [profile]);
    
    // ✅ Derived status — base sa isEnrolledThisSem, hindi sa status field
    const getDerivedStatus = () => {
        if (profile?.status === 'unenrolled') return 'unenrolled';
        if (profile?.status === 'graduated') return 'graduated';
        if (profile?.status === 'dropped') return 'dropped';
        return profile?.isEnrolledThisSem ? 'enrolled' : 'pending';
    };


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getFullAddress = (address) => {
        if (!address) return 'N/A';
        const parts = [
            address.houseNo,
            address.street,
            address.barangay,
            address.municipality,
            address.province,
            address.zipCode
        ].filter(Boolean);
        return parts.join(', ') || 'N/A';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'enrolled':  'bg-success',
            'pending':   'bg-warning',
            'dropped':   'bg-danger',
            'graduated': 'bg-primary',
        };
        const color = badges[status] || 'bg-secondary';
        return `badge ${color} bg-opacity-10 text-${color.replace('bg-', '')} border border-${color.replace('bg-', '')}`;
    };

    const handleEnrollment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/EnrollStudentFromPortal`, {
                method: "POST",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            setAlertMessage(data.message || "Enrollment successful!");
            setAlertType('success');
            setShowAlertModal(true);
            setTrigger((prev) => !prev);
        } catch (error) {
            setShowModal(false);
            setAlertMessage(error.message);
            setAlertType('error');
            setShowAlertModal(true);
        } finally {
            setLoading(false);
        }
    };

    if (!profile) {
        return (
            <div className="container mt-4">
                <div className="alert alert-info bg-info bg-opacity-10 border-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Loading profile data...
                </div>
            </div>
        );
    }

    // ✅ Derived semester — base sa activeSchoolYear, hindi sa profile.semester
    const derivedSemester = profile?.currentSemHistory?.semester === 1 ? "First"
        : profile?.currentSemHistory?.semester === 2 ? "Second"
        : profile?.latestHistory?.semester === 1 ? "First"
        : profile?.latestHistory?.semester === 2 ? "Second" : profile.semester === 1 ? "First" : "Second";



    
    // ✅ Derived school year — base sa activeSchoolYear
    const derivedSchoolYear = profile?.currentSemHistory?.schoolYear
        || profile?.latestHistory?.schoolYear
        || profile?.enrollmentYear
        || 'N/A';

    


    const derivedStatus = getDerivedStatus();

    return (
        <div className="container mt-4">
            {/* Profile Header */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                    <div className="row">
                        <div className="col-auto">
                            {profile?.profileImage ? (
                                <div className="overflow-hidden rounded-3"
                                    style={{width: "100px", height: "100px"}}
                                >
                                    <img src={profile?.profileImage} alt="profile.jpg" 
                                        className="image-fluid w-100 h-100"
                                        style={{objectFit: "cover"}}
                                    />
                                </div>
                            ) : (
                                <div className="bg-danger bg-opacity-10 border-danger border text-danger rounded-4 d-flex align-items-center justify-content-center fs-1 fw-semibold" 
                                    style={{ width: '110px', height: '110px' }}>
                                    {profile?.firstName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="col">
                            <h4 className="fw-bold text-capitalize mb-2">
                                {profile?.lastName}, {profile?.firstName} {profile?.middleName} {(profile?.extensionName === "N/A" || profile?.extensionName === "n/a") ? "" : profile?.extensionName}
                            </h4>
                            
                            <div className="mb-2">
                                <span className="text-muted small">LRN: <strong>{profile.lrn}</strong></span>
                                <span className="text-muted ms-3 small">Student #: <strong>{profile.studentNumber}</strong></span>
                            </div>

                            <div className="d-flex gap-2 align-items-center small">
                                <span className="fw-bold">{profile?.gradeLevel}</span>
                                <span className="fw-bold">{profile?.section || "No Section"}</span>
                                {/* ✅ derivedStatus na, hindi profile.status */}
                                <span className={getStatusBadge(derivedStatus)}>
                                    {derivedStatus.toUpperCase()}
                                </span>
                            </div>

                            {/* ✅ Enroll Now button — lalabas lang kung pending sa current sem */}
                            {isEnrollment && (
                                <div className="mt-3">
                                    <button 
                                        className="btn btn-primary text-capitalize"
                                        onClick={() => setShowModal(true)}
                                    >
                                        <i className="fa fa-check-circle me-2"></i>
                                        Enroll Now
                                    </button>
                                </div>
                            )}
                            {profile?.hasEnrollmentRequest && (
                                <div className="mt-3">
                                    <button 
                                        className="btn btn-primary text-capitalize"
                                        onClick={() => setShowModal(true)}
                                        disabled={profile?.status === 'pending'}  // ✅ disabled pag nag-request na
                                    >
                                        <i className={`fa ${profile?.status === 'pending' ? 'fa-clock' : 'fa-paper-plane'} me-2`}></i>
                                        {profile?.status === 'pending' ? 'Requested' : 'Request Enrollment'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
                            
            {/* Info Cards */}
            <div className="row g-4 mb-4">
                {/* Personal Information */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="fw-bold text-danger mb-0">Personal Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {[
                                    { label: "Birth Date", value: formatDate(profile.birthDate) },
                                    { label: "Sex", value: profile.sex },
                                    { label: "Contact Number", value: profile.contactNumber || 'N/A' },
                                    { label: "Email", value: profile.email },
                                    { label: "Address", value: getFullAddress(profile.address) }
                                ].map((item, i) => (
                                    <div key={i} className="col-12">
                                        <div className="p-3 rounded-3 bg-light">
                                            <small className="text-muted d-block">{item.label}</small>
                                            <strong className="text-dark">{item.value}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enrollment Information */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="fw-bold text-danger mb-0">Enrollment Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {[
                                    // ✅ derivedSchoolYear — base sa activeSchoolYear
                                    { label: "School Year", value: derivedSchoolYear },
                                    { label: "Track", value: profile.track || 'N/A' },
                                    { label: "Strand", value: profile.strand || 'N/A' },
                                    // ✅ derivedSemester — base sa activeSchoolYear, hindi profile.semester
                                    { label: "Semester", value: derivedSemester },
                                    { label: "Enrolled Since", value: formatDate(profile.createdAt) }
                                ].map((item, i) => (
                                    <div key={i} className="col-12">
                                        <div className="p-3 rounded-3 bg-light">
                                            <small className="text-muted d-block">{item.label}</small>
                                            <strong className="text-dark">{item.value}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Table */}
            {profile.subjects && profile.subjects.length > 0 && (
                <div className="card shadow-sm border-0 p-4 my-5">
                    <div className="card-header bg-white border-0">
                        <h5 className="fw-bold text-danger mb-0">
                            Enrolled Subjects ({profile.subjects.length})
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        {["#", "Subject", "Teacher", "Semester"].map((header, i) => (
                                            <th key={i} className="fw-semibold text-danger">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.subjects.map((subject, index) => (
                                        <tr key={index} className="align-middle">
                                            <td className="fw-bold text-muted">{index + 1}</td>
                                            <td className="fw-semibold text-capitalize">{subject.subjectName}</td>
                                            <td className="text-capitalize">{subject.subjectTeacher}</td>
                                            <td>
                                                <span className="badge bg-info">
                                                    {subject.semester === 1 ? "First" : "Second"}                                                           
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Repeated Subjects Table */}
            {profile.repeatedSubjects && profile.repeatedSubjects.length > 0 && (
                <div className="card shadow-sm border-0 p-4 my-5">
                    <div className="card-header bg-white border-0">
                        <h5 className="fw-bold text-danger mb-0">
                            Repeated Subjects ({profile.repeatedSubjects.length})
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        {["#", "Subject", "Semester", "Status"].map((header, i) => (
                                            <th key={i} className="fw-semibold text-danger">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.repeatedSubjects.map((subject, index) => (
                                        <tr key={index} className="align-middle">
                                            <td className="fw-bold text-muted">{index + 1}</td>
                                            <td className="fw-semibold text-capitalize">{subject.subjectName}</td>
                                            <td>
                                                <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary">
                                                    {subject.semester === 1 ? "First" : "Second"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-danger text-secondary border text-white">
                                                    {subject.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Confirmation Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">
                                    {profile?.studentType === 'repeater' 
                                        ? 'Confirm Enrollment Request' 
                                        : 'Confirm Enrollment'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <div className="mb-4">
                                    <i className={`fa ${profile?.studentType === 'repeater' ? 'fa-paper-plane' : 'fa-graduation-cap'} fa-4x text-primary mb-3`}></i>
                                    <h5 className="fw-bold mb-2">
                                        {profile?.studentType === 'repeater' 
                                            ? 'Submit Enrollment Request?' 
                                            : 'Ready to Enroll?'}
                                    </h5>
                                    <p className="text-muted">
                                        {profile?.studentType === 'repeater'
                                            ? 'You are submitting an enrollment request. Admin will review and process your enrollment.'
                                            : 'You are about to enroll for the current semester. Please confirm to proceed.'}
                                    </p>
                                </div>
                                
                                <div className="bg-light rounded-3 p-3 mb-3">
                                    <div className="row text-start">
                                        <div className="col-6">
                                            <small className="text-muted d-block">Student Name</small>
                                            <strong className="text-capitalize">
                                                {profile?.firstName} {profile?.lastName}
                                            </strong>
                                        </div>
                                        <div className="col-6">
                                            <small className="text-muted d-block">Grade & Section</small>
                                            <strong>
                                                {profile?.gradeLevel} - {profile?.studentType === 'repeater' ? 'TBA' : (profile?.section || 'N/A')}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ Repeater notice */}
                                {profile?.studentType === 'repeater' && (
                                    <div className="alert alert-warning text-start small">
                                        <i className="fa fa-info-circle me-2"></i>
                                        Section will be assigned by the admin after your request is reviewed.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleEnrollment} disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>
                                        {profile?.studentType === 'repeater' ? 'Submitting...' : 'Enrolling...'}</>
                                    ) : (
                                        <><i className={`fa ${profile?.studentType === 'repeater' ? 'fa-paper-plane' : 'fa-check'} me-2`}></i>
                                        {profile?.studentType === 'repeater' ? 'Submit Request' : 'Confirm Enrollment'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">
                                    {alertType === 'success' ? 'Success!' : 'Error!'}
                                </h5>
                                <p className="text-muted mb-4">{alertMessage}</p>
                                <button 
                                    type="button" 
                                    className={`btn ${alertType === 'success' ? 'btn-success' : 'btn-danger'} px-4`}
                                    onClick={() => setShowAlertModal(false)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;