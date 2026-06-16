import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; 
import html2pdf from "html2pdf.js";
import Add_Applicants from "./add-applicants-form";






const Applicants = () => {
    const { setTextHeader, role, 
        fetchPendingApplicantsCount
     } = useContext(globalContext);
    const location = useLocation();
    
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    
    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    
    const [modalLoading, setModalLoading] = useState(false);

    const [rejectionReason, setRejectionReason] = useState('');

    // ✅ NEW: Active school year state for enrollment toggle
    const [activeSchoolYear, setActiveSchoolYear] = useState(null);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const navigate = useNavigate();

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentApplicants = filteredApplicants.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);



    const [refreshing, setRefreshing] = useState(false);
    const [isOthersSelected, setIsOthersSelected] = useState(false);



    const [showAddApplicantModal, setShowAddApplicantModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    
    const [openDropdown, setOpenDropdown] = useState(null);


     // Bulk approve states
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
    const [bulkApproveLoading, setBulkApproveLoading] = useState(false);
    const [selectMode, setSelectMode] = useState(false); 









    useEffect(() => {
        // Connect to Socket.IO server
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true
        });

        // Listen for new enrollment event
        socket.on('new-enrollment', (data) => {
            // ✅ Auto-refresh applicants list
            getAllApplicants();
        });

        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };
    }, []);



    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.action-dropdown')) setOpenDropdown(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);



    const handleEditApplicant = (applicant) => {
    setSelectedApplicant(applicant);
    setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setSelectedApplicant(null);
        setShowEditModal(false);
    };




    const handleOpenAddApplicantModal = () => {
        setShowAddApplicantModal(true);
    };

    const handleCloseAddApplicantModal = () => {
        setShowAddApplicantModal(false);
    };












    // ✅ NEW - Revert to Pending handler
    const handleRevertToPending = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('revertToPending');
        setShowModal(true);
    };



    
    const handleRefresh = async () => {
        setRefreshing(true);
        await getAllApplicants();
        setRefreshing(false);
    };


    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title); 
    }, [location?.state?.title]);

    // ✅ Fetch active school year on mount
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getAllSchoolYears`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            if(data.success && data.data) {
                // Get active school year for enrollment toggle button
                const activeYear = data.data.find(sy => sy.isActive);
                if(activeYear) {
                    setActiveSchoolYear(activeYear);
                }
            }
        })
        .catch((error) => {
            console.log("Error fetching school years: ", error.message);
        });
    }, []);

    useEffect(() => {
        getAllApplicants();
    }, []);

    // Search and status filter
    useEffect(() => {
        let filtered = applicants.filter(applicant => {
            const fullName = `${applicant.learnerInfo?.lastName} ${applicant.learnerInfo?.firstName} ${applicant.learnerInfo?.middleName || ''}`.toLowerCase();
            const lrn = applicant.learnerInfo?.lrn?.toLowerCase() || '';
            const email = applicant.learnerInfo?.email?.toLowerCase() || '';
            
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                   lrn.includes(searchTerm.toLowerCase()) ||
                   email.includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
        setFilteredApplicants(filtered);
    }, [searchTerm, statusFilter, applicants]);


    

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);
    


    const getAllApplicants = async() => {
        try {
            setLoading(true);
            // ✅ Fetch all applicants for active school year
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getApplicants`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            // ✅ Handle both old response format (array) and new format (object with data)
            const applicantsList = data.data ? data.data : data;
            const reversedData = applicantsList.reverse();

            setApplicants(reversedData);
            setFilteredApplicants(reversedData);


        } catch (error) {
            console.error("Error fetching applicants:", error.message);
            setApplicants([]);
            setFilteredApplicants([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Toggle enrollment status - Show confirmation modal
    const handleToggleEnrollmentStatus = () => {
        if (!activeSchoolYear) return;
        setShowEnrollmentModal(true);
    };

    // ✅ NEW: Confirm toggle enrollment status
    const confirmToggleEnrollmentStatus = async () => {
        if (!activeSchoolYear) return;
        
        try {
            setTogglingStatus(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/toggleEnrollmentStatus`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schoolYearId: activeSchoolYear._id }),
                credentials: "include"
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            // ✅ Update active school year with new status
            setActiveSchoolYear(data.data);
            
            showAlert(`Enrollment ${data.data.enrollmentStatus === 'open' ? 'Opened' : 'Closed'}`, 'success');
            setShowEnrollmentModal(false);
        } catch (error) {
            console.error("Error toggling enrollment status:", error.message);
            showAlert(error.message, 'error');
            setShowEnrollmentModal(false);
        } finally {
            setTogglingStatus(false);
        }
    };

    const handleViewApplicant = (applicant) => {
        navigate(`/${role}/applicant_form`,{
            state: { applicant, }
        });
    };
        
    
    const handleApproveApplicant = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('approve');
        setShowModal(true);
    };

    const handleRejectApplicant = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('reject');
        setRejectionReason('');
        setIsOthersSelected(false);
        setShowModal(true);
    };

    const handleRemoveApplicant = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('remove');
        setShowModal(true);
    };



    const confirmApprove = async (enrollmentId) => {
        try {
            setModalLoading(true); // START LOADING
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ enrollmentId: enrollmentId}),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert(data.message, 'success');
            getAllApplicants();


            fetchPendingApplicantsCount();
        } catch (error) {
            console.log(error.message);
            setShowModal(false);
            showAlert(error.message, 'error');
        } finally {
            setModalLoading(false); // STOP LOADING
        }
    };


    const confirmReject = async (enrollmentId) => {
        // ✅ Validate if may reason
        if (!rejectionReason.trim()) {
            showAlert('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            setModalLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rejectApplicant/${enrollmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }, // ✅ Add headers
                body: JSON.stringify({ 
                    reason: rejectionReason,
                    email: selectedApplicant.learnerInfo?.email // ✅ Pass email for notification later
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            setRejectionReason(''); // ✅ Clear reason after success
            showAlert(data.message, 'success');
            getAllApplicants();

            
            fetchPendingApplicantsCount();
        } catch (error) {
            setShowModal(false);
            showAlert(error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    





    const confirmRemove = async (enrollmentId) => {
        try {
            setModalLoading(true); // START LOADING
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/removeApplicant/${enrollmentId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert(data.message, 'success');
            getAllApplicants();

            fetchPendingApplicantsCount();
        } catch (error) {
            console.error("Error removing applicant:", error.message);
            setShowModal(false);
            showAlert("Failed to remove applicant", 'error');
        } finally {
            setModalLoading(false); // STOP LOADING
        }
    };




    // ✅ NEW - Confirm Revert to Pending
    const confirmRevertToPending = async (enrollmentId) => {

        
        try {
            setModalLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/revertToPending/${enrollmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);





            setShowModal(false);
            showAlert(data.message, 'success');
            getAllApplicants();
            fetchPendingApplicantsCount();
        } catch (error) {
            setShowModal(false);
            showAlert(error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };





    // Pending on current page lang
    const pendingOnPage = currentApplicants.filter(a => a.status === 'pending');
    const isAllPageSelected = pendingOnPage.length > 0 &&
        pendingOnPage.every(a => selectedIds.includes(a._id));

    const handleSelectAll = (e) => {
        const pageIds = pendingOnPage.map(a => a._id);
        if (e.target.checked) {
            setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
        } else {
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleToggleSelectMode = () => {
        setSelectMode(prev => !prev);
        setSelectedIds([]); // clear selections pag nag-toggle
    };

    const confirmBulkApprove = async () => {
        try {
            setBulkApproveLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bulkApproveApplicants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enrollmentIds: selectedIds }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setShowBulkApproveModal(false);
            setSelectedIds([]);
            setSelectMode(false);
            showAlert(data.message, 'success');
            getAllApplicants();
            fetchPendingApplicantsCount();
        } catch (error) {
            setShowBulkApproveModal(false);
            showAlert(error.message, 'error');
        } finally {
            setBulkApproveLoading(false);
        }
    };






    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-warning text-dark',
            approved: 'bg-success',
            rejected: 'bg-danger'
        };
        return badges[status] || 'bg-secondary';
    };




    const getStatusCounts = () => {
        return {
            all: applicants.length,
            pending: applicants.filter(a => a.status === 'pending').length,
            approved: applicants.filter(a => a.status === 'approved').length,
            rejected: applicants.filter(a => a.status === 'rejected').length
        };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    const statusCounts = getStatusCounts();

    // 🖨️ PRINT FUNCTION - Opens print dialog
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Applicants List</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
        printWindow.document.write('h2 { text-align: center; color: #dc3545; margin-bottom: 10px; }');
        printWindow.document.write('h3 { text-align: center; color: #6c757d; margin-bottom: 20px; }');
        printWindow.document.write('.info { margin-bottom: 20px; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; font-size: 12px; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
        printWindow.document.write('th { background-color: #dc3545; color: white; }');
        printWindow.document.write('tr:nth-child(even) { background-color: #f8f9fa; }');
        printWindow.document.write('.badge { padding: 3px 6px; border-radius: 3px; font-size: 11px; color: white; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>Enrollment Applicants</h2>');
        printWindow.document.write('<h3>Applicants List Report</h3>');
        printWindow.document.write('<div class="info">');
        printWindow.document.write('<strong>Date Generated:</strong> ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '<br>');
        printWindow.document.write('<strong>Total Applicants:</strong> ' + filteredApplicants.length);
        printWindow.document.write('</div>');
        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr>');
        printWindow.document.write('<th>#</th><th>LRN</th><th>Full Name</th><th>Grade Level</th><th>School Year</th><th>Sex</th><th>Age</th><th>Status</th><th>Date Applied</th>');
        printWindow.document.write('</tr></thead><tbody>');
        
        filteredApplicants.forEach((applicant, index) => {
            const statusColor = applicant.status === 'approved' ? '#198754' : 
                            applicant.status === 'pending' ? '#ffc107' : '#dc3545';
            
            printWindow.document.write('<tr>');
            printWindow.document.write('<td>' + (index + 1) + '</td>');
            printWindow.document.write('<td>' + (applicant.learnerInfo?.lrn || 'N/A') + '</td>');
            printWindow.document.write('<td style="text-transform: capitalize;">' + 
                applicant.learnerInfo?.lastName + ', ' + 
                applicant.learnerInfo?.firstName + ' ' + 
                (applicant.learnerInfo?.middleName === 'N/A' ? '' : applicant.learnerInfo?.middleName) + ' ' +
                ((applicant.learnerInfo?.extensionName === "N/A" || applicant.learnerInfo?.extensionName === "n/a") ? "" : applicant.learnerInfo?.extensionName) + 
            '</td>');
            printWindow.document.write('<td>' + applicant.gradeLevelToEnroll + '</td>');
            printWindow.document.write('<td>' + applicant.schoolYear + '</td>');
            printWindow.document.write('<td>' + applicant.learnerInfo?.sex + '</td>');
            printWindow.document.write('<td>' + applicant.learnerInfo?.age + '</td>');
            printWindow.document.write('<td><span class="badge" style="background-color: ' + statusColor + ';">' + (applicant.status || 'pending') + '</span></td>');
            printWindow.document.write('<td>' + formatDate(applicant.createdAt) + '</td>');
            printWindow.document.write('</tr>');
        });
        
        printWindow.document.write('</tbody></table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // 📄 DOWNLOAD PDF FUNCTION
    const handleDownloadPDF = () => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; color: #dc3545; margin-bottom: 10px;">Enrollment Applicants</h2>
                <h3 style="text-align: center; color: #6c757d; margin-bottom: 20px;">Applicants List Report</h3>
                <p style="margin-bottom: 20px;">
                    <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
                    <strong>Total Applicants:</strong> ${filteredApplicants.length}
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #dc3545; color: white;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">#</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">LRN</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Full Name</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Grade Level</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">School Year</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Sex</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Age</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Status</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Date Applied</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredApplicants.map((applicant, index) => {
                            const statusColor = applicant.status === 'approved' ? '#198754' : 
                                            applicant.status === 'pending' ? '#ffc107' : '#dc3545';
                            return `
                            <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                                <td style="border: 1px solid #ddd; padding: 6px;">${index + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${applicant.learnerInfo?.lrn || 'N/A'}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-transform: capitalize;">
                                    ${applicant.learnerInfo?.lastName}, ${applicant.learnerInfo?.firstName} ${applicant.learnerInfo?.middleName === 'N/A' ? '' : applicant.learnerInfo?.middleName} 
                                    ${(applicant.learnerInfo?.extensionName === "N/A" || applicant.learnerInfo?.extensionName === "n/a") ? "" : applicant.learnerInfo?.extensionName}
                                </td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${applicant.gradeLevelToEnroll}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${applicant.schoolYear}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${applicant.learnerInfo?.sex}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${applicant.learnerInfo?.age}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">
                                    <span style="padding: 3px 6px; border-radius: 3px; font-size: 10px; 
                                        background-color: ${statusColor}; color: white; text-transform: capitalize;">
                                        ${applicant.status || 'pending'}
                                    </span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${formatDate(applicant.createdAt)}</td>
                            </tr>
                        `;}).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const opt = {
            margin: 10,
            filename: `applicants_list_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
    };




    return (
        <>

            <div className="container-fluid py-4 g-0 g-md-5 vh-100">
                {/* Header Section */}
                <div className="row mb-4">
                    <div className="col-12 ">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="text-capitalize fw-bold mb-1">enrollment applicants</h4>
                                <p className="text-muted small mb-0">Review and manage student enrollment applications</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        

                    </div>

                    <div className="col-12 mt-2 mt-md-0 ">

                        {/* ✅ Enrollment Status Toggle Button */}
                        <div className="d-flex justify-content-md-end gap-2">


                            {role === "admin" && !selectMode && (
                            <button
                                className={`btn btn-sm fw-semibold ${
                                    activeSchoolYear?.enrollmentStatus === 'open'
                                        ? 'btn-danger'
                                        : 'btn-success'
                                }`}
                                onClick={handleToggleEnrollmentStatus}
                                disabled={togglingStatus || !activeSchoolYear || activeSchoolYear?.semester === 2}
                                title={activeSchoolYear?.semester === 2 ? 'Enrollment is not available for 2nd semester' : ''}
                            >
                                {togglingStatus ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {activeSchoolYear?.enrollmentStatus === 'open' ? (
                                            <>
                                                <i className="fa fa-lock-open me-2"></i>
                                                Close Enrollment
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-lock-open me-2"></i>
                                                Open Enrollment
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                            )}


                            {role === 'admin' && !selectMode && (
                                <button
                                    className="btn btn-sm btn-primary fw-semibold"
                                    onClick={handleOpenAddApplicantModal}
                                    title="Add New Applicant"
                                >
                                    <i className="fa fa-plus me-2"></i>
                                    Add Applicant
                                </button>
                            )}
                            
                            
                            {/* Approve Selected — lalabas lang pag may naka-check */}
                            {selectMode && selectedIds.length > 0 && (
                                <button
                                    className="btn btn-sm btn-success fw-semibold"
                                    onClick={() => setShowBulkApproveModal(true)}
                                >
                                    <i className="fa fa-check me-2"></i>
                                    Approve Selected ({selectedIds.length})
                                </button>
                            )}
                            


                            {/* Select Mode Toggle */}
                            {role === 'admin' && (
                                <button
                                    className={`btn btn-sm fw-semibold ${selectMode ? 'btn-danger' : 'btn-outline-secondary'}`}
                                    onClick={handleToggleSelectMode}
                                    title={selectMode ? 'Cancel Selection' : 'Select applicants for bulk action'}
                                >
                                    <i className={`fa ${selectMode ? 'fa-times' : 'fa-check-square'} me-2`}></i>
                                    {selectMode ? 'Cancel Select' : 'Select'}
                                </button>
                            )}

                            <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleRefresh}
                                disabled={refreshing || loading}
                            >
                                {refreshing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-refresh "></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
                
                
                {/* Search Bar and Filter */}
                <div className="row mb-3">
                 
                    <div className="col-12 col-md-4 mt-2 mt-md-0">
                        <label className="form-label small fw-semibold d-md-none d-lg-none">Search</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name, LRN, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-4 mt-2 mt-md-0">
                    <label className="form-label small fw-semibold d-md-none d-lg-none">Filter Status</label>
                    <select 
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    </div>
                    <div className="col-12 col-md-4 mt-2 mt-md-0 d-flex flex-column flex-md-row align-items-md-center
                    justify-content-md-end align-items-start justify-content-center">
                        <label className="form-label small fw-semibold d-md-none d-lg-none">Count</label>
                        <p className="text-muted mb-0 d-flex align-items-center ">
                            <i className="fa fa-list me-1"></i><strong>{filteredApplicants.length}</strong> applicant(s)
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2">Loading applicants data...</p>
                                    </div>
                                ) : filteredApplicants.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No applicants found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0 mb-5">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="text-capitalize fw-semibold">#</th>
                                                        <th className="text-capitalize fw-semibold">LRN</th>
                                                        <th className="text-capitalize fw-semibold">Full Name</th>
                                                        <th className="text-capitalize fw-semibold">Grade Level</th>
                                                        <th className="text-capitalize fw-semibold">School Year</th>
                                                        <th className="text-capitalize fw-semibold">Sex</th>
                                                        <th className="text-capitalize fw-semibold">Age</th>
                                                        <th className="text-capitalize fw-semibold">Status</th>
                                                        <th className="text-capitalize fw-semibold">Date Applied</th>
                                                        <th className="text-capitalize fw-semibold text-center">Actions</th>
                                                        {selectMode && (
                                                            <th>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={isAllPageSelected}
                                                                    onChange={handleSelectAll}
                                                                    title="Select all pending on this page"
                                                                />
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentApplicants.map((applicant, index) => (
                                                        <tr key={applicant._id}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-secondary">
                                                                    {applicant.learnerInfo?.lrn || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className="text-capitalize fw-semibold">
                                                                    {`${applicant.learnerInfo?.lastName}, ${applicant.learnerInfo?.firstName} ${applicant.learnerInfo?.middleName ===  'N/A' ? '' : applicant.learnerInfo?.middleName} ${
                                                                    applicant.learnerInfo?.extensionName && 
                                                                    applicant.learnerInfo.extensionName.toLowerCase() !== 'n/a' 
                                                                        ? applicant.learnerInfo.extensionName 
                                                                        : ''
                                                                    }`.trim()}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-capitalize">{applicant.gradeLevelToEnroll}</td>
                                                            <td className="align-middle">{applicant.schoolYear}</td>
                                                            <td className="align-middle">{applicant.learnerInfo?.sex}</td>
                                                            <td className="align-middle">{applicant.learnerInfo?.age}</td>
                                                            <td className="align-middle">
                                                                <span className={`badge ${getStatusBadge(applicant.status)} text-capitalize`}>
                                                                    {applicant.status || 'pending'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-muted small">
                                                                {formatDate(applicant.createdAt)}
                                                            </td>

                                                            <td className="align-middle text-center">
                                                                <div className="position-relative action-dropdown">
                                                                    <button
                                                                        className="btn btn-sm btn-light border-0"
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenDropdown(openDropdown === applicant._id ? null : applicant._id);
                                                                        }}
                                                                    >
                                                                        <i className="fa fa-ellipsis"></i>
                                                                    </button>

                                                                    {openDropdown === applicant._id && (
                                                                        <div
                                                                            className="position-absolute bg-white border rounded shadow-sm py-2"
                                                                            style={{ minWidth: '180px', zIndex: 1050, right: '0', top: '100%', marginTop: '5px' }}
                                                                        >
                                                                            {applicant.status === 'pending' && (
                                                                                <>
                                                                                    <DropdownItem icon="eye" text="View Details" color="primary"
                                                                                        onClick={() => { setOpenDropdown(null); handleViewApplicant(applicant); }} />
                                                                                    {role === 'admin' && (
                                                                                        <DropdownItem icon="edit" text="Edit Applicant" color="warning"
                                                                                            onClick={() => { setOpenDropdown(null); handleEditApplicant(applicant); }} />
                                                                                    )}
                                                                                    <DropdownItem icon="check" text="Approve" color="success"
                                                                                        onClick={() => { setOpenDropdown(null); handleApproveApplicant(applicant); }} />
                                                                                    <DropdownItem icon="times" text="Reject" color="danger"
                                                                                        onClick={() => { setOpenDropdown(null); handleRejectApplicant(applicant); }} danger />
                                                                                </>
                                                                            )}
                                                                            {(applicant.status === 'approved' || applicant.status === 'rejected') && (
                                                                                <>
                                                                                    <DropdownItem icon="eye" text="View Details" color="primary"
                                                                                        onClick={() => { setOpenDropdown(null); handleViewApplicant(applicant); }} />
                                                                                    {role === 'admin' && (
                                                                                        <DropdownItem icon="edit" text="Edit Applicant" color="warning"
                                                                                            onClick={() => { setOpenDropdown(null); handleEditApplicant(applicant); }} />
                                                                                    )}
                                                                                    <DropdownItem icon="rotate-left" text="Revert to Pending" color="warning"
                                                                                        onClick={() => { setOpenDropdown(null); handleRevertToPending(applicant); }} />
                                                                                    <DropdownItem icon="trash" text="Remove" color="danger"
                                                                                        onClick={() => { setOpenDropdown(null); handleRemoveApplicant(applicant); }} danger />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>


                                                            {selectMode && (
                                                                <td className="align-middle">
                                                                    {applicant.status === 'pending' && (
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={selectedIds.includes(applicant._id)}
                                                                            onChange={() => handleSelectOne(applicant._id)}
                                                                        />
                                                                    )}
                                                                </td>
                                                            )}
                                                      
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Pagination */}
                                        {totalPages > 0 && (
                                            <div className="p-3 border-top">
                                                <div className="row align-items-center g-2">
                                                    {/* Left: Showing entries */}
                                                    <div className="col-12 col-md-6">
                                                        <div className="text-muted small text-center text-md-start">
                                                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredApplicants.length)} of {filteredApplicants.length} entries
                                                        </div>
                                                    </div>

                                                    {/* Right: Print/PDF + Pagination */}
                                                    <div className="col-12 col-md-6 d-flex justify-content-end gap-3 mt-3 mt-md-0 flex-column flex-md-row">
                                                        {/* Print & PDF Buttons */}
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={handlePrint}
                                                                title="Print Applicants List"
                                                            >
                                                                <i className="fa fa-print me-1"></i>Print
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={handleDownloadPDF}
                                                                title="Download as PDF"
                                                            >
                                                                <i className="fa fa-file-pdf me-1"></i>PDF
                                                            </button>
                                                        </div>

                                                        {/* Pagination */}
                                                        <nav className="d-flex justify-content-md-end justify-content-center">
                                                            <ul className="pagination mb-0">
                                                                {renderPagination()}
                                                            </ul>
                                                        </nav>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                                

            {/* Action Confirmation Modal (Approve/Reject/Remove) */}
            {showModal && selectedApplicant && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'approve' && 'Approve Applicant'}
                                    {modalType === 'reject' && 'Reject Applicant'}
                                    {modalType === 'remove' && 'Remove Applicant'}
                                    {modalType === 'revertToPending' && 'Revert to Pending'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                    disabled={modalLoading}
                                ></button>
                            </div>

                            {/* Approve Modal */}
                            {modalType === 'approve' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
                                        <h5 className="mb-3">Approve Application?</h5>
                                        <p className="text-muted">
                                            Do you want to approve the enrollment application of:
                                            <br/>
                                            <strong className="text-capitalize">
                                                {selectedApplicant.learnerInfo?.firstName} {selectedApplicant.learnerInfo?.lastName}
                                            </strong>
                                            <br/>
                                            <span className="badge bg-secondary mt-2">
                                                {selectedApplicant.gradeLevelToEnroll} - S.Y. {selectedApplicant.schoolYear}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-success"
                                            onClick={() => confirmApprove(selectedApplicant._id)}
                                            disabled={modalLoading}
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Approving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-check me-2"></i>
                                                    Yes, Approve
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Reject Modal */}
                            {modalType === 'reject' && (
                                <>
                                    <div className="modal-body">
                                        <div className="text-center mb-4">
                                            <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                            <h5 className="mb-3">Reject Application?</h5>
                                            <p className="text-muted">
                                                You are about to reject the enrollment application of:
                                                <br/>
                                                <strong className="text-capitalize">
                                                    {selectedApplicant.learnerInfo?.firstName} {selectedApplicant.learnerInfo?.lastName}
                                                </strong>
                                                <br/>
                                                <small className="text-muted">
                                                    Email: {selectedApplicant.learnerInfo?.email}
                                                </small>
                                            </p>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Reason for Rejection <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select mb-2"
                                                value={isOthersSelected ? 'Others' : rejectionReason}
                                                onChange={(e) => {
                                                    if (e.target.value === 'Others') {
                                                        setIsOthersSelected(true);
                                                        setRejectionReason('');
                                                    } else {
                                                        setIsOthersSelected(false);
                                                        setRejectionReason(e.target.value);
                                                    }
                                                }}
                                                disabled={modalLoading}
                                            >
                                                <option value="">-- Select a reason --</option>
                                                <option>Blurry or unreadable documents</option>
                                                <option>Incomplete required documents</option>
                                                <option>Invalid or mismatched information</option>
                                                <option>Expired documents</option>
                                                <option>Duplicate application</option>
                                                <option>Does not meet grade level requirements</option>
                                                <option value="Others">Others (specify...)</option>
                                            </select>

                                            {isOthersSelected && (
                                                <textarea
                                                    className="form-control mt-2"
                                                    rows="3"
                                                    placeholder="Please specify the reason..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    disabled={modalLoading}
                                                ></textarea>
                                            )}

                                            <small className="text-muted d-block mt-1">
                                                <i className="fa fa-info-circle me-1"></i>
                                                This reason will be sent to the applicant via email.
                                            </small>
                                        </div>

                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowModal(false);
                                                setRejectionReason('');
                                                setIsOthersSelected(false); // ✅ dagdag
                                            }}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={() => confirmReject(selectedApplicant._id)}
                                            disabled={modalLoading || !rejectionReason.trim()} // ✅ Disable if no reason
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Rejecting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-times me-2"></i>
                                                    Yes, Reject
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}



                            {/* Remove Modal */}
                            {modalType === 'remove' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-trash fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Remove Application?</h5>
                                        <p className="text-muted">
                                            Do you really want to remove the enrollment application of:
                                            <br/>
                                            <strong className="text-capitalize">
                                                {selectedApplicant.learnerInfo?.firstName} {selectedApplicant.learnerInfo?.lastName}
                                            </strong>
                                            <br/>
                                            <span className="badge bg-secondary mt-2">
                                                {selectedApplicant.gradeLevelToEnroll} - S.Y. {selectedApplicant.schoolYear}
                                            </span>
                                            <br/>
                                            <small className="text-danger mt-2 d-block">This action cannot be undone.</small>
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={() => confirmRemove(selectedApplicant._id)}
                                            disabled={modalLoading}
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Removing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-trash me-2"></i>
                                                    Yes, Remove
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}


                            {/* ✅ NEW - Revert to Pending Modal */}
                            {modalType === 'revertToPending' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-rotate-left fa-3x text-warning mb-3"></i>
                                        <h5 className="mb-3">Revert to Pending?</h5>
                                        <p className="text-muted">
                                            Do you want to revert the application of:
                                            <br/>
                                            <strong className="text-capitalize">
                                                {selectedApplicant.learnerInfo?.firstName} {selectedApplicant.learnerInfo?.lastName}
                                            </strong>
                                            <br/>
                                            <span className="badge bg-secondary mt-2">
                                                {selectedApplicant.gradeLevelToEnroll} - S.Y. {selectedApplicant.schoolYear}
                                            </span>
                                            <br/>
                                            <small className="text-warning mt-2 d-block">
                                                <i className="fa fa-info-circle me-1"></i>
                                                Status will be set back to <strong>Pending</strong>.
                                            </small>
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                            disabled={modalLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-warning"
                                            onClick={() => confirmRevertToPending(selectedApplicant._id)}
                                            disabled={modalLoading}
                                        >
                                            {modalLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Reverting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-rotate-left me-2"></i>
                                                    Yes, Revert to Pending
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

            {/* ✅ NEW - Enrollment Status Confirmation Modal */}
            {showEnrollmentModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {activeSchoolYear?.enrollmentStatus === 'open' ? 'Close Enrollment' : 'Open Enrollment'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowEnrollmentModal(false)}
                                    disabled={togglingStatus}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                <div className={`mb-3 ${activeSchoolYear?.enrollmentStatus === 'open' ? 'text-danger' : 'text-success'}`}>
                                    <i className={`fa ${activeSchoolYear?.enrollmentStatus === 'open' ? 'fa-lock' : 'fa-lock-open'} fa-3x`}></i>
                                </div>
                                <h5 className="mb-3">
                                    {activeSchoolYear?.enrollmentStatus === 'open' 
                                        ? 'Close Enrollment?' 
                                        : 'Open Enrollment?'}
                                </h5>
                                <p className="text-muted">
                                    Do you want to <strong>{activeSchoolYear?.enrollmentStatus === 'open' ? 'close' : 'open'}</strong> this enrollment for:
                                    <br/>
                                    <strong className="text-capitalize d-block mt-2">
                                        {activeSchoolYear?.label}
                                    </strong>
                                    <small className="text-muted d-block mt-2">
                                        {activeSchoolYear?.enrollmentStatus === 'open' 
                                            ? 'Students will no longer be able to submit applications.'
                                            : 'Students will be able to submit new applications.'}
                                    </small>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowEnrollmentModal(false)}
                                    disabled={togglingStatus}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${activeSchoolYear?.enrollmentStatus === 'open' ? 'btn-danger' : 'btn-success'}`}
                                    onClick={confirmToggleEnrollmentStatus}
                                    disabled={togglingStatus}
                                >
                                    {togglingStatus ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {activeSchoolYear?.enrollmentStatus === 'open' ? (
                                                <>
                                                    <i className="fa fa-lock me-2"></i>
                                                    Yes, Close Enrollment
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-lock-open me-2"></i>
                                                    Yes, Open Enrollment
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Bulk Approve Confirmation Modal */}
            {showBulkApproveModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Bulk Approve Applicants</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowBulkApproveModal(false)}
                                    disabled={bulkApproveLoading}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
                                <h5 className="mb-3">Approve {selectedIds.length} Applicant(s)?</h5>
                                <p className="text-muted">
                                    Student accounts will be created and login credentials
                                    will be sent to each applicant's email.
                                    <br/>
                                    <small className="text-danger mt-2 d-block">
                                        This action cannot be undone.
                                    </small>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowBulkApproveModal(false)}
                                    disabled={bulkApproveLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={confirmBulkApprove}
                                    disabled={bulkApproveLoading}
                                >
                                    {bulkApproveLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-check me-2"></i>
                                            Yes, Approve All
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Alert Modal - Success/Error Messages */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered ">
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


            {/* Add Applicants Modal */}
            {showAddApplicantModal && (
                
                <Add_Applicants 
                    isOpen={showAddApplicantModal}
                    onClose={handleCloseAddApplicantModal}
                    onSuccess={() => {
                        getAllApplicants();
                        fetchPendingApplicantsCount();
                    }}
                />
            )}

            {showEditModal && selectedApplicant && (
                <Add_Applicants
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    onSuccess={() => {
                        getAllApplicants();
                        fetchPendingApplicantsCount();
                    }}
                    applicant={selectedApplicant}
                    mode="edit"
                />
            )}
        </>
    );
};

export default Applicants;


const DropdownItem = ({ icon, text, color, onClick, danger = false }) => (
    <button
        className={`dropdown-item d-flex align-items-center px-3 py-2 border-0 bg-transparent w-100 text-start ${danger ? 'text-danger' : ''}`}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
        <i className={`fa fa-${icon} text-${color} me-2`} style={{ width: '20px' }}></i>
        <span>{text}</span>
    </button>
);