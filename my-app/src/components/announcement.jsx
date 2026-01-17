import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";

// Mock context - replace with your actual global context
const GlobalContext = React.createContext({});

const AnnouncementManagement = () => {
  const { setTextHeader } = useContext(globalContext);
  const location = useLocation();
  
  useLayoutEffect(() => {
    setTextHeader(location?.state?.title);
  }, [location?.state?.title]);
  


  // State
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add' | 'edit' | 'delete'
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);

  // Image fullview state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Options
  const categoryOptions = ["Enrollment", "Event", "Academic"];



  const [existingFiles, setExistingFiles] = useState([]); // Files from DB
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState([]); // New uploads
  const [filesToRemove, setFilesToRemove] = useState([]); // Files to delete




  // Alert Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' or 'error'




  // Fetch announcements
  useEffect(() => {
    fetchAnnouncementsData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown !== null) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const fetchAnnouncementsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch announcements");

      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error.message || error);
      
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filtered = announcements
    .filter((a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((a) => (filterCategory ? a.category === filterCategory : true));

  // Modal handlers
  const handleAddAnnouncement = () => {
    setSelectedAnnouncement({
      title: "",
      description: "",
      category: "",
      files: []
    });
    setUploadedFiles([]);
    setFilePreview([]);
    setModalType("add");
    setShowModal(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement({ ...announcement });
    setExistingFiles(announcement.files || []); // Existing files from DB
    setNewlyUploadedFiles([]); // Clear newly uploaded
    setFilesToRemove([]); // Clear removal list
    setUploadedFiles([]);
    setFilePreview([]);
    setModalType("edit");
    setShowModal(true);
  };


  const handleDeleteAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setModalType("delete");
    setShowModal(true);
  };



  // File handling
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: event.target.result,
          file: file,
          isNew: true // Mark as newly uploaded
        };
        
        if (modalType === "edit") {
          setNewlyUploadedFiles(prev => [...prev, fileData]);
        }
        setUploadedFiles(prev => [...prev, fileData]);
        setFilePreview(prev => [...prev, fileData]);
      };
      
      reader.readAsDataURL(file);
    });
  };


  // Add function to remove existing file
  const handleRemoveExistingFile = (fileUrl) => {
    setExistingFiles(prev => prev.filter(f => f.url !== fileUrl));
    setFilesToRemove(prev => [...prev, fileUrl]);
  };

  
  const handleRemoveFile = (index) => {
    setNewlyUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreview(prev => prev.filter((_, i) => i !== index));
  };


  // Toggle dropdown
  const toggleDropdown = (e, announcementId) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === announcementId ? null : announcementId);
  };

  // Handle image click to open fullview
  const handleImageClick = (imageUrl, imageName) => {
    setSelectedImage({ url: imageUrl, name: imageName });
    setShowImageModal(true);
  };

  // Submit (create/update)
  // Update handleSubmitAnnouncement
  const handleSubmitAnnouncement = async () => {
    if (
      !selectedAnnouncement.title.trim() ||
      !selectedAnnouncement.description.trim() ||
      !selectedAnnouncement.category
    ) {
      showAlert("Please fill in all required fields!", 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", selectedAnnouncement.title);
      formData.append("description", selectedAnnouncement.description);
      formData.append("category", selectedAnnouncement.category);

      // For edit mode, send files to remove
      if (modalType === "edit" && filesToRemove.length > 0) {
        formData.append("filesToRemove", JSON.stringify(filesToRemove));
      }

      // Append newly uploaded files only
      uploadedFiles.forEach((fileData) => {
        if (fileData.file) {
          formData.append("files", fileData.file);
        }
      });

      const url =
        modalType === "add"
          ? `${import.meta.env.VITE_API_URL}/api/addAnnouncement`
          : `${import.meta.env.VITE_API_URL}/api/updateAnnouncement/${selectedAnnouncement._id}`;
      const method = modalType === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      
      showAlert(data.message, 'success');
      setShowModal(false);
      setUploadedFiles([]);
      setFilePreview([]);
      setExistingFiles([]);
      setNewlyUploadedFiles([]);
      setFilesToRemove([]);
      fetchAnnouncementsData();
    } catch (error) {
      alert(`Failed to ${modalType} announcement: ${error.message}`);
    }
  };

  // Delete
  const confirmDelete = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/deleteAnnouncement/${selectedAnnouncement._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      alert(data.message);
      setShowModal(false);
      fetchAnnouncementsData();
    } catch (error) {
      alert("Failed to delete announcement: " + error.message);
    }
  };

  // Get category badge color
  const getCategoryBadge = (category) => {
    const colors = {
      Enrollment: "bg-primary",
      Event: "bg-success",
      Academic: "bg-warning text-dark"
    };
    return colors[category] || "bg-secondary";
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.includes("image")) return "fa-file-image";
    if (type.includes("pdf")) return "fa-file-pdf";
    if (type.includes("word")) return "fa-file-word";
    if (type.includes("excel") || type.includes("spreadsheet")) return "fa-file-excel";
    return "fa-file";
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };



  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };




  return (
    <>
      <div className="container-fluid py-4 g-0 g-md-5 ">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="text-capitalize fw-bold mb-1">Announcement Management</h4>
                <p className="text-muted small mb-0">Create and manage school announcements</p>
              </div>
              <button className="btn btn-danger" onClick={handleAddAnnouncement}>
                <i className="fa fa-plus me-2"></i>
                New Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fa fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-3 mt-2 mt-md-0">
            <select 
              className="form-select" 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4 mt-2 mt-md-0 text-end">
            <p className="text-muted mb-0 mt-2">
              Total: <strong>{filtered.length}</strong> announcement{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Announcements Display - Facebook Style */}
        <div className="row">
          <div className="col-12">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading announcements...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="fa fa-bullhorn fa-3x text-muted mb-3"></i>
                <p className="text-muted">No announcements found</p>
              </div>
            ) : (
              <div style={{overflowY: "auto", scrollbarWidth: "hidden" }}>
                {filtered.map((announcement) => (
                  <div key={announcement._id} className="card shadow-sm mb-3">
                    <div className="card-body">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: "50px", height: "50px" }}>
                              <i className="fa fa-bullhorn text-white fa-lg"></i>
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold text-capitalize">{announcement.title}</h5>
                              <small className="text-muted">
                                Posted by {announcement.postedBy || "Admin"} • {formatDate(announcement.createdAt)}
                              </small>
                            </div>
                          </div>
                          <span className={`badge ${getCategoryBadge(announcement.category)} mb-2`}>
                            {announcement.category}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="dropdown position-relative">
                          <button 
                            className="btn btn-sm btn-light" 
                            type="button"
                            onClick={(e) => toggleDropdown(e, announcement._id)}
                          >
                            <i className="fa fa-ellipsis-v"></i>
                          </button>
                          {openDropdown === announcement._id && (
                            <ul 
                              className="dropdown-menu dropdown-menu-end show position-absolute"
                              style={{ right: 0, top: '100%' }}
                            >
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={() => {
                                    handleEditAnnouncement(announcement);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <i className="fa fa-edit me-2"></i>Edit
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button 
                                  className="dropdown-item text-danger" 
                                  onClick={() => {
                                    handleDeleteAnnouncement(announcement);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <i className="fa fa-trash me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
                        {announcement.description}
                      </p>

                      {/* Files Display */}
                      {announcement.files && announcement.files.length > 0 && (
                        <div className="border rounded p-3 bg-light">
                          <h6 className="fw-bold mb-3">
                            <i className="fa fa-paperclip me-2"></i>
                            Attachments ({announcement.files.length})
                          </h6>
                          
                          {/* All Files - List View */}
                          <div className="row g-2">
                            {announcement.files.map((file, idx) => (
                              <div key={idx} className="col-12">
                                <div 
                                  className="d-flex align-items-center p-2 bg-white rounded border"
                                  style={{ cursor: file.type?.includes("image") ? "pointer" : "default" }}
                                  onClick={() => {
                                    if (file.type?.includes("image")) {
                                      handleImageClick(`${import.meta.env.VITE_API_URL}/api${file.url}`, file.name);
                                    }
                                  }}
                                >
                                  <i className={`fa ${getFileIcon(file.type)} fa-2x text-danger me-3`}></i>
                                  <div className="flex-grow-1 text-truncate">
                                    <p className="mb-0 fw-semibold text-truncate">{file.name}</p>
                                    <small className="text-muted">
                                      {file.size ? formatFileSize(file.size) : "N/A"}
                                    </small>
                                  </div>
                                  {!file.type?.includes("image") && (
                                    <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-primary ms-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <i className="fa fa-download"></i>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable
            ${modalType === "delete" ? "" : "modal-lg"}`}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-capitalize">
                  {modalType === "add" && "Create New Announcement"}
                  {modalType === "edit" && "Edit Announcement"}
                  {modalType === "delete" && "Delete Announcement"}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              {/* Add/Edit Mode */}
              {(modalType === "add" || modalType === "edit") && (
                <>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label text-capitalize fw-bold">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter announcement title"
                        value={selectedAnnouncement?.title || ""}
                        onChange={(e) => 
                          setSelectedAnnouncement({ ...selectedAnnouncement, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-capitalize fw-bold">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Enter announcement description"
                        value={selectedAnnouncement?.description || ""}
                        onChange={(e) => 
                          setSelectedAnnouncement({ ...selectedAnnouncement, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-capitalize fw-bold">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedAnnouncement?.category || ""}
                        onChange={(e) => 
                          setSelectedAnnouncement({ ...selectedAnnouncement, category: e.target.value })
                        }
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-3">
                      <label className="form-label text-capitalize fw-bold">
                        Upload Files
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <small className="text-muted">
                        You can upload multiple files (Images, PDF, Word, Excel)
                      </small>
                    </div>


                  {/* Uploaded Files Preview */}
                  {modalType === "edit" && (
                    <>
                      {/* Existing Files from DB */}
                      {existingFiles.length > 0 && (
                        <div className="border rounded p-3 bg-light mb-3">
                          <h6 className="fw-bold mb-3">
                            <i className="fa fa-database me-2"></i>
                            Existing Files ({existingFiles.length})
                          </h6>
                          <div className="row g-2">
                            {existingFiles.map((file, idx) => (
                              <div key={idx} className="col-12">
                                <div className="d-flex align-items-center p-2 bg-white rounded border cursor"
                                onClick={(e) => {
                                  handleImageClick(`${import.meta.env.VITE_API_URL}/api${file.url}`, file.name);
                                }}
                                >
                                  <i className={`fa ${getFileIcon(file.type)} fa-2x text-danger me-3`}></i>
                                  <div className="flex-grow-1 text-truncate">
                                    <p className="mb-0 fw-semibold text-truncate">{file.name}</p>
                                    <small className="text-muted">
                                      {formatFileSize(file.size)}
                                    </small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveExistingFile(file.url)
                                    }}
                                    title="Remove file"
                                  >
                                    <i className="fa fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Newly Uploaded Files */}
                      {newlyUploadedFiles.length > 0 && (
                        <div className="border rounded p-3 bg-light">
                          <h6 className="fw-bold mb-3">
                            <i className="fa fa-paperclip me-2"></i>
                            Newly Uploaded Files ({newlyUploadedFiles.length})
                          </h6>
                          <div className="row g-2">
                            {newlyUploadedFiles.map((file, idx) => (
                              <div key={idx} className="col-12">
                                <div className="d-flex align-items-center p-2 bg-white rounded border cursor"
                                onClick={() => {
                                  handleImageClick(file.url, file.name);
                                  
                                }}
                                
                                >
                                  <i className={`fa ${getFileIcon(file.type)} fa-2x text-danger me-3`}></i>
                                  <div className="flex-grow-1 text-truncate">
                                    <p className="mb-0 fw-semibold text-truncate">{file.name}</p>
                                    <small className="text-muted">
                                      {formatFileSize(file.size)}
                                    </small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    onClick={(e) => {
                                      e.stopPropagation();  
                                      handleRemoveFile(idx)
                                    }}
                                    title="Remove file"
                                  >
                                    <i className="fa fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                {/* For Add Mode - same as before */}
                {modalType === "add" && filePreview.length > 0 && (
                  <div className="border rounded p-3 bg-light">
                    <h6 className="fw-bold mb-3">
                      <i className="fa fa-paperclip me-2"></i>
                      Uploaded Files ({filePreview.length})
                    </h6>
                    <div className="row g-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {filePreview.map((file, idx) => (
                        <div key={idx} className="col-12">
                          <div className="d-flex align-items-center p-2 bg-white rounded border cursor"
                          onClick={()=> handleImageClick(file.url, file.name)}
                          >
                            <i className={`fa ${getFileIcon(file.type)} fa-2x text-danger me-3`}></i>
                            <div className="flex-grow-1 text-truncate">
                              <p className="mb-0 fw-semibold text-truncate">{file.name}</p>
                              <small className="text-muted">
                                {formatFileSize(file.size)}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              title="Remove file"
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleSubmitAnnouncement}
                    >
                      <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                      {modalType === 'add' ? 'Create Announcement' : 'Update Announcement'}
                    </button>
                  </div>
                </>
              )}

              {/* Delete Mode */}
              {modalType === "delete" && (
                <>
                  <div className="modal-body text-center">
                    <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 className="mb-3">Are you sure?</h5>
                    <p className="text-muted">
                      Do you really want to delete <strong>{selectedAnnouncement?.title}</strong>?
                      <br />This action cannot be undone.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={confirmDelete}
                    >
                      <i className="fa fa-trash me-2"></i>
                      Yes, Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Fullview Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999 }}
          onClick={() => setShowImageModal(false)}
        >
          <div className="modal-dialog modal-fullscreen m-0">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-header border-0 position-absolute w-100 top-0" style={{ zIndex: 10000 }}>
                <h5 className="modal-title text-white">{selectedImage.name}</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(false);
                  }}
                ></button>
              </div>
              <div className="modal-body d-flex align-items-center justify-content-center p-0">
                <img 
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="img-fluid"
                  style={{ 
                    maxWidth: "90%", 
                    maxHeight: "90vh",
                    objectFit: "contain"
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      )}


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

export default AnnouncementManagement;