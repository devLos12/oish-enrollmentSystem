import React, { useContext, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../../context/global";








const Dashboard = () => {
    const { setTextHeader, profile, role } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Use profile data from context
    const staffData = profile;

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title, profile]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    if (!staffData) {
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
                            {staffData?.imageFile ? (
                                <div className="overflow-hidden rounded-3"
                                    style={{width: "110px", height: "110px"}}>
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL}/api/uploads/profile/${staffData?.imageFile}`} 
                                        alt="profile.jpg" 
                                        className="img-fluid w-100 h-100"
                                        style={{objectFit: "cover"}}
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="bg-danger bg-opacity-10 border-danger border text-danger rounded-4 d-flex align-items-center justify-content-center fs-1 fw-semibold"
                                    style={{ width: '110px', height: '110px' }}
                                >
                                    {getInitials(staffData?.firstName, staffData?.lastName)}
                                </div>
                            )}
                        </div>
                        <div className="col">
                            <h4 className="fw-bold text-capitalize mb-2">
                                {staffData?.lastName}, {staffData?.firstName}
                            </h4>
                            
                            <div className="mb-2">
                                <span className="text-muted small">Email: <strong>{staffData?.email}</strong></span>
                            </div>

                            <div className="d-flex gap-2 align-items-center small">
                                {role && (
                                    <span className="badge bg-primary px-3 py-2 text-capitalize">
                                        Teacher
                                    </span>
                                )}
                            </div>
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
                                    { label: "First Name", value: staffData?.firstName },
                                    { label: "Last Name", value: staffData?.lastName },
                                    { label: "Email Address", value: staffData?.email }
                                ].map((item, i) => (
                                    <div key={i} className="col-12">
                                        <div className="p-3 rounded-3 bg-light">
                                            <small className="text-muted d-block">{item.label}</small>
                                            <strong className="text-dark">{item.value || 'N/A'}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Information */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="fw-bold text-danger mb-0">Account Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {[
                                    { label: "Role", value: role || 'N/A' },
                                    { label: "Member Since", value: formatDate(staffData?.createdAt) }
                                ].map((item, i) => (
                                    <div key={i} className="col-12">
                                        <div className="p-3 rounded-3 bg-light">
                                            <small className="text-muted d-block">{item.label}</small>
                                            <strong className="text-dark text-capitalize">{item.value}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;