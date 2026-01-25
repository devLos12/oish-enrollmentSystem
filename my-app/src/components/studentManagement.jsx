import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";






const StudentManagement = () => {
    const { role, setTextHeader, studentList, setStudentList } = useContext(globalContext);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStrand, setFilterStrand] = useState('');
    const [studentType, setStudentType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null);
    

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    


    const [isDeleting, setIsDeleting] = useState(false);
    const [isGraduating, setIsGraduating] = useState(false);


    // 🔥 EMAIL SCHEDULING STATES (from Schedule.jsx)
    const [emailHistory, setEmailHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedStudentsForEmail, setSelectedStudentsForEmail] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        title: '',
        date: '',
        time: '',
        description: ''
    });

    // 🔥 EMAIL HISTORY FILTERS & PAGINATION
    const [historyDateFilter, setHistoryDateFilter] = useState('');
    const [filteredEmailHistory, setFilteredEmailHistory] = useState([]);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [historyItemsPerPage] = useState(10);

    // 🔥 EMAIL DELETE MODE
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);


    const navigate = useNavigate();
    
    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success'); // 'success' or 'error'
    
    const gradeOptions = [11, 12];
    const statusOptions = ['pending','enrolled','unenrolled', 'dropped', 'graduated'];
    const semesterOptions = [1, 2];


    const STRAND_OPTIONS = {
        'Academic': [
            { value: 'STEM', label: 'STEM (Science, Technology, Engineering, and Mathematics)' },
            { value: 'ABM', label: 'ABM (Accountancy, Business, and Management)' },
            { value: 'HUMSS', label: 'HUMSS (Humanities and Social Sciences)' },
            { value: 'GAS', label: 'GAS (General Academic Strand)' }
        ],
        'TVL': [
            { value: 'HE', label: 'HE (Home Economics)' },
            { value: 'ICT', label: 'ICT (Information and Communications Technology)' },
            { value: 'IA', label: 'IA (Industrial Arts)' },
            { value: 'Agri-Fishery', label: 'Agri-Fishery Arts' }
        ]
    };



    const [showAddModal, setShowAddModal] = useState(false);
    const [addFormData, setAddFormData] = useState({
        lrn: '',
        firstName: '',
        middleName: '',
        lastName: '',
        extensionName: 'N/A',
        birthDate: '',
        sex: '',
        contactNumber: '',
        email: '',
        gradeLevel: '',
        track: '',
        strand: '',
        semester: '',
        studentType: 'regular',
        password: '',        
        confirmPassword: ''
    });





    const getEmailHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getEmailHistory`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            const reversed = data.reverse();
            setEmailHistory(reversed);
            setFilteredEmailHistory(reversed);
        } catch (error) {
            console.log("Error fetching email history: ", error.message);
            showAlert("Failed to load email history", 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

        const handleScheduleRequirements = () => {
        if (selectedStudentsForEmail.length === 0) {
            showAlert("Please select at least one student!", 'error');
            return;
        }
        setShowScheduleModal(true);
    };


    const handleSubmitSchedule = async () => {
        if (!scheduleData.title.trim() || !scheduleData.date || !scheduleData.time || !scheduleData.description.trim()) {
            showAlert("All fields are required!", 'error');
            return;
        }

        try {
            setIsSubmittingSchedule(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/scheduleRequirements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: selectedStudentsForEmail,
                    title: scheduleData.title,
                    date: scheduleData.date,
                    time: scheduleData.time,
                    description: scheduleData.description
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert("Requirements scheduled successfully! Emails sent to selected students.", 'success');
            setShowScheduleModal(false);
            setSelectedStudentsForEmail([]);
            setIsSelectionMode(false);
            setScheduleData({ title: '', date: '', time: '', description: '' });
            getEmailHistory();
        } catch (error) {
            console.error("Error scheduling requirements:", error.message);
            showAlert("Failed to schedule requirements: " + error.message, 'error');
        } finally {
            setIsSubmittingSchedule(false);
        }
    };



    const handleSelectStudentForEmail = (studentId) => {
        setSelectedStudentsForEmail(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleSelectAllForEmail = () => {
        if (currentStudents.every(student => selectedStudentsForEmail.includes(student._id))) {
            setSelectedStudentsForEmail(prev => prev.filter(id => !currentStudents.map(s => s._id).includes(id)));
        } else {
            const currentPageIds = currentStudents.map(student => student._id);
            setSelectedStudentsForEmail(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedStudentsForEmail([]);
    };


    const handleSelectEmail = (emailId) => {
        setSelectedEmails(prev => {
            if (prev.includes(emailId)) {
                return prev.filter(id => id !== emailId);
            } else {
                return [...prev, emailId];
            }
        });
    };

    const handleSelectAllEmails = () => {
        if (currentEmailHistory.every(email => selectedEmails.includes(email._id))) {
            setSelectedEmails(prev => prev.filter(id => !currentEmailHistory.map(e => e._id).includes(id)));
        } else {
            const currentPageIds = currentEmailHistory.map(email => email._id);
            setSelectedEmails(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteMode(false);
        setSelectedEmails([]);
    };


    const handleDeleteEmails = async () => {

        try {
            setIsDeleting(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteEmailHistory`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailIds: selectedEmails
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(data.message, 'success');
            setShowDeleteConfirm(false);
            setIsDeleteMode(false);
            setSelectedEmails([]);
            getEmailHistory();
        } catch (error) {
            setIsDeleting(false);
            console.error("Error deleting email history:", error.message);
            showAlert("Failed to delete email history: " + error.message, 'error');
        }
    };


    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleHistoryPageChange = (pageNumber) => {
        setHistoryCurrentPage(pageNumber);
    };




    // Add this useEffect AFTER the existing useEffects
    useEffect(() => {
        getEmailHistory(); // Fetch email history on mount
    }, []);

    useEffect(() => {
        let filtered = emailHistory;

        if (historyDateFilter) {
            filtered = filtered.filter(email => {
                const emailDate = new Date(email.createdAt).toLocaleDateString('en-CA');
                return emailDate === historyDateFilter;
            });
        }

        setFilteredEmailHistory(filtered);
        setHistoryCurrentPage(1);
    }, [historyDateFilter, emailHistory]);






    
    // Dynamic strand options from actual student data
    const strandOptions = [...new Set( 
        studentList
            .map(student => student.strand)
            .filter(strand => strand) // Remove null/undefined
    )].sort();
    
    const location = useLocation();

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title, setTextHeader]);

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

 


    // NEED TO ADD:
    const historyIndexOfLastItem = historyCurrentPage * historyItemsPerPage;
    const historyIndexOfFirstItem = historyIndexOfLastItem - historyItemsPerPage;
    const currentEmailHistory = filteredEmailHistory.slice(historyIndexOfFirstItem, historyIndexOfLastItem);
    const historyTotalPages = Math.ceil(filteredEmailHistory.length / historyItemsPerPage);









    useEffect(() => {
        fetchStudentsData();
        
        const handleClickOutside = (e) => {
            if (!e.target.closest('.action-dropdown')) {
                setOpenDropdown(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);



    useEffect(() => {
        let filtered = studentList.filter(student => {
            const fullName = `${student.lastName} ${student.firstName} ${student.middleName || ''}`.toLowerCase();
            const lrn = student.lrn?.toLowerCase() || '';
            const studentNumber = student.studentNumber?.toLowerCase() || '';
            const email = student.email?.toLowerCase() || '';
            
            return fullName.includes(searchTerm.toLowerCase()) ||
                   lrn.includes(searchTerm.toLowerCase()) ||
                   studentNumber.includes(searchTerm.toLowerCase()) ||
                   email.includes(searchTerm.toLowerCase());
        });

        // Filter by student type
        if (studentType === 'regular') {
            filtered = filtered.filter(student => student.studentType === 'regular');
        } else if (studentType === 'repeater') {
            filtered = filtered.filter(student => student.studentType === 'repeater');
        }
        // if 'all', don't filter by student type

        if (filterGrade) {
            filtered = filtered.filter(student => student.gradeLevel === parseInt(filterGrade));
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(student => student.status === filterStatus);
        }

        if (filterSemester) {
            filtered = filtered.filter(student => student.semester === parseInt(filterSemester));
        }

        if (filterStrand) {
            filtered = filtered.filter(student => student.strand === filterStrand);
        }

        setFilteredStudents(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterGrade, filterStatus, filterSemester, filterStrand, studentType, studentList]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    const fetchStudentsData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getStudents`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setStudentList(data);
            setFilteredStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error.message);
            showAlert("Failed to load students data", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudent = (student) => {
        setOpenDropdown(null);
        navigate(`/${role}/registration_form`, { state: student})
    };

    const handleEditStudent = (student) => {
        setOpenDropdown(null);
        navigate(`/${role}/edit_student`, { 
            state: { 
                title: "Update Student", 
                selectedStudent: student
            }
        })
    };

    const handleDeleteStudent = (student) => {
        setOpenDropdown(null);
        setSelectedStudent(student);
        setModalType('delete');
        setShowModal(true);
    };

    const handleMarkAsGraduated = (student) => {
        setOpenDropdown(null);
        setSelectedStudent(student);
        setModalType('graduate');
        setShowModal(true);
    };




    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteStudent/${selectedStudent._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setShowModal(false);
            showAlert("Student deleted successfully!", 'success');
            fetchStudentsData();
        } catch (error) {
            console.error("Error deleting student:", error.message);
            showAlert("Failed to delete student", 'error');
        } finally {
            setIsDeleting(false);
        }
    };



    const confirmGraduate = async () => {
        try {
            setIsGraduating(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/markAsGraduated/${selectedStudent._id}`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            if(data.success){
                setShowModal(false);
                showAlert("Student marked as graduated successfully!", 'success');
                fetchStudentsData();

                console.log(data.student);
            }

        } catch (error) {
            console.error("Error marking student as graduated:", error.message);
            showAlert("Failed to mark student as graduated", 'error');
        } finally {
            setIsGraduating(false);
        }
    };



    const handleAddStudent = () => {
        setShowAddModal(true);
    };




    const handleAddFormChange = (e) => {
        const { name, value } = e.target;
        
        // ✅ Special handling for Contact Number
        if (name === 'contactNumber') {
            let cleaned = value.replace(/\D/g, '');
            cleaned = cleaned.substring(0, 11);
            
            let formatted = '';
            if (cleaned.length > 0) {
                formatted = cleaned.substring(0, 4);
                if (cleaned.length > 4) {
                    formatted += ' ' + cleaned.substring(4, 7);
                }
                if (cleaned.length > 7) {
                    formatted += ' ' + cleaned.substring(7, 11);
                }
            }
            
            setAddFormData(prev => ({
                ...prev,
                [name]: formatted
            }));
        } 

        else if (name === 'lrn') {
            let cleaned = value.replace(/\D/g, '');
            cleaned = cleaned.substring(0, 12); // Limit to 12 digits
            
            setAddFormData(prev => ({
                ...prev,
                [name]: cleaned
        }));
    }



        // ✅ Reset strand when track changes
        else if (name === 'track') {
            setAddFormData(prev => ({
                ...prev,
                track: value,
                strand: '' // Reset strand
            }));
        } 
        else {
            setAddFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };





    const handleAddSubmit = async (e) => {
        e.preventDefault();

        

        // ✅ Validate LRN length
        if (addFormData.lrn.length !== 12) {
            showAlert("LRN must be exactly 12 digits", 'error');
            return;
        }

        // ✅ Validate Contact Number length
        const cleanedContact = addFormData.contactNumber.replace(/\s/g, '');
        if (cleanedContact.length !== 11) {
            showAlert("Contact Number must be exactly 11 digits", 'error');
            return;
        }

        // ✅ ADD PASSWORD VALIDATION
        if (!addFormData.password || addFormData.password.length < 6) {
            showAlert("Password must be at least 6 characters", 'error');
            return;
        }

        if (addFormData.password !== addFormData.confirmPassword) {
            showAlert("Passwords do not match", 'error');
            return;
        }

        try {
            setLoading(true);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/createStudent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(addFormData)
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message);

            setShowAddModal(false);
            showAlert("Student created successfully!", 'success');
            fetchStudentsData();
            
            // Reset form
            setAddFormData({
                lrn: '',
                firstName: '',
                middleName: '',
                lastName: '',
                extensionName: 'N/A',
                birthDate: '',
                sex: '',
                contactNumber: '',
                email: '',
                gradeLevel: '',
                track: '',
                strand: '',
                semester: '',
                studentType: 'regular',
                password: '',         // ✅ ADD THIS
                confirmPassword: '', // ✅ ADD THIS
            });

        } catch (error) {
            console.error("Error creating student:", error.message);
            showAlert(error.message || "Failed to create student", 'error');
        } finally {
            setLoading(false);
        }
    };





    const handleCloseAddModal = () => {
       // ✅ ADD THIS
        setShowAddModal(false);
        setShowPassword(false);         // ✅ ADD THIS
        setShowConfirmPassword(false);
        setAddFormData({
            lrn: '',
            firstName: '',
            middleName: '',
            lastName: '',
            extensionName: 'N/A',
            birthDate: '',
            sex: '',
            contactNumber: '',
            email: '',
            gradeLevel: '',
            track: '',
            strand: '',
            semester: '',
            studentType: 'regular',
            password: '',         // ✅ ADD THIS
            confirmPassword: '', // ✅ ADD THIS
        });
    };


   // 🖨️ PRINT FUNCTION - Opens print dialog
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Student List</title>');
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
        printWindow.document.write('<h2>Student Management</h2>');
        printWindow.document.write('<h3>Student List Report</h3>');
        printWindow.document.write('<div class="info">');
        printWindow.document.write('<strong>Date Generated:</strong> ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '<br>');
        printWindow.document.write('<strong>Total Students:</strong> ' + filteredStudents.length);
        printWindow.document.write('</div>');
        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr>');
        printWindow.document.write('<th>#</th><th>Student No</th><th>LRN</th><th>Full Name</th><th>Grade</th><th>Semester</th><th>Strand</th><th>Section</th><th>Sex</th><th>Status</th>');
        printWindow.document.write('</tr></thead><tbody>');
        
        filteredStudents.forEach((student, index) => {
            const statusColor = student.status === 'enrolled' ? '#198754' : 
                            student.status === 'pending' ? '#6c757d' : 
                            student.status === 'dropped' ? '#dc3545' : '#0d6efd';
            
            printWindow.document.write('<tr>');
            printWindow.document.write('<td>' + (index + 1) + '</td>');
            printWindow.document.write('<td>' + student.studentNumber + '</td>');
            printWindow.document.write('<td>' + student.lrn + '</td>');
            printWindow.document.write('<td style="text-transform: capitalize;">' + student.lastName + ', ' + student.firstName + ' ' + (student.middleName || '') + ' ' + ((student.extensionName === "N/A" || student.extensionName === "n/a") ? "" : student.extensionName) + '</td>');
            printWindow.document.write('<td>Grade ' + student.gradeLevel + '</td>');
            printWindow.document.write('<td>' + (student.semester === 1 ? "First" : "Second") + '</td>');
            printWindow.document.write('<td>' + (student.strand || 'N/A') + '</td>');
            printWindow.document.write('<td>' + (student.section || 'No Section') + '</td>');
            printWindow.document.write('<td>' + student.sex + '</td>');
            printWindow.document.write('<td><span class="badge" style="background-color: ' + statusColor + ';">' + student.status + '</span></td>');
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
                <h2 style="text-align: center; color: #dc3545; margin-bottom: 10px;">Student Management</h2>
                <h3 style="text-align: center; color: #6c757d; margin-bottom: 20px;">Student List Report</h3>
                <p style="margin-bottom: 20px;">
                    <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
                    <strong>Total Students:</strong> ${filteredStudents.length}
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #dc3545; color: white;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">#</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Student No</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">LRN</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Full Name</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Grade</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Sem</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Strand</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Section</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Sex</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredStudents.map((student, index) => {
                            const statusColor = student.status === 'enrolled' ? '#198754' : 
                                            student.status === 'pending' ? '#6c757d' : 
                                            student.status === 'dropped' ? '#dc3545' : '#0d6efd';
                            return `
                            <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                                <td style="border: 1px solid #ddd; padding: 6px;">${index + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.studentNumber}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.lrn}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-transform: capitalize;">
                                    ${student.lastName}, ${student.firstName} ${student.middleName || ''} 
                                    ${(student.extensionName === "N/A" || student.extensionName === "n/a") ? "" : student.extensionName}
                                </td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.gradeLevel}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.semester === 1 ? "1st" : "2nd"}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.strand || 'N/A'}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.section || 'No Section'}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${student.sex}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">
                                    <span style="padding: 3px 6px; border-radius: 3px; font-size: 10px; 
                                        background-color: ${statusColor}; color: white; text-transform: capitalize;">
                                        ${student.status}
                                    </span>
                                </td>
                            </tr>
                        `;}).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const opt = {
            margin: 10,
            filename: `student_list_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
    };





    // 🔄 REFRESH BOTH TABLES
    const handleRefreshAll = async () => {
        // Close all modals
        setShowAddModal(false);
        setShowModal(false);
        setShowScheduleModal(false);
        setShowDeleteConfirm(false);
        setShowAlertModal(false);
        
        setLoading(true);
        setLoadingHistory(true);
        
        try {
            await Promise.all([
                fetchStudentsData(),
                getEmailHistory()
            ]);
        } catch (error) {
        } finally {
            setLoading(false);
            setLoadingHistory(false);
        }
    };




    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-secondary',
            enrolled: 'bg-success',
            dropped: 'bg-danger',
            graduated: 'bg-primary'
        };
        return badges[status] || 'bg-secondary';
    };

    const getStatusCounts = () => {
        return {
            all: studentList.length,
            pending: studentList.filter(s => s.status === 'pending').length,
            enrolled: studentList.filter(s => s.status === 'enrolled').length,
            dropped: studentList.filter(s => s.status === 'dropped').length,
            graduated: studentList.filter(s => s.status === 'graduated').length
        };
    };

    const statusCounts = getStatusCounts();

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
       

         // 🔥 Scroll to table top (mas specific)
        const tableElement = document.querySelector('.table-responsive');
        if (tableElement) {
            tableElement.scrollIntoView({ 
                behavior: 'auto', 
                block: 'start' 
            });
        }
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





    const renderEmailHistoryPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, historyCurrentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(historyTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        pages.push(
            <li key="prev" className={`page-item ${historyCurrentPage === 1 ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => handleHistoryPageChange(historyCurrentPage - 1)}
                    disabled={historyCurrentPage === 1}
                >
                    <i className="fa fa-chevron-left"></i>
                </button>
            </li>
        );

        if (startPage > 1) {
            pages.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => handleHistoryPageChange(1)}>
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
                <li key={i} className={`page-item ${historyCurrentPage === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handleHistoryPageChange(i)}>
                        {i}
                    </button>
                </li>
            );
        }

        if (endPage < historyTotalPages) {
            if (endPage < historyTotalPages - 1) {
                pages.push(
                    <li key="ellipsis2" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
            pages.push(
                <li key={historyTotalPages} className="page-item">
                    <button className="page-link" onClick={() => handleHistoryPageChange(historyTotalPages)}>
                        {historyTotalPages}
                    </button>
                </li>
            );
        }

        pages.push(
            <li key="next" className={`page-item ${historyCurrentPage === historyTotalPages ? 'disabled' : ''}`}>
                <button 
                    className="page-link" 
                    onClick={() => handleHistoryPageChange(historyCurrentPage + 1)}
                    disabled={historyCurrentPage === historyTotalPages}
                >
                    <i className="fa fa-chevron-right"></i>
                </button>
            </li>
        );

        return pages;
    };









    const FilterSelect = ({ value, onChange, options, placeholder, renderOption }) => (
        <select className="form-select" value={value} onChange={onChange}>
            <option value="">{placeholder}</option>
            {options.map(option => renderOption(option))}
        </select>
    );

    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5 ">
                <div className="row mb-3 ">
                    <div className="col-12">
                        <h4 className="text-capitalize fw-bold mb-1">student management</h4>
                        <p className="text-muted small mb-0">Manage enrolled students and their information</p>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-12 col-md-6">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by name, LRN, student #..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-6 mt-2 mt-md-0 d-flex justify-content-start justify-content-md-end gap-2">
                        {!isSelectionMode ? (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-success btn-sm"
                                    onClick={handleAddStudent}
                                >
                                    <i className="fa fa-plus me-2"></i>Add Student
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setIsSelectionMode(true)}
                                >
                                    <i className="fa fa-check-square me-2"></i>Select for Email
                                </button>

                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={handleRefreshAll}
                                    title="Refresh all data (Students & Email History)"
                                    disabled={loading || loadingHistory}
                                >
                                    {(loading || loadingHistory) ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <i className="fa fa-refresh"></i>
                                    )}
                                </button>

                            </>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleCancelSelection}
                                >
                                    <i className="fa fa-times me-2"></i>Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm"
                                    onClick={handleScheduleRequirements}
                                    disabled={selectedStudentsForEmail.length === 0}
                                >
                                    <i className="fa fa-calendar me-2"></i>Schedule ({selectedStudentsForEmail.length})
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={studentType}
                            onChange={(e) => setStudentType(e.target.value)}
                        >
                            <option value="all">All Students</option>
                            <option value="regular">Regular</option>
                            <option value="repeater">Repeater</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="enrolled">Enrolled</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <FilterSelect
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            options={gradeOptions}
                            placeholder="All Grade Levels"
                            renderOption={(grade) => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            )}
                        />
                    </div>
                 
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <FilterSelect
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            options={semesterOptions}
                            placeholder="All Semesters"
                            renderOption={(semester) => (
                                <option key={semester} value={semester}>{semester === 1 ? "First" : "Second"}</option>
                            )}
                        />
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0">
                        <select 
                            className="form-select"
                            value={filterStrand}
                            onChange={(e) => setFilterStrand(e.target.value)}
                        >
                            <option value="">All Strands</option>
                            {strandOptions.map(strand => (
                                <option key={strand} value={strand}>{strand}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mt-2 mt-md-0 d-flex justify-content-end align-items-center">
                        <p className="text-muted mb-0 text-capitalize">
                            Total: <strong>{filteredStudents.length}</strong>
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
                                        <p className="text-muted mt-2">Loading students data...</p>
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fa fa-users fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No students found</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive"
                                        >
                                            <table className="table table-hover mb-0">
                                                <thead className="bg-light">
                                                    <tr>

                                                        {isSelectionMode && (
                                                            <th className="text-capitalize fw-semibold text-center">
                                                                <input 
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={currentStudents.length > 0 && currentStudents.every(student => selectedStudentsForEmail.includes(student._id))}
                                                                    onChange={handleSelectAllForEmail}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                />
                                                            </th>
                                                        )}
                                                        {['#', 'Student No', 'LRN', 'Full Name', 'Grade', 'semester', 'Strand', 'Section', 'Sex', 'Status', 'Actions'].map(header => (
                                                            <th key={header} className={`text-capitalize fw-semibold ${header === 'Actions' ? 'text-center' : ''}`}>
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentStudents.map((student, index) => (
                                                        <tr key={student._id}>

                                                            {isSelectionMode && (
                                                                <td className="align-middle text-center">
                                                                    <input 
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={selectedStudentsForEmail.includes(student._id)}
                                                                        onChange={() => handleSelectStudentForEmail(student._id)}
                                                                        style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                    />
                                                                </td>
                                                            )}


                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-info text-dark font-monospace">
                                                                    {student.studentNumber}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-secondary font-monospace">
                                                                    {student.lrn}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle fw-semibold text-capitalize">
                                                                {`${student.lastName}, ${student.firstName} ${student.middleName } 
                                                                ${(student.extensionName === "N/A") || (student.extensionName === "n/a") ? "" : student.extensionName }`.trim()}
                                                            </td>
                                                            <td className="align-middle">Grade {student.gradeLevel}</td>
                                                            <td className="align-middle small">{student.semester === 1 ? "First" : "Second"}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-danger">
                                                                    {student.strand || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle">{student.section || 'No Section'}</td>
                                                            <td className="align-middle">{student.sex}</td>
                                                            <td className="align-middle">
                                                                <span className={`badge ${getStatusBadge(student.status)} text-capitalize`}>
                                                                    {student.status}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle  text-center">
                                                                <div className="position-relative action-dropdown ">
                                                                    <button 
                                                                        className="btn btn-sm btn-light border-0"
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenDropdown(openDropdown === student._id ? null : student._id);
                                                                        }}
                                                                    >
                                                                        <i className="fa fa-ellipsis"></i>
                                                                    </button>
                                                                    {openDropdown === student._id && (
                                                                        <div 
                                                                            className="position-absolute bg-white border rounded shadow-sm py-2 "
                                                                            style={{
                                                                                minWidth: '180px',
                                                                                zIndex: 1050,
                                                                                right: '0',
                                                                                top: '100%',
                                                                                marginTop: '5px'
                                                                            }}
                                                                        >
                                                                            <DropdownItem 
                                                                                icon="eye" 
                                                                                text="View Details" 
                                                                                color="primary"
                                                                                onClick={() => handleViewStudent(student)}
                                                                            />
                                                                            <DropdownItem 
                                                                                icon="edit" 
                                                                                text="Edit Student" 
                                                                                color="warning"
                                                                                onClick={() => handleEditStudent(student)}
                                                                            />

                                                                            <DropdownItem 
                                                                                icon="graduation-cap" 
                                                                                text="Mark as Graduated" 
                                                                                color="success"
                                                                                onClick={() => handleMarkAsGraduated(student)}
                                                                            />


                                                                            <hr className="my-1" />
                                                                            <DropdownItem 
                                                                                icon="trash" 
                                                                                text="Delete Student" 
                                                                                color="danger"
                                                                                onClick={() => handleDeleteStudent(student)}
                                                                                danger
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
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
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
                                                </div>
                                            </div>

                                    
                                            {/* Right: Pagination */}
                                            <div className="col-12 col-md-6 d-flex justify-content-end gap-3 mt-3 mt-md-0
                                            flex-column flex-md-row">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={handlePrint}
                                                        title="Print Student List"
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

            
                {/* EMAIL HISTORY TABLE */}
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light">
                                <div className="row ">
                                    
                                    <div className="col-12 col-md-4">
                                        <h5 className="mb-0 text-capitalize fw-bold">
                                            <i className="fa fa-history me-2"></i>
                                            Email History
                                        </h5>
                                    </div>
                                    

                                    {/* DATE FILTER */}
                                    <div className="col-12 col-md-4 mt-2 mt-md-0">
                                        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-0 gap-md-1">
                                            <label className="text-muted small mb-0">Filter by Date:</label>
                                            <div className="input-group" style={{width: '200px'}}>
                                                <span className="input-group-text bg-white">
                                                    <i className="fa fa-calendar text-muted"></i>
                                                </span>
                                                <input 
                                                    type="date" 
                                                    className="form-control border-start-0"
                                                    value={historyDateFilter}
                                                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                                                />
                                                {historyDateFilter && (
                                                    <button 
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setHistoryDateFilter('')}
                                                        title="Clear filter"
                                                    >
                                                        <i className="fa fa-times"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    
                                    {/* DELETE BUTTONS */}
                                    <div className="col-12 col-md-4 mt-2 d-flex justify-content-start justify-content-md-end">
                                        <div>
                                            {!isDeleteMode ? (
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => setIsDeleteMode(true)}
                                                    disabled={emailHistory.length === 0}
                                                >
                                                    <i className="fa fa-trash me-2"></i>
                                                    Select for Delete
                                                </button>
                                            ) : (
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={handleCancelDelete}
                                                    >
                                                        <i className="fa fa-times me-2"></i>
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        disabled={selectedEmails.length === 0}
                                                    >
                                                        <i className="fa fa-trash me-2"></i>
                                                        Delete Selected ({selectedEmails.length})
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DATE FILTER ALERT */}
                            {historyDateFilter && (
                                <div className="alert alert-info py-2 mb-0 rounded-0">
                                    <i className="fa fa-calendar me-2"></i>
                                    Showing emails for: <strong>{new Date(historyDateFilter).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                </div>
                            )}

                            <div className="card-body p-0">
                                {loadingHistory ? (
                                   <div className="text-center py-5">
                                        <div className="spinner-border text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2">Loading email history...</p>
                                    </div>
                                ) : filteredEmailHistory.length === 0 ? (
                                    <div className="text-center py-4">
                                        <i className="fa fa-inbox fa-2x text-muted mb-2"></i>
                                        <p className="text-muted mb-0">No email history yet</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        {isDeleteMode && (
                                                            <th className="text-capitalize fw-semibold text-center">
                                                                <input 
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={currentEmailHistory.length > 0 && currentEmailHistory.every(email => selectedEmails.includes(email._id))}
                                                                    onChange={handleSelectAllEmails}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                />
                                                            </th>
                                                        )}
                                                        <th className="text-capitalize fw-semibold">#</th>
                                                        <th className="text-capitalize fw-semibold">Title</th>
                                                        <th className="text-capitalize fw-semibold">Scheduled Date & Time</th>
                                                        <th className="text-capitalize fw-semibold">Participants</th>
                                                        <th className="text-capitalize fw-semibold">Description</th>
                                                        <th className="text-capitalize fw-semibold">Sent At</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentEmailHistory.map((email, index) => (
                                                        <tr key={email._id}>
                                                            {isDeleteMode && (
                                                                <td className="align-middle text-center">
                                                                    <input 
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={selectedEmails.includes(email._id)}
                                                                        onChange={() => handleSelectEmail(email._id)}
                                                                        style={{width: '20px', height: '20px', cursor: 'pointer'}}
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="align-middle text-muted">{historyIndexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle text-muted small text-capitalize fw-semibold">{email.title}</td>
                                                            <td className="align-middle">
                                                                <div>
                                                                    <i className="fa fa-calendar me-1 small"></i>
                                                                    {new Date(email.scheduledDate).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </div>
                                                                <div className="text-muted small">
                                                                    <i className="fa fa-clock me-1"></i>
                                                                    {email.scheduledTime}
                                                                </div>
                                                            </td>
                                                            <td className="align-middle small text-muted">
                                                                <i className="fa fa-users me-1"></i>
                                                                {email.participantCount === 1 
                                                                    ? `${email.participantCount} student` 
                                                                    : `${email.participantCount} students`}
                                                            </td>
                                                            <td className="align-middle">
                                                                <small className="text-muted text-capitalize">
                                                                    {email.description.length > 50 
                                                                        ? email.description.substring(0, 50) + '...' 
                                                                        : email.description}
                                                                </small>
                                                            </td>
                                                            <td className="align-middle">
                                                                <small className="text-muted">
                                                                    {formatDate(email.createdAt)}
                                                                </small>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        
                                        {/* EMAIL HISTORY PAGINATION */}
                                        {historyTotalPages > 0 && (
                                            <div className="d-flex justify-content-between align-items-center p-3 border-top
                                            flex-column gap-3 flex-md-row
                                            ">
                                                <div className="text-muted small">
                                                    Showing {historyIndexOfFirstItem + 1} to {Math.min(historyIndexOfLastItem, filteredEmailHistory.length)} of {filteredEmailHistory.length} entries
                                                    {historyDateFilter && <span className="text-primary"> (filtered)</span>}
                                                </div>
                                                <nav>
                                                    <ul className="pagination mb-0">
                                                        {renderEmailHistoryPagination()}
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
            



            {/* SCHEDULE REQUIREMENTS MODAL */}
            {showScheduleModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    <i className="fa fa-calendar-check me-2"></i>
                                    Schedule Requirements Submission
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowScheduleModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <i className="fa fa-info-circle me-2"></i>
                                    <strong>{selectedStudentsForEmail.length}</strong> student(s) selected. They will receive an email notification.
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-capitalize fw-bold">
                                        Title <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control text-capitalize"
                                        value={scheduleData.title}
                                        onChange={(e) => setScheduleData({...scheduleData, title: e.target.value})}
                                        placeholder="e.g., Submit Grade 11 Requirements"
                                    />
                                </div>

                                <div className="row mb-3">
                                    <div className="col-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Date <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            className="form-control"
                                            value={scheduleData.date}
                                            onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Time <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="time" 
                                            className="form-control"
                                            value={scheduleData.time}
                                            onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-capitalize fw-bold">
                                        Description <span className="text-danger">*</span>
                                    </label>
                                    <textarea 
                                        className="form-control"
                                        rows="5"
                                        value={scheduleData.description}
                                        onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})}
                                        placeholder="Provide detailed description of requirements to be submitted..."
                                    ></textarea>
                                    <small className="text-muted">
                                        This description will be included in the email notification.
                                    </small>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowScheduleModal(false)}
                                    disabled={isSubmittingSchedule}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleSubmitSchedule}
                                    disabled={isSubmittingSchedule}
                                >
                                    {isSubmittingSchedule ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-paper-plane me-2"></i>
                                            Schedule & Send Notifications
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE EMAIL HISTORY CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 text-danger">
                                    <i className="fa fa-exclamation-triangle fa-3x"></i>
                                </div>
                                <h5 className="fw-bold mb-2">Confirm Delete</h5>
                                <p className="text-muted mb-4">
                                    Are you sure you want to delete <strong>{selectedEmails.length}</strong> email history record(s)? 
                                    This action cannot be undone.
                                </p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary px-4"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger px-4"
                                        onClick={handleDeleteEmails} disabled={isDeleting}>
                                        {isDeleting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-trash me-2"></i>Yes, Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Delete/Graduate Confirmation Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            {modalType === 'delete' && selectedStudent && (
                                <>
                                    <div className="modal-header">
                                        <h5 className="modal-title text-capitalize">Delete Student</h5>
                                        <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <div className="text-muted">
                                            <p className="mb-2">Do you really want to delete student:</p>
                                            <strong className="text-capitalize d-block mb-2">
                                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                                            </strong>
                                            <span className="badge bg-secondary">
                                                {selectedStudent?.studentNumber}
                                            </span>
                                            <small className="text-danger mt-3 d-block">This action cannot be undone.</small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={confirmDelete} 
                                        disabled={isDeleting}>
                                            {isDeleting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-trash me-2"></i>Yes, Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {modalType === 'graduate' && selectedStudent && (
                                <>
                                    <div className="modal-header">
                                        <h5 className="modal-title text-capitalize">Mark as Graduated</h5>
                                        <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-graduation-cap fa-3x text-success mb-3"></i>
                                        <h5 className="mb-3">Confirm Graduation</h5>
                                        <div className="text-muted">
                                            <p className="mb-2">Mark this student as graduated:</p>
                                            <strong className="text-capitalize d-block mb-2">
                                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                                            </strong>
                                            <span className="badge bg-secondary">
                                                {selectedStudent?.studentNumber}
                                            </span>
                                            <small className="text-success mt-3 d-block">This will update the student's status to "graduated".</small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="button" className="btn btn-success" onClick={confirmGraduate} disabled={isGraduating}>
                                            {isGraduating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-graduation-cap me-2"></i>Yes, Mark as Graduated
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
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999999}}>
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


            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <i className="fa fa-user-plus me-2"></i>Add New Student
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={handleCloseAddModal}></button>
                            </div>
                            <form onSubmit={handleAddSubmit}>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    {/* Personal Information */}
                                    <div className="mb-4">
                                        <h6 className="text-success fw-bold mb-3">Personal Information</h6>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">LRN <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="lrn"
                                                    value={addFormData.lrn}
                                                    onChange={handleAddFormChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Email <span className="text-danger">*</span></label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    value={addFormData.email}
                                                    onChange={handleAddFormChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label">First Name <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="firstName"
                                                    value={addFormData.firstName}
                                                    onChange={handleAddFormChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label">Middle Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="middleName"
                                                    value={addFormData.middleName}
                                                    onChange={handleAddFormChange}
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label">Last Name <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="lastName"
                                                    value={addFormData.lastName}
                                                    onChange={handleAddFormChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label">Ext.</label>
                                                <select
                                                    className="form-select"
                                                    name="extensionName"
                                                    value={addFormData.extensionName}
                                                    onChange={handleAddFormChange}
                                                >
                                                    <option value="N/A">N/A</option>
                                                    <option value="Jr.">Jr.</option>
                                                    <option value="Sr.">Sr.</option>
                                                    <option value="II">II</option>
                                                    <option value="III">III</option>
                                                    <option value="IV">IV</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Birth Date <span className="text-danger">*</span></label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="birthDate"
                                                    value={addFormData.birthDate}
                                                    onChange={handleAddFormChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Sex <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="sex"
                                                    value={addFormData.sex}
                                                    onChange={handleAddFormChange}
                                                    required
                                                >
                                                    <option value="">Select Sex</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Contact Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="contactNumber"
                                                    value={addFormData.contactNumber}
                                                    onChange={handleAddFormChange}
                                                    maxLength="13"
                                                />
                                                <small className="text-muted">Format: 0XXX XXX XXXX (11 digits)</small>
                                            </div>
                                        </div>
                                    </div>




                                    {/* Academic Information */}
                                    <div className="mb-3">
                                        <h6 className="text-success fw-bold mb-3">Academic Information</h6>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Student Type <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="studentType"
                                                    value={addFormData.studentType}
                                                    onChange={handleAddFormChange}
                                                    required
                                                >
                                                    <option value="regular">Regular</option>
                                                    <option value="repeater">Repeater</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Grade Level <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="gradeLevel"
                                                    value={addFormData.gradeLevel}
                                                    onChange={handleAddFormChange}
                                                    required
                                                >
                                                    <option value="">Select Grade</option>
                                                    <option value="11">Grade 11</option>
                                                    <option value="12">Grade 12</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Semester <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="semester"
                                                    value={addFormData.semester}
                                                    onChange={handleAddFormChange}
                                                    required
                                                >
                                                    <option value="">Select Semester</option>
                                                    <option value={1}>First </option>
                                                    <option value={2}>Second </option>
                                                </select>
                                            </div>
                                        </div>



                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Track <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="track"
                                                    value={addFormData.track}
                                                    onChange={handleAddFormChange}
                                                    required
                                                >
                                                    <option value="">Select Track</option>
                                                    <option value="Academic">Academic</option>
                                                    <option value="TVL">TVL (Technical-Vocational-Livelihood)</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Strand <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    name="strand"
                                                    value={addFormData.strand}
                                                    onChange={handleAddFormChange}
                                                    disabled={!addFormData.track}
                                                    required
                                                >
                                                    <option value="">
                                                        {!addFormData.track ? 'Select Track First' : 'Select Strand'}
                                                    </option>
                                                    {addFormData.track && 
                                                        STRAND_OPTIONS[addFormData.track]?.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Password and security */}
                                    <div className="mb-3">
                                        <h6 className="text-success fw-bold mb-3  text-capitalize">paswword & security</h6>
                                        
                                    {/* ✅ Row 4: Password & Confirm Password */}
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Password <span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        className="form-control"
                                                        name="password"
                                                        value={addFormData.password}
                                                        onChange={handleAddFormChange}
                                                        required
                                                        minLength="6"
                                                    />
                                                    <button 
                                                        className="btn btn-outline-secondary" 
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                    </button>
                                                </div>
                                                <small className="text-muted">Minimum 6 characters</small>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        className="form-control"
                                                        name="confirmPassword"
                                                        value={addFormData.confirmPassword}
                                                        onChange={handleAddFormChange}
                                                        required
                                                    />
                                                    <button 
                                                        className="btn btn-outline-secondary" 
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>








                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>
                                        <i className="fa fa-times me-2"></i>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-save me-2"></i>Create Student
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};






const DropdownItem = ({ icon, text, color, onClick, danger = false }) => (
    <button 
        className={`dropdown-item d-flex align-items-center px-3 py-2 border-0 bg-transparent w-100 text-start ${danger ? 'text-danger' : ''}`}
        onClick={onClick}
        style={{cursor: 'pointer'}}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
    >
        <i className={`fa fa-${icon} text-${color} me-2`} style={{width: '20px'}}></i>
        <span>{text}</span>
    </button>
);

export default StudentManagement;