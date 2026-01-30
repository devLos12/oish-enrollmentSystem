import React, { useContext, useLayoutEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { globalContext } from "../../context/global";
import imageCompression from 'browser-image-compression';



//student
const EditProfile = () => {
    const { setTextHeader, profile, setTrigger } = useContext(globalContext);
    const location = useLocation();

    const [formData, setFormData] = useState({
        profileImage: '',
        firstName: '',
        middleName: '',
        lastName: '',
        extensionName: '',
        birthDate: '',
        sex: '',
        contactNumber: '',
        email: '',
        address: {
            houseNo: '',
            street: '',
            barangay: '',
            municipality: '',
            province: '',
            country: '',
            zipCode: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const imageRef = useRef();
    const [prevImage, setPrevImage] = useState('');

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const [contactNumberError, setContactNumberError] = useState('');


    const extensionNameOptions = [
        'Jr.',
        'Sr.',
        'II',
        'III',
        'IV',
        'V'
    ];


    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };


    // ✅ Helper function to remove numbers and special chars from text fields
    const removeNumbersAndSpecialChars = (value) => {
        // Allow: letters (a-z, A-Z), spaces, periods, hyphens, apostrophes only
        // Good for names like "De La Cruz", "O'Brien", "Santos Jr."
        return value.replace(/[^a-zA-Z\s\-'\.]/g, '');
    };

    // ✅ Helper function to format contact number (0XXX XXX XXXX)
    const formatContactNumber = (value) => {
        // Remove all non-digit characters
        let cleaned = value.replace(/\D/g, '');
        
        // Limit to 11 digits
        cleaned = cleaned.substring(0, 11);
        
        // Format as 0XXX XXX XXXX
        let formatted = '';
        if (cleaned.length > 0) {
            formatted = cleaned.substring(0, 4);  // 0XXX
            if (cleaned.length > 4) {
                formatted += ' ' + cleaned.substring(4, 7);  // XXX
            }
            if (cleaned.length > 7) {
                formatted += ' ' + cleaned.substring(7, 11);  // XXXX
            }
        }
        
        return formatted;
    };

    // ✅ Helper function for address fields (letters and spaces only)
    const removeNumbersAndAllSpecialChars = (value) => {
        // Allow: letters (a-z, A-Z) and spaces ONLY
        // NO numbers, NO special characters at all
        return value.replace(/[^a-zA-Z\s]/g, '');
    };



    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    // Load profile data into form
    useLayoutEffect(() => {
        if (profile) {
            setFormData({
                profileImage: profile.profileImage || '',
                firstName: profile.firstName || '',
                middleName: profile.middleName || '',
                lastName: profile.lastName || '',
                extensionName: profile.extensionName || '',
                birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '',
                sex: profile.sex || '',
                contactNumber: profile.contactNumber || '',
                email: profile.email || '',
                address: {
                    houseNo: profile.address?.houseNo || '',
                    street: profile.address?.street || '',
                    barangay: profile.address?.barangay || '',
                    municipality: profile.address?.municipality || '',
                    province: profile.address?.province || '',
                    country: profile.address?.country || '',
                    zipCode: profile.address?.zipCode || ''
                }
            });
            setPrevImage(profile.profileImage || '');
        }
    }, [profile]);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // ✅ Fields that should not contain numbers and special characters
        const textOnlyFields = ['firstName', 'middleName', 'lastName'];

         // ✅ NEW: Birth Date validation - Block years > 2011
        if (name === 'birthDate' && value) {
            const [year] = value.split('-').map(Number);
            
            // Block years greater than 2011
            if (year > 2011) {
                return; // Don't update if year exceeds 2011
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            return;
        }



        // ✅ Apply text-only validation for name fields
        if (textOnlyFields.includes(name)) {
            const cleanedValue = removeNumbersAndSpecialChars(value);
            setFormData(prev => ({
                ...prev,
                [name]: cleanedValue
            }));
            return;
        }
        
        // ✅ Format contact number with validation
        if (name === 'contactNumber') {
            const formattedNumber = formatContactNumber(value);
            
            // Remove spaces to check digit count
            const digitsOnly = formattedNumber.replace(/\s/g, '');
            
            // Validate: must be exactly 11 digits if not empty
            if (digitsOnly.length > 0 && digitsOnly.length < 11) {
                setContactNumberError('Contact number must be exactly 11 digits');
            } else {
                setContactNumberError('');
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: formattedNumber
            }));
            return;
        }
        
        
        // ✅ Regular fields (no special handling)
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        
        // ✅ Zip Code - Numbers only, 4 digits max
        if (name === 'zipCode') {
            const cleaned = value.replace(/\D/g, '').substring(0, 4);
            
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [name]: cleaned
                }
            }));
            return;
        }
        
        // ✅ Strict text-only fields - Letters and spaces ONLY (no numbers, no special chars)
        // municipality, province, country
        const strictTextFields = ['municipality', 'province', 'country'];
        if (strictTextFields.includes(name)) {
            const cleanedValue = value.replace(/[^a-zA-Z\s]/g, '');
            
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [name]: cleanedValue
                }
            }));
            return;
        }
        
        // ✅ Flexible fields - Allow everything (numbers, letters, special chars, spaces)
        // houseNo, street, barangay
        const flexibleFields = ['houseNo', 'street', 'barangay'];
        if (flexibleFields.includes(name)) {
            const limited = name === 'houseNo' ? value.substring(0, 50) : value;
            
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [name]: limited
                }
            }));
            return;
        }
        
        // ✅ Fallback
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value
            }
        }));
    };





    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        
        if (!file) return;

        // ✅ Validate file size BEFORE compression
        if (file.size > 5 * 1024 * 1024) {
            showAlert("Image size should be less than 5MB", 'error');
            e.target.value = ''; // Reset input
            return;
        }

        // ✅ Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showAlert("Only JPG, PNG, or GIF images are allowed", 'error');
            e.target.value = '';
            return;
        }

        try {
            // ✅ Compression options
            const options = {
                maxSizeMB: 1,           // Compress to max 1MB
                maxWidthOrHeight: 1920, // Max dimension
                useWebWorker: true,     // Use web worker for better performance
                fileType: file.type     // Maintain original file type
            };

            
            // ✅ Compress the image
            const compressedBlob = await imageCompression(file, options);
            
            // ✅ Convert Blob to File with original filename
            const compressedFile = new File([compressedBlob], file.name, {
                type: compressedBlob.type,
                lastModified: Date.now()
            });
            
            // ✅ Set the compressed file
            setImageFile(compressedFile);
            
            // ✅ Create preview URL (using object URL instead of base64)
            const previewUrl = URL.createObjectURL(compressedFile);
            setImagePreview(previewUrl);
            
        } catch (error) {
            console.error('Error compressing image:', error);
            showAlert("Failed to compress image. Please try again.", 'error');
            e.target.value = '';
        }
    };





    const handleRemoveImage = () => {
        if (imageRef.current) {
            imageRef.current.value = null;
        }
        
        // ✅ Revoke object URL to prevent memory leaks
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({
            ...prev,
            profileImage: prevImage
        }));
    };



    // ✅ Cleanup object URL on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);




    const getInitials = () => {
        const firstInitial = formData.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = formData.lastName?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.birthDate) newErrors.birthDate = "Birth date is required";
        if (!formData.sex) newErrors.sex = "Sex is required";
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

        const sendData = new FormData();
        
        // Add image file if exists
        if (imageFile) {
            sendData.append('profileImage', imageFile);
        }

        // Add all other form data
        Object.keys(formData).forEach(key => {
            if (key === 'address') {
                sendData.append('address', JSON.stringify(formData.address));
            } else if (key !== 'profileImage') {
                sendData.append(key, formData[key]);
            }
        });

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student_update/${profile._id}`, {
                method: "PATCH",
                body: sendData,
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showAlert(data.message, 'success');
            setTrigger((prev) => !prev);
            
            // Auto-close modal and go back after success
            setTimeout(() => {
                setShowAlertModal(false);
            }, 1500);
        } catch (error) {
            showAlert("Failed to update profile: " + error.message, 'error');
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
            <div className="container mt-4 container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-11">
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
                                            ) : formData.profileImage ? (
                                                <img
                                                    src={formData.profileImage}
                                                    alt="Profile"
                                                    className="rounded-3"
                                                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div 
                                                    className="rounded-3 bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                                                    style={{ width: '120px', height: '120px' }}
                                                >
                                                    <span className="fs-1 fw-bold text-danger">
                                                        {getInitials() || '?'}
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
                                            {imagePreview && (
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
                                            <label className="form-label fw-semibold">Middle Name</label>
                                            <input
                                                type="text"
                                                name="middleName"
                                                className="form-control"
                                                value={formData.middleName}
                                                onChange={handleInputChange}
                                            />
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

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Extension Name</label>
                                            <select
                                                name="extensionName"
                                                className="form-select"
                                                value={formData.extensionName}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Extension Name (Optional)</option>
                                                {extensionNameOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Birth Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="birthDate"
                                                className={`form-control ${errors.birthDate ? 'is-invalid' : ''}`}
                                                value={formData.birthDate}
                                                onChange={handleInputChange}
                                                max={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                            {errors.birthDate && <div className="invalid-feedback">{errors.birthDate}</div>}
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                Sex <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                name="sex"
                                                className={`form-select ${errors.sex ? 'is-invalid' : ''}`}
                                                value={formData.sex}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Sex</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            {errors.sex && <div className="invalid-feedback">{errors.sex}</div>}
                                        </div>
                                        
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Contact Number</label>
                                            <input
                                                type="text"
                                                name="contactNumber"
                                                className={`form-control ${contactNumberError ? 'is-invalid' : ''}`}
                                                placeholder="09XX XXX XXXX"
                                                value={formData.contactNumber}
                                                onChange={handleInputChange}
                                                maxLength="13"
                                            />
                                            {contactNumberError && (
                                                <div className="invalid-feedback d-block">{contactNumberError}</div>
                                            )}
                                            <small className="text-muted">
                                                Format: 0XXX XXX XXXX (11 digits)
                                            </small>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Email <span className="text-danger">*</span>
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

                            {/* Address Information */}
                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-bold text-danger mb-0">Address Information</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">House No.</label>
                                            <input
                                                type="text"
                                                name="houseNo"
                                                className="form-control"
                                                placeholder="e.g., 123, Block 5 Lot 10"
                                                value={formData.address.houseNo}
                                                onChange={handleAddressChange}
                                                maxLength="50"
                                            />
                                            <small className="text-muted">Can include block/lot number (alphanumeric)</small>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Street</label>
                                            <input
                                                type="text"
                                                name="street"
                                                className="form-control"
                                                value={formData.address.street}
                                                onChange={handleAddressChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Barangay</label>
                                            <input
                                                type="text"
                                                name="barangay"
                                                className="form-control"
                                                value={formData.address.barangay}
                                                onChange={handleAddressChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Municipality</label>
                                            <input
                                                type="text"
                                                name="municipality"
                                                className="form-control"
                                                value={formData.address.municipality}
                                                onChange={handleAddressChange}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Province</label>
                                            <input
                                                type="text"
                                                name="province"
                                                className="form-control"
                                                value={formData.address.province}
                                                onChange={handleAddressChange}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                className="form-control"
                                                value={formData.address.country}
                                                onChange={handleAddressChange}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Zip Code</label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                className="form-control"
                                                placeholder="e.g., 4232"
                                                value={formData.address.zipCode}
                                                onChange={handleAddressChange}
                                                maxLength="4"
                                                inputMode="numeric"
                                            />
                                            <small className="text-muted">Numbers only (4 digits)</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Read-only Information */}
                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-bold text-danger mb-0">Enrollment Information (Read-only)</h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">LRN</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.lrn || ''}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">Student Number</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.studentNumber || ''}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">Grade Level</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.gradeLevel || ''}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">Track</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.track || 'N/A'}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">Strand</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.strand || 'N/A'}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold text-muted">Section</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={profile.section || 'N/A'}
                                                disabled
                                            />
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
                                            onClick={() => window.history.back()}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-danger"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
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
};

export default EditProfile;