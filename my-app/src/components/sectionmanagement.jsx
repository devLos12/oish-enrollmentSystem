import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import usePrograms from "./hooks/useProgram";
import * as XLSX from 'xlsx';







const SectionManagement = () => {
  const { setTextHeader, studentList } = useContext(globalContext);
  const location = useLocation();

  const navigate = useNavigate();

  
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


  const { trackOptions, getStrandOptions, allStrands } = usePrograms();
  
  const gradeOptions = [11, 12];
  const semesterOptions = [1, 2];


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);


  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);


  // ✅ Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('upload'); // 'upload' | 'preview'
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [editingRows, setEditingRows] = useState({});
  const [manualRows, setManualRows] = useState([]);


  





  const handleBulkImport = async () => {
    const allRows = [...excelData, ...manualRows];
    const errorRows = allRows.filter(r => r.hasError);

    if (errorRows.length > 0) {
      showAlert(`Please fix ${errorRows.length} row(s) with errors before importing.`, 'error');
      return;
    }
    
    if (allRows.length === 0) {
      showAlert('No data to import', 'error');
      return;
    }

    try {
      setIsProcessingExcel(true);
      const sections = allRows.map(row => ({
        name: row.name.trim().toUpperCase(),
        gradeLevel: parseInt(row.gradeLevel),
        track: row.track,
        strand: row.strand,
        maxCapacity: parseInt(row.maxCapacity) || 35
      }));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bulkAddSections`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sections })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showAlert(`Successfully imported ${data.imported} section(s)!`, 'success');
      handleCloseImportModal();
      fetchSectionsData();
    } catch (error) {
      showAlert('Failed to import: ' + error.message, 'error');
    } finally {
      setIsProcessingExcel(false);
    }
  };

  // ✅ Computed values
  const allRows = [...excelData, ...manualRows];
  const errorCount = allRows.filter(r => r.hasError).length;
  const validCount = allRows.filter(r => !r.hasError).length;













  // ✅ Update Excel row from preview
  const updateExcelRow = (index, fields) => {
    setExcelData(prev => {
      const updated = [...prev];
      const updatedRow = { ...updated[index], ...fields };

      const rowErrors = [];
      if (!updatedRow.name?.trim()) rowErrors.push('Section Name required');
      if (!updatedRow.gradeLevel) rowErrors.push('Grade Level required');
      if (!updatedRow.track?.trim()) rowErrors.push('Track required');
      if (!updatedRow.strand?.trim()) rowErrors.push('Strand required');
      
      const cap = parseInt(updatedRow.maxCapacity);
      if (isNaN(cap) || cap < 1 || cap > 100) {
        rowErrors.push('Capacity must be 1-100');
      }

      updatedRow.hasError = rowErrors.length > 0;
      updatedRow.errorMessages = rowErrors;
      updated[index] = updatedRow;
      return updated;
    });
  };

  const toggleEditRow = (index) => {
    setEditingRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const removeExcelRow = (index) => {
    setExcelData(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Manual row management
  const createEmptyRow = () => ({
    id: `manual-${Date.now()}-${Math.random()}`,
    name: '',
    gradeLevel: 11,
    track: '',
    strand: '',
    maxCapacity: 35,
    hasError: true,
    errorMessages: ['Fill in all fields'],
    isManual: true
  });

  const handleAddManualRow = () => {
    setManualRows(prev => [...prev, createEmptyRow()]);
    if (importStep === 'upload') setImportStep('preview');
  };

  const updateManualRow = (id, fields) => {
    setManualRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updatedRow = { ...r, ...fields };

      const rowErrors = [];
      if (!updatedRow.name?.trim()) rowErrors.push('Name required');
      if (!updatedRow.gradeLevel) rowErrors.push('Grade required');
      if (!updatedRow.track) rowErrors.push('Track required');
      if (!updatedRow.strand) rowErrors.push('Strand required');
      
      const cap = parseInt(updatedRow.maxCapacity);
      if (isNaN(cap) || cap < 1 || cap > 100) {
        rowErrors.push('Capacity 1-100');
      }

      updatedRow.hasError = rowErrors.length > 0;
      updatedRow.errorMessages = rowErrors;
      return updatedRow;
    }));
  };

  const handleDeleteManualRow = (id) => {
    setManualRows(prev => prev.filter(r => r.id !== id));
  };






  const handleFileUpload = (file) => {
    if (!file) return;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      showAlert('Please upload a valid Excel file (.xlsx or .xls)', 'error');
      return;
    }
    setExcelFile(file);
    processExcelFile(file);
  };


  const processExcelFile = async (file) => {
    try {
      setIsProcessingExcel(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const errors = [];
      const parsed = jsonData.map((row, index) => {
        const rowNum = index + 2;

        // ✅ Normalize column names (handle variations)
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
          const keyMap = {
            'sectionname': 'name',
            'section': 'name',
            'name': 'name',
            'gradelevel': 'gradeLevel',
            'grade': 'gradeLevel',
            'track': 'track',
            'strand': 'strand',
            'maxcapacity': 'maxCapacity',
            'capacity': 'maxCapacity'
          };
          const mappedKey = keyMap[normalizedKey] || key;
          normalizedRow[mappedKey] = row[key];
        });

        // ✅ Parse and normalize grade level
        let gradeLevel = normalizedRow.gradeLevel;
        if (typeof gradeLevel === 'string') {
          gradeLevel = parseInt(gradeLevel.replace(/\D/g, ''));
        }
        normalizedRow.gradeLevel = gradeLevel;

        // ✅ Normalize track (first letter capital)
        if (normalizedRow.track) {
          const track = normalizedRow.track.toString().trim();
          normalizedRow.track = track.charAt(0).toUpperCase() + track.slice(1).toLowerCase();
        }

        // ✅ Normalize strand (ALL CAPS)
        if (normalizedRow.strand) {
          normalizedRow.strand = normalizedRow.strand.toString().trim().toUpperCase();
        }

        // ✅ Parse capacity
        let capacity = normalizedRow.maxCapacity;
        if (typeof capacity === 'string') {
          capacity = parseInt(capacity.replace(/\D/g, ''));
        }
        normalizedRow.maxCapacity = capacity || 35;

        // ✅ VALIDATION RULES
        const rowErrors = [];
        
        if (!normalizedRow.name?.toString().trim()) 
          rowErrors.push('Section Name is required');
        
        if (!normalizedRow.gradeLevel) 
          rowErrors.push('Grade Level is required');
        
        if (!normalizedRow.track?.toString().trim()) 
          rowErrors.push('Track is required');
        
        if (!normalizedRow.strand?.toString().trim()) 
          rowErrors.push('Strand is required');

        // Grade level must be 11 or 12
        if (normalizedRow.gradeLevel && ![11, 12].includes(parseInt(normalizedRow.gradeLevel))) {
          rowErrors.push('Grade Level must be 11 or 12');
        }

        // Track validation
        if (normalizedRow.track && !trackOptions.includes(normalizedRow.track.toString().trim())) {
          rowErrors.push(`Invalid Track. Must be: ${trackOptions.join(', ')}`);
        }

        // Capacity validation
        if (normalizedRow.maxCapacity) {
          const cap = parseInt(normalizedRow.maxCapacity);
          if (isNaN(cap) || cap < 1 || cap > 100) {
            rowErrors.push('Capacity must be between 1 and 100');
          }
        }

        if (rowErrors.length > 0) {
          errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
        }

        return {
          id: `row-${index}-${Date.now()}`,
          name: normalizedRow.name?.toString().trim().toUpperCase() || '',
          gradeLevel: parseInt(normalizedRow.gradeLevel) || 11,
          track: normalizedRow.track?.toString().trim() || '',
          strand: normalizedRow.strand?.toString().trim().toUpperCase() || '',
          maxCapacity: normalizedRow.maxCapacity || 35,
          hasError: rowErrors.length > 0,
          errorMessages: rowErrors
        };
      });

      setExcelData(parsed);
      setImportErrors(errors);
      setImportStep('preview');
    } catch (error) {
      showAlert('Error processing Excel file: ' + error.message, 'error');
    } finally {
      setIsProcessingExcel(false);
    }
  };






  const downloadTemplate = () => {
    // ✅ Build template data dynamically from actual tracks and strands
    const templateData = [
      ['Section Name', 'Grade Level', 'Track', 'Strand', 'Max Capacity'],
    ];
  
    // ✅ Add example rows for each track + strand combination (first 2 strands per track)
    let exampleCounter = 1;
    for (const track of trackOptions) {
      const strandsForTrack = getStrandOptions(track);
      for (const strand of strandsForTrack.slice(0, 2)) { // Take first 2 strands as examples
        const gradeLevel = exampleCounter % 2 === 0 ? '12' : '11';
        const sectionLetter = String.fromCharCode(64 + (exampleCounter % 26)); // A, B, C...
        templateData.push([
          `${strand}-${sectionLetter}`,
          gradeLevel,
          track,
          strand,
          '35'
        ]);
        exampleCounter++;
      }
    }
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
  
    ws['!cols'] = [
      { wch: 20 }, // Section Name
      { wch: 14 }, // Grade Level
      { wch: 14 }, // Track
      { wch: 18 }, // Strand
      { wch: 14 }  // Max Capacity
    ];
  
    // ✅ Add info sheet showing ACTUAL available strands per track
    const infoData = [
      ['Available Tracks and Strands'],
      [],
    ];
    
    for (const track of trackOptions) {
      const strandsForTrack = getStrandOptions(track);
      infoData.push([`${track}:`]);
      for (const strand of strandsForTrack) {
        infoData.push([`  • ${strand}`]);
      }
      infoData.push([]); // Empty row for spacing
    }
  
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 30 }];
  
    XLSX.utils.book_append_sheet(wb, ws, 'Sections Template');
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Available Strands');
    XLSX.writeFile(wb, `sections_import_template.xlsx`);
  };
  
  
  // ✅ ALTERNATIVE: If you want JUST the template without the info sheet
  // Use this simpler version:
  
  const downloadTemplateSimple = () => {
    const templateData = [
      ['Section Name', 'Grade Level', 'Track', 'Strand', 'Max Capacity'],
    ];
  
    // Build example data from actual tracks and strands
    let exampleCounter = 1;
    for (const track of trackOptions) {
      const strandsForTrack = getStrandOptions(track);
      for (const strand of strandsForTrack) {
        const gradeLevel = exampleCounter % 2 === 0 ? '12' : '11';
        const sectionLetter = String.fromCharCode(64 + (exampleCounter % 10)); // A-J
        templateData.push([
          `${strand}-${sectionLetter}`,
          gradeLevel,
          track,
          strand,
          '35'
        ]);
        exampleCounter++;
        if (exampleCounter > 10) break; // Limit to 10 example rows
      }
      if (exampleCounter > 10) break;
    }
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
  
    ws['!cols'] = [
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 }
    ];
  
    XLSX.utils.book_append_sheet(wb, ws, 'Sections Template');
    XLSX.writeFile(wb, `sections_import_template.xlsx`);
  };



  const handleOpenImportModal = () => {
    resetImportState();
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    resetImportState();
  };

  const resetImportState = () => {
    setExcelFile(null);
    setExcelData([]);
    setImportErrors([]);
    setManualRows([]);
    setEditingRows({});
    setImportStep('upload');
  };





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

    navigate(`/admin/student-section-list`, { state: { 
      sectionId: section._id,
      sectionName: section.name,
      title: "Section Management"
    } });



    // setSelectedSection(section);
    // setModalType("view");
    // setShowModal(true);
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
      !selectedSection.gradeLevel
    ) {
      showAlert("Input Field Required!", 'error');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: selectedSection.name,
        gradeLevel: parseInt(selectedSection.gradeLevel),
        track: selectedSection.track,
        strand: selectedSection.strand,
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
    } finally {
      setSubmitting(false);
    }
  };


  // delete
  const confirmDelete = async () => {
      try {
        setDeleting(true);
        
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
      } finally {
        setDeleting(false);
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
        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <i className="fa fa-chevron-left"></i>
        </button>
      </li>
    );

    if (startPage > 1) {
      pages.push(<li key={1} className="page-item"><button className="page-link" onClick={() => handlePageChange(1)}>1</button></li>);
      if (startPage > 2) pages.push(<li key="ellipsis1" className="page-item disabled"><span className="page-link">...</span></li>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push(<li key="ellipsis2" className="page-item disabled"><span className="page-link">...</span></li>);
      pages.push(<li key={totalPages} className="page-item"><button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button></li>);
    }

    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
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
          <div className="col-12 ">
              <h4 className="text-capitalize fw-bold mb-1">section management</h4>
              <p className="text-muted small mb-0">Create and manage sections for SHS</p>
          </div>

          <div className="col-12 mt-3 mt-md-0 d-flex justify-content-start justify-content-md-end gap-2">
            <button className="btn btn-outline-danger btn-sm" onClick={handleOpenImportModal}>
              <i className="fa fa-file-excel me-2"></i>Import Excel
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleAddSection}>
              <i className="fa fa-plus me-2"></i>
              Add Section
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchSectionsData}
              disabled={loading}
              title="Refresh sections data"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="fa fa-refresh"></i>
              )}
            </button>
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
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 mt-2 mt-md-0">
            <select className="form-select" value={filterStrand} onChange={(e) => setFilterStrand(e.target.value)}>
              <option value="">All Strands</option>
                {allStrands.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </select>
          </div>

          <div className="col-12 col-md-2 mt-2 mt-md-0 text-end">
            <p className="text-muted mb-0 mt-2">Total: <strong>{filtered.length}</strong></p>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
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
                            <td className="align-middle fw-semibold">
                              
                              <span className="badge bg-danger">
                                {sec.name}
                              </span>
                            </td>
                            <td className="align-middle">
                              <p className="m-0 text-muted fw-semibold">{sec.strand || "N/A"}</p>
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
                                className="form-select"
                                value={sec.isOpenEnrollment}
                                onChange={(e) => handleEnrollmentStatusChange(sec._id, e.target.value === "true")}
                                disabled={(sec.gradeLevel === 11 && sec.semester === 1 )}
                              >
                                <option value={"false"}>Closed Enrollment</option>
                                <option value={"true"}>Open Enrollment</option>
                              </select> 
                            </td>
                            <td className="align-middle">
                              <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-sm btn-outline-primary text-capitalize" 
                                onClick={() => handleViewSection(sec)} title="View Students">
                                  students
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
                        <ul className="pagination mb-0">{renderPagination()}</ul>
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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered ${modalType === "delete" ? "" : "modal-lg"}`}>
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
                      <p className="fw-semibold">{selectedSection?.semester === 1 ? "First" : "Second"}</p>
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
                            <option key={t} value={t}>{t}</option>
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
                            {getStrandOptions(selectedSection?.track).map((s) => (
                                <option key={s} value={s}>{s}</option>
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
                          placeholder="e.g. STEM-A"
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
                          onChange={(e) => setSelectedSection({ ...selectedSection, gradeLevel: parseInt(e.target.value) })}
                        >
                          {gradeOptions.map((g) => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Semester is auto-set from active school year — no need for UI input
                      <div className="col-6">
                        <label className="form-label text-capitalize fw-bold">Semester</label>
                        <select
                          className="form-select"
                          value={selectedSection?.semester || 1}
                          onChange={(e) => setSelectedSection({ ...selectedSection, semester: parseInt(e.target.value) })}
                          disabled
                        >
                          {semesterOptions.map((s) => (
                            <option key={s} value={s}>
                              {s === 1 ? "First" : "Second"}
                            </option>
                          ))}
                        </select>
                      </div> */}
                    </div>
                  </div>

                  <div className="modal-footer">  
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleSubmitSection}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {modalType === 'add' ? 'Adding...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                          {modalType === 'add' ? 'Add Section' : 'Update Section'}
                        </>
                      )}
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
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={confirmDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-trash me-2"></i>
                          Yes, Delete
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
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


      {/* ============================================================
    ✅ Import Excel Modal
      ============================================================ */}
      {showImportModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa fa-file-excel me-2 text-success"></i>
                  Import Sections from Excel
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseImportModal} disabled={isProcessingExcel}></button>
              </div>

              <div className="modal-body">

                {/* ---- STEP: UPLOAD ---- */}
                {importStep === 'upload' && (
                  <div>
                    {/* Info Banner */}
                    <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
                      <i className="fa fa-info-circle mt-1"></i>
                      <div>
                        <strong>Prepare your Excel file before uploading.</strong><br />
                        <span className="text-muted small">
                          Section names must be unique. Grade Level must be 11 or 12.
                          Track must be <strong>Academic</strong> or <strong>TVL</strong>.
                          Max Capacity should be between 1 and 100.
                        </span>
                      </div>
                    </div>

                    {/* Download Template */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <p className="text-muted mb-0 small">
                        <i className="fa fa-lightbulb-o me-1 text-warning"></i>
                        Download the template first, fill it in, then upload below.
                      </p>
                      <button className="btn btn-sm btn-outline-success" onClick={downloadTemplate}>
                        <i className="fa fa-download me-2"></i>Download Template (.xlsx)
                      </button>
                    </div>

                    {/* Column Guide */}
                    <div className="table-responsive mb-4">
                      <table className="table table-sm table-bordered text-center mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Column A</th>
                            <th>Column B</th>
                            <th>Column C</th>
                            <th>Column D</th>
                            <th>Column E</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Section Name</strong><br /><span className="text-muted">e.g. STEM-A</span></td>
                            <td><strong>Grade Level</strong><br /><span className="text-muted">11 or 12</span></td>
                            <td><strong>Track</strong><br /><span className="text-muted">Academic or TVL</span></td>
                            <td><strong>Strand</strong><br /><span className="text-muted">e.g. STEM, ABM</span></td>
                            <td><strong>Max Capacity</strong><br /><span className="text-muted">1-100 (default: 35)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Drag & Drop Upload Area */}
                    <div
                      className="border border-2 border-dashed rounded-3 text-center p-5"
                      style={{ borderColor: '#dee2e6', background: '#f8f9fa', cursor: 'pointer' }}
                      onClick={() => document.getElementById('sectionExcelInput').click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileUpload(file);
                      }}
                    >
                      {isProcessingExcel ? (
                        <>
                          <span className="spinner-border text-danger mb-3 d-block mx-auto" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                          <p className="mb-0 fw-semibold text-muted">Processing file...</p>
                        </>
                      ) : (
                        <>
                          <i className="fa fa-cloud-upload fa-3x text-muted mb-3 d-block"></i>
                          <p className="mb-1 fw-semibold">Click to upload or drag & drop</p>
                          <p className="text-muted small mb-0">Accepts .xlsx or .xls files</p>
                        </>
                      )}
                      <input
                        id="sectionExcelInput"
                        type="file"
                        accept=".xlsx,.xls"
                        className="d-none"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                      />
                    </div>

                    {/* Or add manually */}
                    <div className="text-center mt-3">
                      <span className="text-muted small">— or —</span>
                      <div className="mt-2">
                        <button className="btn btn-sm btn-outline-success" onClick={handleAddManualRow}>
                          <i className="fa fa-plus me-1"></i>Add Row Manually
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- STEP: PREVIEW ---- */}
                {importStep === 'preview' && (
                  <div>
                    {/* Summary Bar */}
                    <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                      <span className="badge bg-primary fs-6 px-3 py-2">
                        <i className="fa fa-table me-1"></i>{allRows.length} row(s)
                      </span>
                      {validCount > 0 && (
                        <span className="badge bg-success fs-6 px-3 py-2">
                          <i className="fa fa-check me-1"></i>{validCount} valid
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="badge bg-danger fs-6 px-3 py-2">
                          <i className="fa fa-times me-1"></i>{errorCount} error(s)
                        </span>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary ms-auto"
                        onClick={() => setImportStep('upload')}
                        disabled={isProcessingExcel}
                      >
                        <i className="fa fa-arrow-left me-1"></i>Upload Different File
                      </button>
                    </div>

                    {/* Error Summary */}
                    {importErrors.length > 0 && (
                      <div className="alert alert-warning mb-3" style={{ fontSize: '0.85rem' }}>
                        <strong><i className="fa fa-exclamation-triangle me-1"></i>Fix errors before importing:</strong>
                        <ul className="mb-0 mt-2 ps-3">
                          {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-sm table-bordered align-middle">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Section Name</th>
                            <th>Grade</th>
                            <th>Track</th>
                            <th>Strand</th>
                            <th>Capacity</th>
                            <th style={{ width: '100px' }} className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Excel rows */}
                          {excelData.map((row, idx) => {
                            const isEditing = editingRows[idx];
                            const rowClass = row.hasError ? 'table-danger' : 'table-success';
                            return (
                              <tr key={row.id} className={rowClass}>
                                <td className="text-center">
                                  {row.hasError
                                    ? <i className="fa fa-times-circle text-danger" title={row.errorMessages?.join(', ')}></i>
                                    : <i className="fa fa-check-circle text-success"></i>
                                  }
                                </td>

                                {/* Section Name */}
                                <td>
                                  {isEditing ? (
                                    <input type="text" className="form-control form-control-sm"
                                      value={row.name}
                                      onChange={(e) => updateExcelRow(idx, { name: e.target.value })} />
                                  ) : (
                                    <span>{row.name || <span className="text-danger fst-italic">missing</span>}</span>
                                  )}
                                </td>

                                {/* Grade Level */}
                                <td>
                                  {isEditing ? (
                                    <select className="form-select form-select-sm"
                                      value={row.gradeLevel}
                                      onChange={(e) => updateExcelRow(idx, { gradeLevel: parseInt(e.target.value) })}>
                                      <option value={11}>Grade 11</option>
                                      <option value={12}>Grade 12</option>
                                    </select>
                                  ) : `Grade ${row.gradeLevel}`}
                                </td>

                                {/* Track */}
                                <td>
                                  {isEditing ? (
                                    <select className="form-select form-select-sm"
                                      value={row.track}
                                      onChange={(e) => updateExcelRow(idx, { track: e.target.value })}>
                                      <option value="">Select</option>
                                      {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  ) : row.track || <span className="text-danger fst-italic">missing</span>}
                                </td>

                                {/* Strand */}
                                <td>
                                  {isEditing ? (
                                    <select className="form-select form-select-sm"
                                      value={row.strand}
                                      onChange={(e) => updateExcelRow(idx, { strand: e.target.value })}
                                      disabled={!row.track}>
                                      <option value="">Select</option>
                                      {row.track && getStrandOptions(row.track).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  ) : row.strand || <span className="text-danger fst-italic">missing</span>}
                                </td>

                                {/* Capacity */}
                                <td>
                                  {isEditing ? (
                                    <input type="number" className="form-control form-control-sm"
                                      value={row.maxCapacity} min="1" max="100"
                                      onChange={(e) => updateExcelRow(idx, { maxCapacity: parseInt(e.target.value) })} />
                                  ) : row.maxCapacity}
                                </td>

                                {/* Actions */}
                                <td className="text-center">
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button
                                      className={`btn btn-sm ${isEditing ? 'btn-success' : 'btn-outline-warning'}`}
                                      onClick={() => toggleEditRow(idx)}
                                      title={isEditing ? 'Done' : 'Edit'}
                                      disabled={isProcessingExcel}
                                    >
                                      <i className={`fa ${isEditing ? 'fa-check' : 'fa-edit'}`}></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeExcelRow(idx)}
                                      title="Remove row"
                                      disabled={isProcessingExcel}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Manual rows */}
                          {manualRows.map((row) => (
                            <tr key={row.id} className={row.hasError ? 'table-danger' : 'table-success'}>
                              <td className="text-center">
                                {row.hasError
                                  ? <i className="fa fa-times-circle text-danger" title={row.errorMessages?.join(', ')}></i>
                                  : <i className="fa fa-check-circle text-success"></i>
                                }
                              </td>
                              <td>
                                <input type="text" className="form-control form-control-sm"
                                  value={row.name} placeholder="Section Name"
                                  onChange={(e) => updateManualRow(row.id, { name: e.target.value })} />
                              </td>
                              <td>
                                <select className="form-select form-select-sm" value={row.gradeLevel}
                                  onChange={(e) => updateManualRow(row.id, { gradeLevel: parseInt(e.target.value) })}>
                                  <option value={11}>Grade 11</option>
                                  <option value={12}>Grade 12</option>
                                </select>
                              </td>
                              <td>
                                <select className="form-select form-select-sm" value={row.track}
                                  onChange={(e) => updateManualRow(row.id, { track: e.target.value })}>
                                  <option value="">Select</option>
                                  {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>
                              <td>
                                <select className="form-select form-select-sm" value={row.strand}
                                  onChange={(e) => updateManualRow(row.id, { strand: e.target.value })}
                                  disabled={!row.track}>
                                  <option value="">Select</option>
                                  {row.track && getStrandOptions(row.track).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td>
                                <input type="number" className="form-control form-control-sm"
                                  value={row.maxCapacity} min="1" max="100" placeholder="35"
                                  onChange={(e) => updateManualRow(row.id, { maxCapacity: parseInt(e.target.value) })} />
                              </td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteManualRow(row.id)}
                                  disabled={isProcessingExcel}>
                                  <i className="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add manual row button */}
                    <div className="p-3 border-top d-flex align-items-center gap-3">
                      <button className="btn btn-sm btn-outline-success" onClick={handleAddManualRow}>
                        <i className="fa fa-plus me-1"></i>Add Row Manually
                      </button>
                      {manualRows.length > 0 && (
                        <small className="text-muted">{manualRows.length} manual row(s) added</small>
                      )}
                    </div>

                    {errorCount > 0 && (
                      <p className="text-muted small mt-2 mb-0">
                        <i className="fa fa-info-circle me-1"></i>
                        Red rows have errors. Click the <strong>edit</strong> button to fix them inline, or <strong>remove</strong> the row.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseImportModal} disabled={isProcessingExcel}>
                  Cancel
                </button>
                {importStep === 'preview' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleBulkImport}
                    disabled={allRows.length === 0 || errorCount > 0 || isProcessingExcel}
                  >
                    {isProcessingExcel ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Importing...</>
                    ) : (
                      <><i className="fa fa-upload me-2"></i>Import {validCount} Section(s)</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default SectionManagement;