import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";


const SectionManagement = () => {
  const { setTextHeader, studentList } = useContext(globalContext);
  const location = useLocation();

  useLayoutEffect(() => {
    setTextHeader(location?.state?.title || "Section Management");
  }, [location?.state?.title]);

  // state
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStrand, setFilterStrand] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add' | 'edit' | 'delete' | 'view'
  const [selectedSection, setSelectedSection] = useState(null);

  // Alert Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' or 'error'

  // options (adjust to your school's lists)
  const trackOptions = ["Academic", "TVL"];
  const trackToStrand = {
    Academic: ["STEM", "ABM", "HUMSS"],
    TVL: ["Home Economics", "ICT", "Industrial Arts"],
  };
  const gradeOptions = [11, 12];
  const semesterOptions = [1, 2];


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);





  // Alert function
  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // fetch sections
  useEffect(() => {
    fetchSectionsData();
  }, []);

  const fetchSectionsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sections`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch sections");

      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error.message || error);
      showAlert("Failed to load sections data", 'error');
    } finally {
      setLoading(false);
    }
  };

  // filtered list for table
  const filtered = sections
    .filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.strand || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((s) => (filterGrade ? s.gradeLevel === parseInt(filterGrade) : true))
    .filter((s) => (filterStrand ? s.strand === filterStrand : true));
  

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSections = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGrade, filterStrand]);







  // modal handlers
  const handleAddSection = () => {
    setSelectedSection({
      name: "",
      gradeLevel: 11,
      track: "",
      strand: "",
      semester: 1,
      students: [],
      maxCapacity: 35,
    });
    setModalType("add");
    setShowModal(true);
  };

  const handleViewSection = (section) => {
    setSelectedSection(section);
    setModalType("view");
    setShowModal(true);
  };

  const handleEditSection = (section) => {
    setSelectedSection({ ...section });
    setModalType("edit");
    setShowModal(true);
  };

  const handleDeleteSection = (section) => {
    setSelectedSection(section);
    setModalType("delete");
    setShowModal(true);
  };

  // submit (create / update)
  const handleSubmitSection = async () => {
    // basic validation
    if (
      !selectedSection.name.trim() ||
      !selectedSection.track.trim() ||
      !selectedSection.strand.trim() ||
      !selectedSection.gradeLevel ||
      !selectedSection.semester
    ) {
      showAlert("Input Field Required!", 'error');
      return;
    }

    try {
      const payload = {
        name: selectedSection.name,
        gradeLevel: parseInt(selectedSection.gradeLevel),
        track: selectedSection.track,
        strand: selectedSection.strand,
        semester: parseInt(selectedSection.semester),
        maxCapacity: parseInt(selectedSection.maxCapacity) || 35,
      };

      const url =
        modalType === "add"
          ? `${import.meta.env.VITE_API_URL}/api/addSection`
          : `${import.meta.env.VITE_API_URL}/api/updateSection/${selectedSection._id}`;
      const method = modalType === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      showAlert(data.message, 'success');
      setShowModal(false);
      fetchSectionsData();
    } catch (error) {
      showAlert(`Failed to ${modalType} section: ${error.message}`, 'error');
    }
  };

  // delete
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteSection/${selectedSection._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showAlert(data.message, 'success');
      setShowModal(false);
      fetchSectionsData();
    } catch (error) {
      showAlert(`Failed to delete section: ${error.message}`, 'error');
    }
  };

  // update enrollment status
  const handleEnrollmentStatusChange = async (sectionId, isOpen) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateEnrollment/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isOpen }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showAlert(data.message, 'success');      
      fetchSectionsData(); 
    } catch (error) {
      showAlert(`Failed to update enrollment status: ${error.message}`, 'error');
    }
  };

  // helper: student count and capacity status
  const getStudentCount = (sec) => (Array.isArray(sec.students) ? sec.students.length : sec.studentsCount || 0);

  const isFull = (sec) => getStudentCount(sec) >= (sec.maxCapacity || 35);



  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa fa-chevron-left"></i>
        </button>
      </li>
    );

    if (startPage > 1) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            1
          </button>
        </li>
      );
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fa fa-chevron-right"></i>
        </button>
      </li>
    );

    return pages;
  };


  return (
    <>
      <div className="container-fluid py-4 g-0 g-md-5 ">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="text-capitalize fw-bold mb-1">section management</h4>
                <p className="text-muted small mb-0">Create and manage sections for SHS</p>
              </div>
              <button className="btn btn-danger" onClick={handleAddSection}>
                <i className="fa fa-plus me-2"></i>
                Add Section
              </button>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fa fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by section name or strand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-3 mt-2 mt-md-0">
            <select className="form-select" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
              <option value="">All Grade Levels</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 mt-2 mt-md-0">
            <select className="form-select" value={filterStrand} onChange={(e) => setFilterStrand(e.target.value)}>
              <option value="">All Strands</option>
              {Object.values(trackToStrand)
                .flat()
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>

          <div className="col-12 col-md-2 mt-2 mt-md-0 text-end">
            <p className="text-muted mb-0 mt-2">
              Total: <strong>{filtered.length}</strong>
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading sections data...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fa fa-users fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No sections found</p>
                  </div>
                ) : (
                  <>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="text-capitalize fw-semibold">#</th>
                          <th className="text-capitalize fw-semibold">Section Name</th>
                          <th className="text-capitalize fw-semibold">Strand</th>
                          <th className="text-capitalize fw-semibold">Grade</th>
                          <th className="text-capitalize fw-semibold">Semester</th>
                          <th className="text-capitalize fw-semibold">Students</th>
                          <th className="text-capitalize fw-semibold">Capacity</th>
                          <th className="text-capitalize fw-semibold">Enrollment Status</th>
                          <th className="text-capitalize fw-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSections.map((sec, idx) => (
                          <tr key={sec._id || sec.id}>
                            <td className="align-middle">{indexOfFirstItem + idx + 1}</td>
                            <td className="align-middle fw-semibold">{sec.name}</td>
                            <td className="align-middle">
                              <span className="badge bg-danger">{sec.strand || 'N/A'}</span>
                            </td>
                            <td className="align-middle">Grade {sec.gradeLevel}</td>
                            <td className="align-middle small">{sec.semester === 1 ? "First" : "Second"}</td>
                            <td className="align-middle">{getStudentCount(sec)}</td>
                            <td className="align-middle">
                              {getStudentCount(sec)} / {sec.maxCapacity || 35}
                              {isFull(sec) && <span className="badge bg-warning text-dark ms-2">Full</span>}
                            </td>
                            <td className="align-middle">
                              <select 
                                className={`form-select`}
                                value={sec.isOpenEnrollment}
                                onChange={(e) => handleEnrollmentStatusChange(sec._id, e.target.value === "true" )}
                                disabled={sec.gradeLevel === 11}
                              >
                                <option value={"false"}>Closed Enrollment</option>
                                <option value={"true"}>Open Enrollment</option>
                              </select> 
                            </td>
                            <td className="align-middle">
                              <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewSection(sec)} title="View Details">
                                  <i className="fa fa-eye"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditSection(sec)} title="Edit">
                                  <i className="fa fa-edit"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(sec)} title="Delete">
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 0 && (
                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                      <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          {renderPagination()}
                        </ul>
                      </nav>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block " style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered 
            ${modalType === "delete" ? "" : "modal-lg"}`}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-capitalize">
                  {modalType === "view" && "Section Details"}
                  {modalType === "add" && "Add New Section"}
                  {modalType === "edit" && "Edit Section"}
                  {modalType === "delete" && "Delete Section"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              {modalType === "view" && (
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="text-muted small text-uppercase">Section Name</label>
                    <p className="fw-semibold">{selectedSection?.name}</p>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="text-muted small text-uppercase">Track</label>
                      <p className="fw-semibold">{selectedSection?.track || 'N/A'}</p>
                    </div>
                    <div className="col-6">
                      <label className="text-muted small text-uppercase">Strand</label>
                      <p className="fw-semibold">{selectedSection?.strand || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="text-muted small text-uppercase">Grade Level</label>
                      <p className="fw-semibold">Grade {selectedSection?.gradeLevel}</p>
                    </div>
                    <div className="col-6">
                      <label className="text-muted small text-uppercase">Semester</label>
                      <p className="fw-semibold">{selectedSection?.semester}</p>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="text-muted small text-uppercase">Students</label>
                      <p className="fw-semibold">{getStudentCount(selectedSection)} / {selectedSection?.maxCapacity || 35}</p>
                    </div>
                  </div>
                </div>
              )}

              {(modalType === "add" || modalType === "edit") && (
                <>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Track</label>
                        <select
                          className="form-select"
                          value={selectedSection?.track || ""}
                          onChange={(e) => setSelectedSection({ ...selectedSection, track: e.target.value, strand: "" })}
                        >
                          <option value="">Select Track</option>
                          {trackOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Strand</label>
                        <select
                          className="form-select"
                          value={selectedSection?.strand || ""}
                          onChange={(e) => setSelectedSection({ ...selectedSection, strand: e.target.value })}
                          disabled={!selectedSection?.track}
                        >
                          <option value="">{!selectedSection?.track ? "Select Track First" : "Select Strand"}</option>
                          {selectedSection?.track &&
                            trackToStrand[selectedSection.track].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Section Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. ABM-11-A"
                          value={selectedSection?.name || ""}
                          onChange={(e) => setSelectedSection({ ...selectedSection, name: e.target.value })}
                        />
                      </div>

                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Max Capacity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={selectedSection?.maxCapacity}
                          onChange={(e) => setSelectedSection({ ...selectedSection, maxCapacity: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Grade Level</label>
                        <select
                          className="form-select"
                          value={selectedSection?.gradeLevel || 11}
                          onChange={(e) => {
                            const newGrade = parseInt(e.target.value);
                            setSelectedSection({ 
                              ...selectedSection, 
                              gradeLevel: newGrade,
                              semester: 1
                            });
                          }}
                          disabled={selectedSection.gradeLevel !== 11}
                        >
                          {gradeOptions.map((g) => (
                            <option key={g} value={g}>
                              Grade {g}
                            </option>
                          ))}
                        </select>
                      </div>

                     <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Semester</label>
                        <select
                          className="form-select"
                          value={selectedSection?.semester || 1}
                          onChange={(e) => setSelectedSection({ ...selectedSection, semester: parseInt(e.target.value) })}
                          disabled={selectedSection?.semester !== 1}
                        >
                          {semesterOptions.map((s) => (
                            <option key={s} value={s}>
                              {s === 1 ? "First" : "Second"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">  
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleSubmitSection}>
                      <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                      {modalType === 'add' ? 'Add Section' : 'Update Section'}
                    </button>
                  </div>
                </>
              )}

              {modalType === "delete" && (
                <>
                  <div className="modal-body text-center">
                    <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 className="mb-3">Are you sure?</h5>
                    <p className="text-muted">
                      Do you really want to delete <strong>{selectedSection?.name}</strong>?
                      <br />This action cannot be undone. Make sure the section has no students before deleting.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmDelete}>
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

export default SectionManagement;