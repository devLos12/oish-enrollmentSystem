import { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../context/global.jsx";
import * as XLSX from "xlsx";


const dayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];


const SubjectDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const subjectId = location?.state?.subjectId;
    const [subjectData, setSubjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { setTextHeader } = useContext(globalContext);

    const [showSectionModal, setShowSectionModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedSection, setSelectedSection] = useState(null);
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // ✅ Excel Bulk Import States
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkStep, setBulkStep] = useState('upload'); // 'upload' | 'preview'
    const [excelFile, setExcelFile] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [editingRows, setEditingRows] = useState({});
    const [manualRows, setManualRows] = useState([]);

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedSectionIds, setSelectedSectionIds] = useState([]);


    const [showEditDaysModal, setShowEditDaysModal] = useState(false);
    const [editDays, setEditDays] = useState([]);
    const [isEditDaysSubmitting, setIsEditDaysSubmitting] = useState(false);








    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        if (subjectId) getSubjectDetails();
    }, [subjectId]);

    useEffect(() => {
        if (subjectData?.gradeLevel && subjectData?.strand && subjectData?.track && subjectData?.semester) {
            fetchAvailableSections();
        }
    }, [subjectData?.gradeLevel, subjectData?.strand, subjectData?.track, subjectData?.semester]);




    const getSubjectDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSubjectDetails/${subjectId}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            if (data.success) {
                const reversedData = {
                    ...data.data,
                    sections: data.data.sections ? [...data.data.sections].reverse() : []
                };
                setSubjectData(reversedData);
            }
        } catch (error) {
            showAlert("Failed to load subject details", 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSections = async () => {
        try {

            const params = new URLSearchParams({
                gradeLevel: subjectData.gradeLevel,
                track: subjectData.track,
                strand: subjectData.strand,
                semester: subjectData.semester,
                subjectId: subjectId,
            });
            
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSubjetSections?${params}`,
                { method: "GET", credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAvailableSections(data);
        } catch (error) {
            showAlert("Failed to load sections", 'error');
            setAvailableSections([]);
        } finally {
            setLoadingSections(false);
        }
    };






    const handleAddSection = () => {
        setSelectedSection({ sectionName: '', scheduleDays: [], scheduleStartTime: '', scheduleEndTime: '', room: '', gradeLevel: '' });
        setModalType('add');
        setShowSectionModal(true);
    };

    const handleEditSection = (section) => {
        setSelectedSection({ scheduleDays: [], ...section }); // fallback kung walang scheduleDays sa existing data
        setModalType('edit');
        setShowSectionModal(true);
    };







    const handleDeleteSection = (section) => {
        setSelectedSection(section);
        setModalType('delete');
        setShowSectionModal(true);
    };



    const toggleDay = (day) => {
        const current = selectedSection?.scheduleDays || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        setSelectedSection({ ...selectedSection, scheduleDays: updated });
    };



    const handleSubmitSection = async () => {



        if (
            !selectedSection.sectionName?.trim() ||
            !selectedSection.scheduleDays?.length ||      // ✅ dagdag
            !selectedSection.scheduleStartTime ||
            !selectedSection.scheduleEndTime ||
            !selectedSection.room?.trim()
        ) {
            showAlert("All fields are required!", 'error');
            return;
        }


        if (timeToMinutes(selectedSection.scheduleEndTime) <= timeToMinutes(selectedSection.scheduleStartTime)) {
            showAlert("End time must be after start time!", 'error');
            return;
        }




        if (exceedsOneHour(selectedSection.scheduleStartTime, selectedSection.scheduleEndTime)) {
            showAlert("Schedule duration must not exceed 1 hour.", 'error');
            return;
        }





  


        if (hasScheduleConflict(
            selectedSection.scheduleDays,
            selectedSection.scheduleStartTime,
            selectedSection.scheduleEndTime,
            modalType === 'edit' ? selectedSection._id : null
        )) {
            showAlert(
                "Schedule time already exist.",
                'error'
            );
            return;
        }





        setIsSubmitting(true);
        try {
            const url = modalType === 'add'
                ? `${import.meta.env.VITE_API_URL}/api/addSubjectSection/${subjectId}`
                : `${import.meta.env.VITE_API_URL}/api/updateSubjectSection/${subjectId}/${selectedSection._id}`;
            const method = modalType === 'add' ? 'POST' : 'PATCH';
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectionName: selectedSection.sectionName,
                    scheduleDays: selectedSection.scheduleDays, 
                    scheduleStartTime: selectedSection.scheduleStartTime,
                    scheduleEndTime: selectedSection.scheduleEndTime,
                    room: selectedSection.room,
                    gradeLevel: subjectData.gradeLevel
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(data.message, 'success');
            setShowSectionModal(false);
            getSubjectDetails();
        } catch (error) {
            showAlert(`Failed to ${modalType === 'add' ? 'add' : 'update'} section: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteSection = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/deleteSubjectSection/${subjectId}/${selectedSection._id}`,
                { method: "DELETE", credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert("Section deleted successfully!", 'success');
            setShowSectionModal(false);
            getSubjectDetails();
        } catch (error) {
            showAlert("Failed to delete section", 'error');
        }
    };

    // ============================================================
    // ✅ EXCEL BULK IMPORT HELPERS
    // ============================================================

    /**
     * Convert various time formats to 24hr string "HH:MM"
     * Accepts: "7:30 AM", "07:30", "7:30", Excel serial number
     */
    const parseTimeTo24Hr = (rawValue) => {
        if (rawValue === undefined || rawValue === null || rawValue === '') return '';

        // Excel serial time (decimal like 0.3125 = 7:30 AM)
        if (typeof rawValue === 'number') {
            const totalMinutes = Math.round(rawValue * 24 * 60);
            const hours = Math.floor(totalMinutes / 60) % 24;
            const minutes = totalMinutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        const str = String(rawValue).trim().toUpperCase();

        // Already HH:MM 24hr
        const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
            const h = parseInt(match24[1]);
            const m = parseInt(match24[2]);
            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        }

        // 12-hour format: "7:30 AM", "12:00 PM"
        const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
        if (match12) {
            let h = parseInt(match12[1]);
            const m = parseInt(match12[2]);
            const meridiem = match12[3];
            if (meridiem === 'PM' && h !== 12) h += 12;
            if (meridiem === 'AM' && h === 12) h = 0;
            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        }

        return ''; // unparseable
    };

    const downloadTemplate = () => {
        const strand = subjectData?.strand || 'STRAND';
        const grade = subjectData?.gradeLevel || 'XX';

        // Sample rows based on strand
        const sampleSections = availableSections.slice(0, 3).map(s => s.name);
        while (sampleSections.length < 3) sampleSections.push(`${strand}-${String.fromCharCode(65 + sampleSections.length)}`);

 

        const templateData = [
            ['Section Name', 'Start Time', 'End Time', 'Room', 'Days'],
            [sampleSections[0], '7:00 AM', '8:00 AM', 'Room 101', 'Monday,Wednesday,Friday'],
            [sampleSections[1], '8:00 AM', '9:00 AM', 'Room 102', 'Tuesday,Thursday'],
            [sampleSections[2], '9:00 AM', '10:00 AM', 'Room 103', 'Monday,Tuesday,Wednesday,Thursday,Friday'],
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Column widths
        ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 35 }];

        // Header style hint via comment
        ws['A1'].c = [{ a: 'System', t: `Available sections for Grade ${grade} ${strand}: ${availableSections.map(s => s.name).join(', ')}` }];

        XLSX.utils.book_append_sheet(wb, ws, 'Sections Template');
        XLSX.writeFile(wb, `sections_template_${strand}_Grade${grade}.xlsx`);
    };

    const processExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: false });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                if (rows.length < 2) {
                    showAlert("Excel file is empty or has no data rows.", 'error');
                    return;
                }

                // Skip header row
                const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== ''));

                const errors = [];
                const parsed = dataRows.map((row, idx) => {
                    const rowNum = idx + 2; // +2 because header is row 1
                    const sectionName = String(row[0] || '').trim();
                    const startRaw = row[1];
                    const endRaw = row[2];

                    const room = String(row[3] || '').trim();
                    const daysRaw = String(row[4] || '').trim();

                    const scheduleStartTime = parseTimeTo24Hr(startRaw);
                    const scheduleEndTime = parseTimeTo24Hr(endRaw);

                    const scheduleDays = daysRaw
                        ? daysRaw.split(',')
                            .map(d => {
                                const trimmed = d.trim();
                                // Support shorthand: Mon → Monday, Tue → Tuesday, etc.
                                return dayOptions.find(opt =>
                                    opt.toLowerCase() === trimmed.toLowerCase() ||
                                    opt.toLowerCase().startsWith(trimmed.toLowerCase())
                                ) || null;
                            })
                            .filter(Boolean)
                        : [];




                    // Check if section name matches available sections for this strand
                    const matchedSection = availableSections.find(
                        s => s.name.toLowerCase() === sectionName.toLowerCase()
                    );

                    const rowErrors = [];
                    if (!sectionName) rowErrors.push('Section Name is required');
                    else if (!matchedSection) rowErrors.push(`"${sectionName}" Please create this section first.`);

                    if (!scheduleStartTime) rowErrors.push('Start Time is invalid (use format: 7:00 AM or 07:00)');
                    if (!scheduleEndTime) rowErrors.push('End Time is invalid (use format: 8:00 AM or 08:00)');
                    if (!room) rowErrors.push('Room is required');
                    if (!scheduleDays.length) rowErrors.push('Days is required (e.g. Monday,Wednesday,Friday)');
                    
                    
                    if (scheduleStartTime && scheduleEndTime) {
                        if (timeToMinutes(scheduleEndTime) <= timeToMinutes(scheduleStartTime)) {
                            rowErrors.push('End time must be after start time');
                        }
                    }   



                    if (scheduleStartTime && scheduleEndTime) {
                        if (exceedsOneHour(scheduleStartTime, scheduleEndTime)) {
                            rowErrors.push('Schedule must not exceed 1 hour');
                        }
                    }

                    
                    if (rowErrors.length > 0) {
                        errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
                    }




                    return {
                        id: `row-${idx}-${Date.now()}`,
                        scheduleDays,
                        sectionName: matchedSection ? matchedSection.name : sectionName,
                        scheduleStartTime,
                        scheduleEndTime,
                        room,
                        hasError: rowErrors.length > 0,
                        errorMessages: rowErrors
                    };
                });

                setExcelData(parsed);
                setImportErrors(errors);
                setBulkStep('preview');
            } catch (err) {
                showAlert("Failed to read Excel file: " + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            showAlert("Please upload a valid Excel file (.xlsx or .xls)", 'error');
            return;
        }
        setExcelFile(file);
        processExcelFile(file);
    };

    const updateExcelRow = (index, fields) => {
        setExcelData(prev => {
            const updated = [...prev];
            const updatedRow = { ...updated[index], ...fields };

            // Re-validate after update
            const rowErrors = [];
            const matchedSection = availableSections.find(
                s => s.name.toLowerCase() === (updatedRow.sectionName || '').toLowerCase()
            );
            if (!updatedRow.sectionName) rowErrors.push('Section Name is required');
            else if (!matchedSection) rowErrors.push(`"${updatedRow.sectionName}" is not valid for ${subjectData?.strand}`);

            if (!updatedRow.scheduleDays?.length) rowErrors.push('Days is required');
            if (!updatedRow.scheduleStartTime) rowErrors.push('Start Time is required');
            if (!updatedRow.scheduleEndTime) rowErrors.push('End Time is required');
            if (!updatedRow.room?.trim()) rowErrors.push('Room is required');


            if (updatedRow.scheduleStartTime && updatedRow.scheduleEndTime) {
                if (timeToMinutes(updatedRow.scheduleEndTime) <= timeToMinutes(updatedRow.scheduleStartTime)) {
                    rowErrors.push('End time must be after start time');
                }
            }



            if (updatedRow.scheduleStartTime && updatedRow.scheduleEndTime) {
                if (exceedsOneHour(updatedRow.scheduleStartTime, updatedRow.scheduleEndTime)) {
                    rowErrors.push('Schedule must not exceed 1 hour');
                }
            }



            updatedRow.hasError = rowErrors.length > 0;
            updatedRow.errorMessages = rowErrors;
            updated[index] = updatedRow;
            return updated;
        });
    };

    const removeExcelRow = (index) => {
        setExcelData(prev => prev.filter((_, i) => i !== index));
    };

    const toggleEditRow = (index) => {
        setEditingRows(prev => ({ ...prev, [index]: !prev[index] }));
    };








    const resetBulkImport = () => {
        setExcelFile(null);
        setExcelData([]);
        setImportErrors([]);
        setBulkStep('upload');
        setEditingRows({});
        setManualRows([]);   // ✅ dagdag
    };

    const createEmptyRow = () => ({
        id: `manual-${Date.now()}-${Math.random()}`,
        sectionName: '',
        scheduleDays: [],
        scheduleStartTime: '',
        scheduleEndTime: '',
        room: '',
        hasError: true,
        errorMessages: ['Fill in all fields'],
        isManual: true,
    });

    const handleAddManualRow = () => {
        setManualRows(prev => [...prev, createEmptyRow()]);
        if (bulkStep === 'upload') setBulkStep('preview');
    };



    const updateManualRow = (id, fields) => {
        setManualRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updatedRow = { ...r, ...fields };

            const rowErrors = [];
            const matchedSection = availableSections.find(
                s => s.name.toLowerCase() === (updatedRow.sectionName || '').toLowerCase()
            );
            if (!updatedRow.sectionName) rowErrors.push('Section Name required');
            else if (!matchedSection) rowErrors.push(`"${updatedRow.sectionName}" is not valid`);
            if (!updatedRow.scheduleDays?.length) rowErrors.push('Days required');
            if (!updatedRow.scheduleStartTime) rowErrors.push('Start Time required');
            if (!updatedRow.scheduleEndTime) rowErrors.push('End Time required');
            if (!updatedRow.room?.trim()) rowErrors.push('Room required');



            if (updatedRow.scheduleStartTime && updatedRow.scheduleEndTime) {
                if (timeToMinutes(updatedRow.scheduleEndTime) <= timeToMinutes(updatedRow.scheduleStartTime)) {
                    rowErrors.push('End time must be after start time');
                }
            }



            if (updatedRow.scheduleStartTime && updatedRow.scheduleEndTime) {
                if (exceedsOneHour(updatedRow.scheduleStartTime, updatedRow.scheduleEndTime)) {
                    rowErrors.push('Schedule must not exceed 1 hour');
                }
            }


            updatedRow.hasError = rowErrors.length > 0;
            updatedRow.errorMessages = rowErrors;
            return updatedRow;
        }));
    };

    const handleDeleteManualRow = (id) => {
        setManualRows(prev => prev.filter(r => r.id !== id));
    };








    const handleOpenBulkModal = () => {
        resetBulkImport();
        setShowBulkModal(true);
    };

    const handleCloseBulkModal = () => {
        setShowBulkModal(false);
        resetBulkImport();
    };



    
    const handleBulkSubmit = async () => {
        const allRows = [...excelData, ...manualRows];          
        const validRows = allRows.filter(row => !row.hasError); 
        const errorRows = allRows.filter(row => row.hasError);  

        if (errorRows.length > 0) {
            showAlert(`Please fix ${errorRows.length} row(s) with errors before importing.`, 'error');
            return;
        }

        if (validRows.length === 0) {
            showAlert('No valid rows to import.', 'error');
            return;
        }

        // Check for duplicate section names within the batch
        const sectionNames = validRows.map(r => r.sectionName);
        const duplicates = sectionNames.filter((name, i) => sectionNames.indexOf(name) !== i);
        if (duplicates.length > 0) {
            showAlert(`Duplicate section names in import: ${[...new Set(duplicates)].join(', ')}`, 'error');
            return;
        }




        const conflictingRows = validRows.filter(row =>
            hasScheduleConflict(row.scheduleDays, row.scheduleStartTime, row.scheduleEndTime)
        );
        if (conflictingRows.length > 0) {
            showAlert(
                `Schedule conflict detected in ${conflictingRows.length} row(s):\n` +
                conflictingRows.map(r => `• ${r.sectionName}: ${formatTime12Hour(r.scheduleStartTime)} - ${formatTime12Hour(r.scheduleEndTime)}`).join('\n'),
                'error'
            );
            return;
        }





        try {
            setIsBulkSubmitting(true);
            const sections = validRows.map(row => ({
                sectionName: row.sectionName,
                scheduleDays: row.scheduleDays || [],
                scheduleStartTime: row.scheduleStartTime,
                scheduleEndTime: row.scheduleEndTime,
                room: row.room.trim()
            }));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bulkAddSubjectSections/${subjectId}`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sections }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.errors ? data.errors.join('\n') : data.message);
            showAlert(data.message, 'success');
            handleCloseBulkModal();
            getSubjectDetails();
            fetchAvailableSections();
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setIsBulkSubmitting(false);
        }
    };




    const handleOpenEditDaysModal = () => {
        setEditDays([]);
        setShowEditDaysModal(true);
    };

    const toggleEditDay = (day) => {
        setEditDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmitEditDays = async () => {
        if (!editDays.length) {
            showAlert("Select at least one day!", 'error');
            return;
        }

        try {
            setIsEditDaysSubmitting(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateSectionScheduleDays/${subjectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectionIds: selectedSectionIds,
                    scheduleDays: editDays
                }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showAlert(data.message, 'success');
            setShowEditDaysModal(false);
            setIsSelectMode(false);
            setSelectedSectionIds([]);
            getSubjectDetails();
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setIsEditDaysSubmitting(false);
        }
    };




    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };






    const formatTime12Hour = (time24) => {
        if (!time24) return 'N/A';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };



    //  Convert "HH:MM" to total minutes for easy comparison
    const timeToMinutes = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    



    const addOneHour = (time24) => {
        if (!time24) return '';
        const [h, m] = time24.split(':').map(Number);
        const totalMinutes = h * 60 + m + 60;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const exceedsOneHour = (startTime, endTime) => {
        if (!startTime || !endTime) return false;
        return timeToMinutes(endTime) - timeToMinutes(startTime) > 60;
    };





    //  Check if two time ranges overlap (exclusive — same end/start is fine)
    const timesOverlap = (start1, end1, start2, end2) => {
        const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
        const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
        if (s1 === null || e1 === null || s2 === null || e2 === null) return false;

        return s1 < e2 && e1 > s2; // overlap if ranges intersect
    };

    //  Check if a new schedule conflicts with existing sections
    // `days` = array of day strings, ignores sectionId (for edit mode)
    const hasScheduleConflict = (days, startTime, endTime, excludeSectionId = null) => {
        return (subjectData?.sections || []).some(section => {
            if (excludeSectionId && section._id === excludeSectionId) return false; // skip self (edit mode)
            if (!section.scheduleDays?.length) return false;
            const sharedDays = days.filter(d => section.scheduleDays.includes(d));
            if (!sharedDays.length) return false;
            return timesOverlap(startTime, endTime, section.scheduleStartTime, section.scheduleEndTime);
        });
    };
    


    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSections = subjectData?.sections?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const totalPages = Math.ceil((subjectData?.sections?.length || 0) / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

        pages.push(
            <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <i className="fa fa-chevron-left"></i>
                </button>
            </li>
        );
        if (startPage > 1) {
            pages.push(<li key={1} className="page-item"><button className="page-link" onClick={() => handlePageChange(1)}>1</button></li>);
            if (startPage > 2) pages.push(<li key="e1" className="page-item disabled"><span className="page-link">...</span></li>);
        }
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
                </li>
            );
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<li key="e2" className="page-item disabled"><span className="page-link">...</span></li>);
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

    // Derived preview (first 10 rows shown, but all data in excelData)
    const excelPreview = excelData;
    const allRows = [...excelData, ...manualRows];              
    const errorCount = allRows.filter(r => r.hasError).length;  
    const validCount = allRows.filter(r => !r.hasError).length; 



    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <p className="text-muted mt-2">Loading subject details...</p>
                </div>
            </div>
        );
    }

    if (!subjectData) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">Subject not found</div>
            </div>
        );
    }

    return (
        <>
            <div className="container py-4 ">

                {/* Back button */}
                <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}>
                    <i className="fa fa-arrow-left me-2" />Back
                </button>

                {/* Subject Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-info">{subjectData.subjectCode}</span>
                                    <p className="m-0">|</p>
                                    <p className="fw-bold m-0 fs-4">{subjectData.subjectName}</p>

                                </div>
                              
                                <div className="text-muted d-flex gap-2 my-3">
                                    <p className="m-0 text-muted fw-semibold">{subjectData.strand}</p>
                                </div>
                                <p className="mb-0 gap-2 d-flex text-capitalize">
                                    <strong>Teacher:</strong> {subjectData.teacher}
                                </p>
                                <span className="fw-semibold">Grade {subjectData.gradeLevel} - {subjectData.semester === 1 ? "First Semester" : "Second Semester"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0">Sections ({subjectData.sections?.length || 0})</h5>
                                    <div className="d-flex gap-2">
                                        {!isSelectMode ? (
                                            <>
                                                <button className="btn btn-sm btn-outline-danger text-capitalize" onClick={handleOpenBulkModal}>
                                                    <i className="fa fa-file-excel-o me-2"></i>Import Sections
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={handleAddSection}>
                                                    <i className="fa fa-plus me-2"></i>Add Section
                                                </button>
                                                {/* <button className="btn btn-sm btn-outline-secondary" onClick={() => { setIsSelectMode(true); setSelectedSectionIds([]); }}>
                                                    <i className="fa fa-check-square-o me-2"></i>Select
                                                </button> */}
                                            </>
                                        ) : (
                                            <>
                                                {selectedSectionIds.length > 0 ? (
                                                    <button className="btn btn-sm btn-warning" onClick={handleOpenEditDaysModal}>
                                                        <i className="fa fa-calendar me-2"></i>Edit Schedule Days ({selectedSectionIds.length})
                                                    </button>
                                                ) : (
                                                    <span className="text-muted small align-self-center">Select sections below...</span>
                                                )}

                                                
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => { setIsSelectMode(false); setSelectedSectionIds([]); }}>
                                                    <i className="fa fa-times me-2"></i>Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {subjectData.sections && subjectData.sections.length > 0 ? (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Section Name</th>
                                                        <th>Time</th>
                                                        <th>Room</th>
                                                        <th>Total Students</th>
                                                        <th className="text-center">Actions</th>
                                                        {isSelectMode && (
                                                            <th className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={selectedSectionIds.length === currentSections.length && currentSections.length > 0}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedSectionIds(currentSections.map(s => s._id));
                                                                        } else {
                                                                            setSelectedSectionIds([]);
                                                                        }
                                                                    }}
                                                                />
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentSections.map((section, index) => (
                                                        <tr key={index}>
                                                            <td className="align-middle">{indexOfFirstItem + index + 1}</td>
                                                            <td className="align-middle fw-semibold">{section.sectionName}</td>
                                             

                                                            <td className="align-middle">
                                                                <div className="d-flex flex-wrap gap-1 mb-1">
                                                                    {section.scheduleDays?.length
                                                                        ? section.scheduleDays.map(d => (
                                                                            <span key={d} className="badge bg-primary bg-opacity-75 text-capitalize" style={{ fontSize: '0.7rem' }}>
                                                                                {d.slice(0, 3)}
                                                                            </span>
                                                                        ))
                                                                        : <span className="text-muted small">No days set</span>
                                                                    }
                                                                </div>
                                                                <small className="text-muted">
                                                                    {formatTime12Hour(section.scheduleStartTime)} - {formatTime12Hour(section.scheduleEndTime)}
                                                                </small>
                                                            </td>


                                                            <td className="align-middle text-capitalize">{section.room || 'N/A'}</td>
                                                            <td className="align-middle">
                                                                <span className="badge bg-info">{section.students?.length || 0}</span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditSection(section)} title="Edit">
                                                                        <i className="fa fa-edit"></i>
                                                                    </button>
                                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(section)} title="Delete">
                                                                        <i className="fa fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            {isSelectMode && (
                                                                <td className="align-middle text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={selectedSectionIds.includes(section._id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedSectionIds(prev => [...prev, section._id]);
                                                                            } else {
                                                                                setSelectedSectionIds(prev => prev.filter(id => id !== section._id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                                <div className="text-muted small">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, subjectData.sections.length)} of {subjectData.sections.length} entries
                                                </div>
                                                <nav><ul className="pagination mb-0">{renderPagination()}</ul></nav>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fa fa-folder-open fa-3x text-muted mb-3"></i>
                                        <p className="text-muted mb-0">No sections available for this subject.</p>
                                        <button className="btn btn-sm btn-outline-danger mt-3" onClick={handleAddSection}>
                                            <i className="fa fa-plus me-2"></i>Add First Section
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================
                Add / Edit / Delete Section Modal
            ===================================== */}
            {showSectionModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className={`modal-dialog modal-dialog-centered ${modalType !== 'delete' && 'modal-lg'}`}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType === 'add' && 'Add New Section'}
                                    {modalType === 'edit' && 'Edit Section'}
                                    {modalType === 'delete' && 'Delete Section'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowSectionModal(false)}></button>
                            </div>

                            {(modalType === 'add' || modalType === 'edit') && (
                                <>
                                    <div className="modal-body">
                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <label className="form-label text-capitalize fw-bold">
                                                    Section Name:
                                                </label>
                                                <span className="text-danger small ms-2">*</span>
                                                <select
                                                    className="form-select"
                                                    value={selectedSection?.sectionName || ''}
                                                    onChange={(e) => setSelectedSection({ ...selectedSection, sectionName: e.target.value })}
                                                    disabled={loadingSections}
                                                >
                                                    <option value="">Select Section</option>
                                                    {availableSections.map(section => (
                                                        <option key={section._id} value={section.name}>
                                                            {section.name} ({section.students?.length || 0}/{section.maxCapacity})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-6">
                                                <label className="form-label small fw-bold">Room:</label>
                                                <span className="text-danger small ms-2">*</span>
                                                <input type="text" className="form-control" placeholder="e.g. Room 101"
                                                    value={selectedSection?.room || ''}
                                                    onChange={(e) => setSelectedSection({ ...selectedSection, room: e.target.value.toUpperCase() })} />
                                            </div>



                                            <div className="col-6 mt-3">
                                                <label className="form-label small fw-bold">Start Time:</label>
                                                <span className="text-danger small ms-2">*</span>

                                                <input type="time" className="form-control"
                                                value={selectedSection?.scheduleStartTime || ''}
                                                onChange={(e) => {
                                                    const newStart = e.target.value;
                                                    setSelectedSection({
                                                        ...selectedSection,
                                                        scheduleStartTime: newStart,
                                                        // ✅ auto-set end time to +1hr kapag nag-pick ng start
                                                        scheduleEndTime: newStart ? addOneHour(newStart) : ''
                                                    });
                                                }} />
                                                

                                                
                                            </div>
                                            <div className="col-6 mt-3">
                                                <label className="form-label small fw-bold">End Time:</label>
                                                <span className="text-danger small ms-2">*</span>
                                                

                                                <input type="time" className="form-control"
                                                    value={selectedSection?.scheduleEndTime || ''}
                                                    onChange={(e) => setSelectedSection({ ...selectedSection, scheduleEndTime: e.target.value })} />
                                                {exceedsOneHour(selectedSection?.scheduleStartTime, selectedSection?.scheduleEndTime) && (
                                                    <small className="text-danger d-block mt-1">
                                                        <i className="fa fa-exclamation-circle me-1"></i>
                                                        Schedule must not exceed 1 hour.
                                                    </small>
                                                )}
                                            
                                            </div>

                                            {/* Schedule Days — full width */}
                                            <div className="col-12 mt-3">
                                                

                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <label className="form-label small fw-bold mb-0">Schedule Days:</label>
                                                    <span className="text-danger small ms-1">*</span>
                                                    <div
                                                        className="d-flex align-items-center gap-1"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            if (selectedSection?.scheduleDays?.length === dayOptions.length) {
                                                                setSelectedSection({ ...selectedSection, scheduleDays: [] });
                                                            } else {
                                                                setSelectedSection({ ...selectedSection, scheduleDays: [...dayOptions] });
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input mt-0"
                                                            checked={selectedSection?.scheduleDays?.length === dayOptions.length}
                                                            onChange={() => {}}
                                                            style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                        />
                                                        <span className="small text-muted">Select All</span>
                                                    </div>
                                                </div>



                                                <div className="d-flex flex-wrap gap-2 mt-1">
                                                    {dayOptions.map(day => {
                                                        const isSelected = selectedSection?.scheduleDays?.includes(day);
                                                        return (
                                                            <div
                                                                key={day}
                                                                onClick={() => toggleDay(day)}
                                                                className={`d-flex align-items-center gap-2 px-3 py-2 rounded border cursor-pointer`}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    backgroundColor: isSelected ? '#fff5f5' : '#f8f9fa',
                                                                    borderColor: isSelected ? '#dc3545' : '#dee2e6',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleDay(day)}
                                                                    className="form-check-input mt-0"
                                                                    style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                                />
                                                                <span className={`small fw-semibold text-capitalize ${isSelected ? 'text-danger' : 'text-muted'}`}>
                                                                    {day.slice(0, 3)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {!selectedSection?.scheduleDays?.length && (
                                                    <small className="text-danger d-block mt-1">
                                                        <i className="fa fa-exclamation-circle me-1"></i>
                                                        Select at least one day
                                                    </small>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowSectionModal(false)} disabled={isSubmitting}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={handleSubmitSection} disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>{modalType === 'add' ? 'Adding...' : 'Updating...'}</>
                                            ) : (
                                                <><i className={`fa ${modalType === 'add' ? 'fa-plus' : 'fa-save'} me-2`}></i>{modalType === 'add' ? 'Add Section' : 'Update Section'}</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {modalType === 'delete' && (
                                <>
                                    <div className="modal-body text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <p className="text-muted">
                                            Do you really want to delete section <strong>{selectedSection?.sectionName}</strong>?
                                            <br />This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowSectionModal(false)}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={confirmDeleteSection}>
                                            <i className="fa fa-trash me-2"></i>Yes, Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================
                ✅ Excel Bulk Import Modal
            ===================================== */}
            {showBulkModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fa fa-file-excel-o me-2 text-success"></i>
                                    Import Sections from Excel
                                    <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: '0.75rem' }}>
                                        {subjectData.strand} | Grade {subjectData.gradeLevel}
                                    </span>
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseBulkModal} disabled={isBulkSubmitting}></button>
                            </div>

                            <div className="modal-body">

                                {/* ---- STEP: UPLOAD ---- */}
                                {bulkStep === 'upload' && (
                                    <div>
                                        {/* Info Banner */}
                                        <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
                                            <i className="fa fa-info-circle mt-1"></i>
                                            <div>
                                                <strong>Sections must match the subject's strand.</strong><br />
                                                <span className="text-muted small">
                                                    Only sections under <strong>{subjectData.strand}</strong> (Grade {subjectData.gradeLevel}) are valid.
                                                    Available: {availableSections.length > 0
                                                        ? availableSections.map(s => s.name).join(', ')
                                                        : 'None — all sections may already be assigned.'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Download Template */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <p className="text-muted mb-0 small">
                                                <i className="fa fa-lightbulb-o me-1 text-warning"></i>
                                                Download the template first, fill it in, then upload below.
                                            </p>
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={downloadTemplate}
                                                disabled={loadingSections}
                                            >
                                                <i className="fa fa-download me-2"></i>Download Template (.xlsx)
                                            </button>
                                        </div>

                                        {/* Template Column Guide */}
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
                                                        <td><strong>Start Time</strong><br /><span className="text-muted">e.g. 7:00 AM or 07:00</span></td>
                                                        <td><strong>End Time</strong><br /><span className="text-muted">e.g. 8:00 AM or 08:00</span></td>
                                                        <td><strong>Room</strong><br /><span className="text-muted">e.g. Room 101</span></td>
                                                        <td><strong>Days</strong><br /><span className="text-muted">e.g. Monday,Wednesday,Friday</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* File Upload Area */}
                                        <div
                                            className="border border-2 border-dashed rounded-3 text-center p-5"
                                            style={{ borderColor: '#dee2e6', background: '#f8f9fa', cursor: 'pointer' }}
                                            onClick={() => document.getElementById('sectionExcelInput').click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files[0];
                                                if (file) { setExcelFile(file); processExcelFile(file); }
                                            }}
                                        >
                                            <i className="fa fa-cloud-upload fa-3x text-muted mb-3 d-block"></i>
                                            <p className="mb-1 fw-semibold">Click to upload or drag & drop</p>
                                            <p className="text-muted small mb-0">Accepts .xlsx or .xls files</p>
                                            <input
                                                id="sectionExcelInput"
                                                type="file"
                                                accept=".xlsx,.xls"
                                                className="d-none"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                            

                                        {availableSections.length === 0 && !loadingSections && (
                                            <div className="alert alert-warning mt-3 mb-0">
                                                <i className="fa fa-exclamation-triangle me-2"></i>
                                                No available sections to import. All sections for this subject's strand may already be assigned.
                                            </div>
                                        )}

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
                                {bulkStep === 'preview' && (
                                    <div>
                                        {/* Summary Bar */}
                                        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                                            <span className="badge bg-primary fs-6 px-3 py-2">
                                                <i className="fa fa-table me-1"></i>{excelData.length} row(s) found
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
                                                onClick={resetBulkImport}
                                                disabled={isBulkSubmitting}
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
                                                        <th>Start Time</th>
                                                        <th>End Time</th>
                                                        <th>Room</th>
                                                        <th className="d-flex gap-2 align-items-center">
                                                            Days
                                                            {(Object.values(editingRows).some(v => v) || manualRows.length > 0) && (
                                                            <div
                                                                className="d-flex align-items-center gap-1 mt-1"
                                                                style={{ cursor: 'pointer' }}


                                                                onClick={() => {
                                                                    const editingExcelRows = excelData.filter((_, idx) => editingRows[idx]);
                                                                    const allRows = [...editingExcelRows, ...manualRows];
                                                                    const allSelected = allRows.length > 0 && allRows.every(r => r.scheduleDays?.length === dayOptions.length);
                                                                    excelData.forEach((row, idx) => {
                                                                        if (editingRows[idx]) {
                                                                            updateExcelRow(idx, { scheduleDays: allSelected ? [] : [...dayOptions] });
                                                                        }
                                                                    });
                                                                    manualRows.forEach(row => {
                                                                        updateManualRow(row.id, { scheduleDays: allSelected ? [] : [...dayOptions] });
                                                                    });
                                                                }}


                                                            
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input mt-0"
                                                                    
                                                                    
                                                                    checked={(() => {
                                                                        const editingExcelRows = excelData.filter((_, idx) => editingRows[idx]);
                                                                        const allRows = [...editingExcelRows, ...manualRows];
                                                                        if (allRows.length === 0) return false;
                                                                        return allRows.every(r => r.scheduleDays?.length === dayOptions.length);
                                                                    })()}
                                                                    
                                                                    

                                                                    onChange={() => {
                                                                        const editingExcelRows = excelData.filter((_, idx) => editingRows[idx]);
                                                                        const allRows = [...editingExcelRows, ...manualRows];
                                                                        const allSelected = allRows.length > 0 && allRows.every(r => r.scheduleDays?.length === dayOptions.length);
                                                                        excelData.forEach((row, idx) => {
                                                                            if (editingRows[idx]) {
                                                                                updateExcelRow(idx, { scheduleDays: allSelected ? [] : [...dayOptions] });
                                                                            }
                                                                        });
                                                                        manualRows.forEach(row => {
                                                                            updateManualRow(row.id, { scheduleDays: allSelected ? [] : [...dayOptions] });
                                                                        });
                                                                    }}
                                                                    style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                                />
                                                                <span className="small text-muted" style={{ fontSize: '0.7rem' }}>All</span>
                                                            </div>
                                                            )}
                                                        </th>

                                                        <th style={{ width: '100px' }} className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {excelPreview.map((row, idx) => {
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
                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            value={row.sectionName}
                                                                            onChange={(e) => updateExcelRow(idx, { sectionName: e.target.value })}
                                                                        >
                                                                            <option value="">Select Section</option>
                                                                            {availableSections
                                                                                .filter(sec =>
                                                                                    sec.name === row.sectionName ||
                                                                                    !excelData.some((r, i) => i !== idx && r.sectionName === sec.name)
                                                                                )
                                                                                .map(sec => (
                                                                                    <option key={sec._id} value={sec.name}>
                                                                                        {sec.name} ({sec.students?.length || 0}/{sec.maxCapacity})
                                                                                    </option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    ) : (
                                                                        <span className="fw-semibold">{row.sectionName || <span className="text-danger fst-italic">missing</span>}</span>
                                                                    )}
                                                                </td>





                                                                {/* Start Time */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="time"
                                                                            className="form-control form-control-sm"
                                                                            value={row.scheduleStartTime}
                                                                            onChange={(e) => updateExcelRow(idx, { scheduleStartTime: e.target.value })}
                                                                        />
                                                                    ) : (
                                                                        row.scheduleStartTime
                                                                            ? formatTime12Hour(row.scheduleStartTime)
                                                                            : <span className="text-danger fst-italic">missing</span>
                                                                    )}
                                                                </td>

                                                                {/* End Time */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="time"
                                                                            className="form-control form-control-sm"
                                                                            value={row.scheduleEndTime}
                                                                            onChange={(e) => updateExcelRow(idx, { scheduleEndTime: e.target.value })}
                                                                        />
                                                                    ) : (
                                                                        row.scheduleEndTime
                                                                            ? formatTime12Hour(row.scheduleEndTime)
                                                                            : <span className="text-danger fst-italic">missing</span>
                                                                    )}
                                                                </td>

                                                                {/* Room */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            placeholder="e.g. Room 101"
                                                                            value={row.room}
                                                                            onChange={(e) => updateExcelRow(idx, { room: e.target.value.toUpperCase() })}
                                                                        />
                                                                    ) : (
                                                                        row.room || <span className="text-danger fst-italic">missing</span>
                                                                    )}
                                                                </td>


                                                                
                                                                {/* Days */}
                                                                <td>
                                                                    {isEditing ? (

                                                                        
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {dayOptions.map(day => {
                                                                                const isSelected = row.scheduleDays?.includes(day);
                                                                                return (
                                                                                    <div
                                                                                        key={day}
                                                                                        onClick={() => updateExcelRow(idx, {
                                                                                            scheduleDays: isSelected
                                                                                                ? row.scheduleDays.filter(d => d !== day)
                                                                                                : [...(row.scheduleDays || []), day]
                                                                                        })}
                                                                                        className="d-flex align-items-center gap-1 px-2 py-1 rounded border"
                                                                                        style={{
                                                                                            cursor: 'pointer',
                                                                                            backgroundColor: isSelected ? '#fff5f5' : '#f8f9fa',
                                                                                            borderColor: isSelected ? '#dc3545' : '#dee2e6',
                                                                                        }}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            onChange={() => {}}
                                                                                            className="form-check-input mt-0"
                                                                                            style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                                                        />
                                                                                        <span className={`small fw-semibold text-capitalize ${isSelected ? 'text-danger' : 'text-muted'}`}
                                                                                            style={{ fontSize: '0.7rem' }}>
                                                                                            {day.slice(0, 3)}
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        row.scheduleDays?.length
                                                                            ? <div className="d-flex flex-wrap gap-1">
                                                                                {row.scheduleDays.map(d => (
                                                                                    <span key={d} className="text-capitalize small"
                                                                                    
                                                                                    >
                                                                                        {d.slice(0, 3)}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                            : <span className="text-danger fst-italic">missing</span>
                                                                    )}
                                                                </td>

                                                                {/* Actions */}
                                                                <td className="text-center">
                                                                    <div className="d-flex gap-1 justify-content-center">
                                                                        <button
                                                                            className={`btn btn-sm ${isEditing ? 'btn-success' : 'btn-outline-warning'}`}
                                                                            onClick={() => toggleEditRow(idx)}
                                                                            title={isEditing ? 'Done editing' : 'Edit row'}
                                                                            disabled={isBulkSubmitting}
                                                                        >
                                                                            <i className={`fa ${isEditing ? 'fa-check' : 'fa-edit'}`}></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => removeExcelRow(idx)}
                                                                            title="Remove row"
                                                                            disabled={isBulkSubmitting}
                                                                        >
                                                                            <i className="fa fa-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}



                                                    
                                                    {/* Manual Rows */}
                                                    {manualRows.map((row) => (
                                                        <tr key={row.id} className={row.hasError ? 'table-danger' : 'table-success'}>
                                                            <td className="text-center">
                                                                {row.hasError
                                                                    ? <i className="fa fa-times-circle text-danger" title={row.errorMessages?.join(', ')}></i>
                                                                    : <i className="fa fa-check-circle text-success"></i>
                                                                }
                                                            </td>

                                                            {/* Section Name */}
                                                            <td>
                                                                <select
                                                                    className="form-select form-select-sm"
                                                                    value={row.sectionName}
                                                                    onChange={(e) => updateManualRow(row.id, { sectionName: e.target.value })}
                                                                >
                                                                    <option value="">Select Section</option>
                                                                    {availableSections
                                                                        .filter(sec =>
                                                                            sec.name === row.sectionName ||
                                                                            !allRows.some(r => r.id !== row.id && r.sectionName === sec.name)
                                                                        )
                                                                        .map(sec => (
                                                                            <option key={sec._id} value={sec.name}>
                                                                                {sec.name} ({sec.students?.length || 0}/{sec.maxCapacity})
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </td>


                                                            {/* Start Time */}
                                                            <td>
                                                                <input
                                                                    type="time"
                                                                    className="form-control form-control-sm"
                                                                    value={row.scheduleStartTime}
                                                                    onChange={(e) => updateManualRow(row.id, { scheduleStartTime: e.target.value })}
                                                                />
                                                            </td>

                                                            {/* End Time */}
                                                            <td>
                                                                <input
                                                                    type="time"
                                                                    className="form-control form-control-sm"
                                                                    value={row.scheduleEndTime}
                                                                    onChange={(e) => updateManualRow(row.id, { scheduleEndTime: e.target.value })}
                                                                />
                                                            </td>

                                                            {/* Room */}
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="e.g. Room 101"
                                                                    value={row.room}
                                                                    onChange={(e) => updateManualRow(row.id, { room: e.target.value })}
                                                                />
                                                            </td>
                                                                    
                                                            
                                                            {/* Days */}
                                                            <td>
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {dayOptions.map(day => {
                                                                        const isSelected = row.scheduleDays?.includes(day);
                                                                        return (
                                                                            <div
                                                                                key={day}
                                                                                onClick={() => updateManualRow(row.id, {
                                                                                    scheduleDays: isSelected
                                                                                        ? row.scheduleDays.filter(d => d !== day)
                                                                                        : [...(row.scheduleDays || []), day]
                                                                                })}
                                                                                className="d-flex align-items-center gap-1 px-2 py-1 rounded border"
                                                                                style={{
                                                                                    cursor: 'pointer',
                                                                                    backgroundColor: isSelected ? '#fff5f5' : '#f8f9fa',
                                                                                    borderColor: isSelected ? '#dc3545' : '#dee2e6',
                                                                                }}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSelected}
                                                                                    onChange={() => {}}
                                                                                    className="form-check-input mt-0"
                                                                                    style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                                                />
                                                                                <span className={`small fw-semibold text-capitalize ${isSelected ? 'text-danger' : 'text-muted'}`}
                                                                                    style={{ fontSize: '0.7rem' }}>
                                                                                    {day.slice(0, 3)}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="text-center">
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteManualRow(row.id)}
                                                                    disabled={isBulkSubmitting}
                                                                    title="Remove row"
                                                                >
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}



                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Error detail tooltip hint */}
                                        <div className="p-3 border-top d-flex align-items-center gap-3">
                                            <button className="btn btn-sm btn-outline-success" onClick={handleAddManualRow} disabled={isBulkSubmitting}>
                                                <i className="fa fa-plus me-1"></i>Add Row Manually
                                            </button>
                                            {manualRows.length > 0 && (
                                                <small className="text-muted">{manualRows.length} manual row(s) added</small>
                                            )}
                                        </div>

                                        {errorCount > 0 && (
                                            <p className="text-muted small mt-2 mb-0">
                                                <i className="fa fa-info-circle me-1"></i>
                                                Red rows have errors. Click the <strong>edit</strong> button to fix them, or <strong>remove</strong> the row.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseBulkModal}
                                    disabled={isBulkSubmitting}
                                >
                                    Cancel
                                </button>

                                {bulkStep === 'preview' && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleBulkSubmit}
                                        disabled={isBulkSubmitting || allRows.length === 0 || errorCount > 0}
                                    >
                                        {isBulkSubmitting ? (
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

            {/* =====================================
                Edit Schedule Days Modal ===================================== */}
            {showEditDaysModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fa fa-calendar me-2 text-warning"></i>
                                    Edit Schedule Days
                                    <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: '0.75rem' }}>
                                        {selectedSectionIds.length} section(s) selected
                                    </span>
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditDaysModal(false)} disabled={isEditDaysSubmitting}></button>
                            </div>

                            <div className="modal-body">
                                <p className="text-muted small mb-3">
                                    <i className="fa fa-info-circle me-1"></i>
                                    Selected days will be applied to all <strong>{selectedSectionIds.length}</strong> selected section(s).
                                </p>

                                <label className="form-label fw-bold small">Select Days</label>

                                
                                <div className="d-flex flex-wrap gap-2 mt-1">
                                    {dayOptions.map(day => {
                                        const isSelected = editDays.includes(day);
                                        return (
                                            <div
                                                key={day}
                                                onClick={() => toggleEditDay(day)}
                                                className="d-flex align-items-center gap-2 px-3 py-2 rounded border"
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#fff5f5' : '#f8f9fa',
                                                    borderColor: isSelected ? '#dc3545' : '#dee2e6',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleEditDay(day)}
                                                    className="form-check-input mt-0"
                                                    style={{ accentColor: '#dc3545', cursor: 'pointer' }}
                                                />
                                                <span className={`small fw-semibold text-capitalize ${isSelected ? 'text-danger' : 'text-muted'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {!editDays.length && (
                                    <small className="text-danger d-block mt-2">
                                        <i className="fa fa-exclamation-circle me-1"></i>
                                        Select at least one day.
                                    </small>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditDaysModal(false)}
                                    disabled={isEditDaysSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleSubmitEditDays}
                                    disabled={isEditDaysSubmitting || !editDays.length}
                                >
                                    {isEditDaysSubmitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                    ) : (
                                        <><i className="fa fa-save me-2"></i>Apply to {selectedSectionIds.length} Section(s)</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999999999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
                                <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>{alertMessage}</p>
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

export default SubjectDetails;