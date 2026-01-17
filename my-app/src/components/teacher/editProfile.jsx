import React, { useContext, useLayoutEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../../context/global";

const EditProfile = () => {
    const { setTextHeader, profile, setProfile } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        imageFile: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const imageRef = useRef();

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
        
        // Populate form with existing profile data
        if (profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                email: profile.email || "",
                imageFile: null
            });
            // Set preview from existing profile image
            if (profile.imageFile) {
                setImagePreview(`${import.meta.env.VITE_API_URL}/api/uploads/profile/${profile.imageFile}`);
            }
        }
    }, [location?.state?.title, profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert("Image size should be less than 5MB", 'error');
                return;
            }
            setFormData(prev => ({
                ...prev,
                imageFile: file
            }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        if (imageRef.current) {
            imageRef.current.value = null;
            setFormData(prev => ({
                ...prev,
                imageFile: null
            }));
            // Reset to original profile image if exists
            if (profile?.imageFile) {
                setImagePreview(`${import.meta.env.VITE_API_URL}/api/uploads/profile/${profile.imageFile}`);
            } else {
                setImagePreview(null);
            }
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showAlert("Please fill in all required fields", 'error');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("email", formData.email);
            
            // Only append image if a new one was selected
            if (formData.imageFile && formData.imageFile instanceof File) {
                data.append("profileImage", formData.imageFile);
            }
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/updateProfile`, {
                method: "PATCH",
                body: data,
                credentials: "include",
            });

            const resData = await response.json();
            if (!response.ok) throw new Error(resData.message);

            // Update profile in context    
            setProfile(resData.data);
            
            showAlert(resData.message || "Profile updated successfully!", 'success');
            
            // Navigate back to profile after a short delay
            setTimeout(() => {
                navigate("/staff", { state: { title: "Dashboard" } });
            }, 1500);
        } catch (err) {
            showAlert("Failed to update profile: " + err.message, 'error');
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
        <>
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10  col-lg-10">
                        <form onSubmit={handleSubmit}>
                            {/* Header */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <h4 className="fw-bold text-capitalize mb-1">Edit Profile</h4>
                                    <p className="text-muted mb-0">Update your personal information</p>
                                </div>
                            </div>

                            {/* Profile Image Section */}
                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-bold text-danger mb-0">Profile Picture</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center gap-4">
                                        <div>
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile Preview"
                                                    className="rounded-3"
                                                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div 
                                                    className="rounded-3 bg-danger bg-opacity-10 d-flex align-items-center justify-content-center border border-danger"
                                                    style={{ width: '120px', height: '120px' }}
                                                >
                                                    <span className="fs-1 fw-bold text-danger">
                                                        {getInitials(formData.firstName, formData.lastName)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="profileImageInput" className="btn btn-outline-danger btn-sm mb-2">
                                                <i className="fa-solid fa-upload me-2"></i>
                                                Upload Photo
                                            </label>
                                            <input
                                                ref={imageRef}
                                                id="profileImageInput"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="d-none"
                                            />
                                            {imagePreview && formData.imageFile && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="btn btn-outline-secondary btn-sm d-block"
                                                >
                                                    <i className="fa-solid fa-trash me-2"></i>
                                                    Remove Photo
                                                </button>
                                            )}
                                            <small className="text-muted d-block mt-2">
                                                JPG, PNG or GIF (Max 5MB)
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-bold text-danger mb-0">Personal Information</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                First Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Last Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Email Address <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => navigate(-1)}
                                            disabled={loading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-danger"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-floppy-disk me-2"></i>
                                                    Update Profile
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Alert Modal - Success/Error Messages */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
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
        </>
    );
}

export default EditProfile;