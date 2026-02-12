import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; 
import html2pdf from "html2pdf.js";








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



    useEffect(() => {
        // Connect to Socket.IO server
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true
        });

        // Listen for new enrollment event
        socket.on('new-enrollment', (data) => {
            console.log('📩 New enrollment received:', data.message);
            // ✅ Auto-refresh applicants list
            getAllApplicants();
        });

        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    
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
        setCurrentPage(1);
    }, [searchTerm, statusFilter, applicants]);


    const getAllApplicants = async() => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getApplicants`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            const reversedData = data.reverse();


            setApplicants(reversedData);
            setFilteredApplicants(reversedData);

        } catch (error) {
            console.error("Error fetching applicants:", error.message);
            showAlert("Failed to load applicants data", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewApplicant = (applicant) => {
        navigate(`/${role}/enrollmentpdf`, { state: { applicant, autoDownload: false, title: "applicants" } });
    };
    
    const handleDownloadFile = (applicant) => {
        navigate(`/${role}/enrollmentpdf`, { state: { applicant, autoDownload: true } });
    }

    const handleApproveApplicant = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('approve');
        setShowModal(true);
    };

    const handleRejectApplicant = (applicant) => {
        setSelectedApplicant(applicant);
        setModalType('reject');
        setRejectionReason('');
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
                    <div className="col-12 mt-2 mt-md-0">
                        <div className="d-flex justify-content-md-end">
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
                    <div className="col-12 col-md-4">
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
                    <div className="col-12 col-md-3 mt-2 mt-md-0">
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
                    <div className="col-12 col-md-5 text-end">
                        <p className="text-muted mb-0 mt-2">
                            Showing: <strong>{filteredApplicants.length}</strong> applicant(s)
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
                                            <table className="table table-hover mb-0">
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
                                                            <td className="align-middle">
                                                                {/* PENDING - Original buttons */}
                                                                {applicant.status === 'pending' && (
                                                                    <div className="d-flex gap-2 justify-content-center">
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => handleViewApplicant(applicant)}
                                                                            title="View Details"
                                                                        >
                                                                            <i className="fa fa-eye"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-success"
                                                                            onClick={() => handleApproveApplicant(applicant)}
                                                                            title="Approve"
                                                                        >
                                                                            <i className="fa fa-check"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => handleRejectApplicant(applicant)}
                                                                            title="Reject"
                                                                        >
                                                                            <i className="fa fa-times"></i>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* APPROVED/REJECTED - Eye and Trash only */}
                                                                {(applicant.status === 'approved' || applicant.status === 'rejected') && (
                                                                    <div className="d-flex gap-2 justify-content-center">
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => handleViewApplicant(applicant)}
                                                                            title="View Details"
                                                                        >
                                                                            <i className="fa fa-eye"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => handleDownloadFile(applicant)}
                                                                            title="Download to pdf"
                                                                        >
                                                                            <i className="fa fa-download"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => handleRemoveApplicant(applicant)}
                                                                            title="Remove"
                                                                        >
                                                                            <i className="fa fa-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
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
                                        
                                        {/* ✅ ADD THIS - Rejection Reason Textarea */}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Reason for Rejection <span className="text-danger">*</span>
                                            </label>
                                            <textarea 
                                                className="form-control" 
                                                rows="4"
                                                placeholder="Please provide a clear reason for rejection..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                disabled={modalLoading}
                                                required
                                            ></textarea>
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
                                                setRejectionReason(''); // ✅ Clear reason when canceling
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
        </>
    );
};

export default Applicants;