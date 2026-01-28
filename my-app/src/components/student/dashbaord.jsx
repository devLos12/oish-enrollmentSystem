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

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {   
        setEnrollment(profile?.currentSection?.isOpenEnrollment && 
            !profile?.currentSection?.isEnrolled.includes(profile?._id)
        );
    }, [profile]);

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
            'enrolled': 'bg-success',
            'pending': 'bg-warning',
            'unenrolled': 'bg-secondary',
        };
        const color = badges[status] || 'bg-secondary';
        return `badge ${color} bg-opacity-10 text-${color.replace('bg-', '')} border border-${color.replace('bg-', '')}`;
    };

    const handleEnrollment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/EnrollStudentFromPortal`,{
                method: "POST",
                credentials: "include"
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            alert(data.message || "Enrollment successful!");
            setShowModal(false);
            setTrigger((prev) => !prev);
        } catch (error) {
            alert("Error: " + error.message);
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
                                {profile?.lastName}, {profile?.firstName} {profile?.middleName} {profile?.extensionName === "N/A" || profile?.extensionName === "N/A" ? "" : profile?.extensionName}
                            </h4>
                            
                            <div className="mb-2">
                                <span className="text-muted small">LRN: <strong>{profile.lrn}</strong></span>
                                <span className="text-muted ms-3 small">Student #: <strong>{profile.studentNumber}</strong></span>
                            </div>

                            <div className="d-flex gap-2 align-items-center small">
                                <span className="fw-bold">{profile?.gradeLevel}</span>
                                <span className="fw-bold">{profile?.section || "No Section"}</span>
                                <span className={getStatusBadge(profile.status)}>
                                    {profile.status?.toUpperCase()}
                                </span>
                            </div>
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
                                    >
                                        <i className="fa fa-check-circle me-2"></i>
                                        Enroll request
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
                                    { label: "School Year", value: profile.enrollmentYear || 'N/A' },
                                    { label: "Track", value: profile.track || 'N/A' },
                                    { label: "Strand", value: profile.strand || 'N/A' },
                                    { label: "Semester", value: `${profile.semester === 1 ? "First"  : "Second"}`},
                                    { label: "Enrolled Since", value: formatDate(profile.createdAt) }
                                ].map((item, i) => (
                                    <div key={i} className="col-12">
                                        <div className="p-3 rounded-3 bg-light">
                                            <small className="text-muted d-block">{item.label}</small>
                                            {item.isBadge ? (
                                                <span className={getStatusBadge(item.value)}>
                                                    {item.value?.toUpperCase()}
                                                </span>
                                            ) : (
                                                <strong className="text-dark">{item.value}</strong>
                                            )}
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
                                                <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary">
                                                    Semester {subject.semester}
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
                                                    Semester {subject.semester}
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
                                <h5 className="modal-title fw-bold">Confirm Enrollment</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <div className="mb-4">
                                    <i className="fa fa-graduation-cap fa-4x text-primary mb-3"></i>
                                    <h5 className="fw-bold mb-2">Ready to Enroll?</h5>
                                    <p className="text-muted">
                                        You are about to enroll for the current semester. 
                                        Please confirm to proceed.
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
                                                {profile?.gradeLevel} - {profile?.section || 'N/A'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleEnrollment}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Enrolling...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-check me-2"></i>
                                            Confirm Enrollment
                                        </>
                                    )}
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