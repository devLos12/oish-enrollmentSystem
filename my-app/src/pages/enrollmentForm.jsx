import React, { useContext, useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../context/global";
import imageCompression from 'browser-image-compression';


const ProgressStepper = ({ currentStep }) => {
    const steps = [
        { number: 1, label: 'Student\nInformation' },
        { number: 2, label: 'Address & Parents' },
        { number: 3, label: 'Documents &\nCertification' }
    ];

    return (
        <div className="container mb-5 mt-4">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-10">
                    <div className="position-relative">
                        {/* Steps */}
                        <div className="d-flex justify-content-between position-relative" style={{ zIndex: 2 }}>
                            {steps.map((step, index) => (
                                <div 
                                    key={step.number}
                                    className="d-flex flex-column align-items-center position-relative"
                                    style={{ flex: 1 }}
                                >
                                    {/* Progress Line AFTER this circle (connects to next circle) */}
                                    {index < steps.length - 1 && (
                                        <div 
                                            className="position-absolute"
                                            style={{
                                                height: '3px',
                                                width: 'calc(100% - 42px)',
                                                top: '20px',
                                                left: 'calc(50% + 21px)',
                                                backgroundColor: currentStep > step.number ? '#dc3545' : '#d6d6d6',
                                                transition: 'background-color 0.4s ease',
                                                zIndex: 0
                                            }}
                                        />
                                    )}

                                    {/* Circle with Number */}
                                    <div 
                                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold position-relative
                                            ${currentStep >= step.number ? 'bg-danger text-white' : 'bg-white border border-2 text-secondary'}`}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            fontSize: '1.1rem',
                                            transition: 'all 0.3s ease',
                                            borderColor: currentStep >= step.number ? '#dc3545' : '#6c757d',
                                            zIndex: 1
                                        }}
                                    >
                                        {step.number}
                                    </div>
                                    
                                    {/* Label */}
                                    <div 
                                        className={`mt-3 text-center small fw-semibold
                                            ${currentStep >= step.number ? 'text-danger' : 'text-secondary'}`}
                                        style={{ 
                                            maxWidth: '120px',
                                            lineHeight: '1.3',
                                            whiteSpace: 'pre-line'
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



export const Step1 = () => {
    const { formData, setFormData, role } = useContext(globalContext);   
    const navigate = useNavigate();
    const location = useLocation();
    const [viewOnly, setViewOnly] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');  
    const [showErrorModal, setShowErrorModal] = useState(false);  // ✅ Add this
    const [isLoading, setIsLoading] = useState(false);  // ✅ Add this

    const [lrnError, setLrnError] = useState('');
    const [psaError, setPsaError] = useState('');
    const [fourPsError, setFourPsError] = useState('');


    const [hasChanges, setHasChanges] = useState(false);

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [emailVerify, setEmailVerify] = useState([]);
    const [emailError, setEmailError] = useState('');



    



    useEffect(() => {
        if (!location?.state?.allowed) {
            navigate("/404_forbidden", { replace: true });
        }


          // ✅ ADD: Check if terms were already accepted
        const termsAccepted = sessionStorage.getItem("termsAccepted");
        if (!termsAccepted && role !== "admin" && role !== "staff") {
            setShowTermsModal(true); // Show modal on first visit
        } else {
            setHasAcceptedTerms(true);
        }


    }, [location, navigate]);



    if(!location?.state?.allowed) return

    
    useEffect(( )=> {
        console.log(emailVerify);
    },[emailVerify]);


    useEffect(() => {
        getAllEmailsForValidations();

    },[]);


    const getAllEmailsForValidations = async () => {
        
        try {
        
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllEmails`, {
                method: "GET",
                credentials: "include"
            })

            const data = await res.json();
            if(data.success){
                setEmailVerify(data.emails);
            }

        } catch (error) {
            
            console.log("Error: ", error.message);
            
        }
        
    }







    // ✅ ADD THESE FUNCTIONS (put them before the return statement)
    const handleAcceptTerms = () => {
        setHasAcceptedTerms(true);
        sessionStorage.setItem("termsAccepted", "true");
        setShowTermsModal(false);
    };

    const handleDeclineTerms = () => {
        setShowTermsModal(false);
        navigate("/", { replace: true });
    };




    useEffect(() => {
        if(role === "admin" || role === "staff") return
        const saved = sessionStorage.getItem("myForm");
        if (saved) {
            setFormData(JSON.parse(saved));
        }
    },[]);


    //this work for prefill in admin and staff.
    useEffect(() => {
        if (role !== "admin" && role !== "staff") return;

        const prefill = location?.state?.applicant;
        if (!prefill) return;

        setFormData(prev => ({
            ...prev,

            schoolYear: prefill.schoolYear || prev.schoolYear || '',
            gradeLevelToEnroll: prefill.gradeLevelToEnroll || prev.gradeLevelToEnroll || '',

            // convert boolean → "Yes"/"No"
            withLRN: prefill.withLRN ? "Yes" : "No",
            isReturning: prefill.isReturning ? "Yes" : "No",

            learnerInfo: {
                ...prev.learnerInfo,

                email: prefill.learnerInfo?.email || '',
                psaNo: prefill.learnerInfo?.psaNo || '',
                lrn: prefill.learnerInfo?.lrn || '',
                lastName: prefill.learnerInfo?.lastName || '',
                firstName: prefill.learnerInfo?.firstName || '',
                middleName: prefill.learnerInfo?.middleName || '',
                extensionName: prefill.learnerInfo?.extensionName || '',
                birthDate: new Date(prefill.learnerInfo.birthDate).toISOString().split("T")[0] || '',
                age: prefill.learnerInfo?.age || '',
                sex: prefill.learnerInfo?.sex || '',
                placeOfBirth: prefill.learnerInfo?.placeOfBirth || '',
                motherTongue: prefill.learnerInfo?.motherTongue || '',

                learnerWithDisability: {
                    ...prev.learnerInfo?.learnerWithDisability,
                    isDisabled: prefill.learnerInfo?.learnerWithDisability?.isDisabled ? "Yes" : "No",
                    disabilityType: prefill.learnerInfo?.learnerWithDisability?.disabilityType || []
                },

                indigenousCommunity: {
                    ...prev.learnerInfo?.indigenousCommunity,
                    isMember: prefill.learnerInfo?.indigenousCommunity?.isMember ? "Yes" : "No",
                    name: prefill.learnerInfo?.indigenousCommunity?.name || ''
                },

                fourPs: {
                    ...prev.learnerInfo?.fourPs,
                    isBeneficiary: prefill.learnerInfo?.fourPs?.isBeneficiary ? "Yes" : "No",
                    householdId: prefill.learnerInfo?.fourPs?.householdId || ''
                }
            }
        }));
        
        setViewOnly(true);
    }, [location?.state.applicant, role, setFormData]);

   

    const headerFields = [];


    const gradeLevelOptions = ['Grade 11', 'Grade 12'];

    const radioGroups = [
        // { label: '1. With LRN?', name: 'withLRN', options: ['Yes', 'No'] },
        { label: '2. Returning (Balik-Aral)', name: 'isReturning', options: ['Yes', 'No'] }
    ];

    const learnerFields = [
        { label: 'First Name', name: 'firstName', type: 'text', },
        { label: 'Middle Name', name: 'middleName', type: 'text', optional: true },
        { label: 'Last Name', name: 'lastName', type: 'text' },
        { label: 'Extension Name e.g. Jr., III (if applicable)', name: 'extensionName', type: 'text', note: '', optional: true },
        { label: 'Email Address', name: 'email', type: 'email' },
        { label: 'PSA Birth Certificate No. (if available upon registration)', name: 'psaNo', type: 'text', note: '', optional: true },
        { label: 'Learner Reference No.', name: 'lrn', type: 'text' },  // ✅ Added flag
    ];


    const indigenousPeopleOptions = [
        'Aeta',
        'Agta',
        'Ati',
        'Badjao',
        'Bagobo',
        'Banwaon',
        'Bontoc',
        'Bukidnon',
        'Dumagat',
        'Gaddang',
        'Higaonon',
        'Ibaloi',
        'Ifugao',
        'Igorot',
        'Ilongot',
        'Isneg',
        'Kalinga',
        'Kankanaey',
        'Lumad',
        'Maguindanao',
        'Mangyan',
        'Manobo',
        'Maranao',
        'Subanon',
        'Tagbanwa',
        'Tausug',
        'Teduray',
        'Tingguian',
        'T\'boli',
        'Yakan',
    ];

    const rightFields = [
        { label: 'Birthdate (Day/Month/Year)', name: 'birthDate', type: 'date', colClass: 'col-md-6' },

        { label: 'Place of Birth (Municipality/City)', name: 'placeOfBirth', type: 'text', colClass: 'col-md-6' },
        { label: 'Age', name: 'age', type: 'number', colClass: 'col-md-6 mt-2' },
        { label: 'Mother Tongue (e.g., Tagalog, Bisaya, Ilocano)', name: 'motherTongue', type: 'text', colClass: 'col-md-6 mt-2' }
    ];

    const conditionalSections = [
        {
            label: 'Belonging to any Indigenous Peoples (IP) Community/Indigenous Cultural Community?',
            path: 'indigenousCommunity',
            radioName: 'isMember',
            inputLabel: 'If Yes, pls specify:',
            inputName: 'name',
            inputPlaceholder: 'Enter'
        },
        {
            label: 'Is your family a beneficiary of 4Ps?',
            path: 'fourPs',
            radioName: 'isBeneficiary',
            inputLabel: 'If Yes, write the 4Ps Household ID Number below',
            inputName: 'householdId',
            inputPlaceholder: 'Enter'
        }
    ];

    const disabilityTypes = [
        {
            column: 1,
            items: [
                { 
                    id: 'visualImpairment', 
                    label: 'Visual Impairment',
                    subOptions: [
                        { id: 'blind', label: 'a. blind' },
                        { id: 'lowVision', label: 'b. low vision' }
                    ]
                },
                { id: 'multipleDisorder', label: 'Multiple Disorder', value: 'Multiple Disorder' }
            ]
        },
        {
            column: 2,
            items: [
                { id: 'hearingImpairment', label: 'Hearing Impairment', value: 'Hearing Impairment' },
                { id: 'autismSpectrum', label: 'Autism Spectrum Disorder', value: 'Autism Spectrum Disorder' },
                { id: 'speechLanguage', label: 'Speech/Language Disorder', value: 'Speech/Language Disorder' }
            ]
        },
        {
            column: 3,
            items: [
                { id: 'learningDisability', label: 'Learning Disability', value: 'Learning Disability' },
                { id: 'emotionalBehavioral', label: 'Emotional-Behavioral Disorder', value: 'Emotional-Behavioral Disorder' },
                { id: 'cerebralPalsy', label: 'Cerebral Palsy', value: 'Cerebral Palsy' }
            ]
        },
        {
            column: 4,
            items: [
                { id: 'intellectualDisability', label: 'Intellectual Disability', value: 'Intellectual Disability' },
                { id: 'orthopedicPhysical', label: 'Orthopedic/Physical Handicap', value: 'Orthopedic/Physical Handicap' },
                { 
                    id: 'specialHealth', 
                    label: 'Special Health Problem/Chronic Disease',
                    subOptions: [
                        { id: 'cancer', label: 'a. Cancer' }
                    ]
                }
            ]
        }
    ];

    const extensionNameOptions = [
        'Jr.',
        'Sr.',
        'II',
        'III',
        'IV',
        'V'
    ];



    // ✅ Helper function to remove numbers from text
    const removeNumbersAndSpecialChars = (value) => {
        // Allow: letters (a-z, A-Z), spaces, periods, hyphens, apostrophes only
        // Good for names like "De La Cruz", "O'Brien", "Santos Jr."
        return value.replace(/[^a-zA-Z\s\-']/g, '');
    };

    
    const handleChange = (e, path) => {
        const { name, value } = e.target;
        

        if (path) {


            // ✅ Special handling for learnerWithDisability
            if (path === 'learnerWithDisability' && name === 'isDisabled') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        learnerWithDisability: {
                            isDisabled: value,
                            disabilityType: value === 'No' ? [] : prev.learnerInfo?.learnerWithDisability?.disabilityType  // ✅ Clear array if "No"
                        }
                    }
                }));
                setHasChanges(true);
                return;  // ✅ Early return
            }

            // ✅ For Indigenous Community
            if (path === 'indigenousCommunity' && name === 'isMember') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        indigenousCommunity: {
                            isMember: value,
                            name: value === 'No' ? '' : prev.learnerInfo?.indigenousCommunity?.name  // ✅ Clear if "No"
                        }
                    }
                }));
                setHasChanges(true);
                return;
            }

            // ✅ For 4Ps
            if (path === 'fourPs' && name === 'isBeneficiary') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        fourPs: {
                            isBeneficiary: value,
                            householdId: value === 'No' ? '' : prev.learnerInfo?.fourPs?.householdId  // ✅ Clear if "No"
                        }
                    }
                }));
                setHasChanges(true);
                return;
            }

            // ✅ For 4Ps - Household ID input (numeric validation)
            if (path === 'fourPs' && name === 'householdId') {
                // Remove non-numeric characters
                const numericValue = value.replace(/\D/g, '');
                
                // Limit to 12 digits (or 9 if you want standard)
                const limitedValue = numericValue.slice(0, 12);
                
                // Update error message
                if (limitedValue.length > 0 && limitedValue.length < 12) {
                    setFourPsError('4Ps Household ID must be exactly 12 digits');
                } else {
                    setFourPsError('');
                }
                
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        fourPs: {
                            ...prev.learnerInfo.fourPs,
                            householdId: limitedValue
                        }
                    }
                }));
                setHasChanges(true);
                return;
            }


            // For nested objects like indigenousCommunity and fourPs
            setFormData(prev => ({
                ...prev,
                learnerInfo: {
                    ...prev.learnerInfo,
                    [path]: {
                        ...prev.learnerInfo[path],
                        [name]: value
                    }
                }
            }));



        } else if (name.startsWith('learnerInfo.')) {
            const fieldName = name.split('.')[1];


            if (fieldName === 'email') {
                const emailValue = value.toLowerCase().trim();

                const isDuplicate = emailVerify.some(
                    e => e.learnerInfo?.email.toLowerCase() === emailValue
                );

                if (isDuplicate) {
                    setEmailError('Email already exists');
                } else {
                    setEmailError('');
                }

                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        email: value
                    }
                }));

                return;
            }




            // ✅ PSA Certificate validation - add after LRN validation
            if (fieldName === 'psaNo') {
                // Remove non-numeric characters
                const numericValue = value.replace(/\D/g, '');
                
                // Limit to 12 digits
                const limitedValue = numericValue.slice(0, 12);
                
                // Update PSA error message (only if not empty since it's optional)
                if (limitedValue.length > 0 && limitedValue.length < 12) {
                    setPsaError('PSA Certificate No. must be exactly 12 digits');
                } else {
                    setPsaError('');
                }
                
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        psaNo: limitedValue  // ✅ Use limitedValue, not numericValue
                    }
                }));
                return;
            }


            // Sa loob ng handleChange function, sa part ng learnerInfo fields:
            if (fieldName === 'lrn') {
                // Remove non-numeric characters
                const numericValue = value.replace(/\D/g, '');
                
                // Limit to 12 digits  ✅ Changed from 13 to 12
                const limitedValue = numericValue.slice(0, 12);
                
                // Update LRN error message
                if (limitedValue.length > 0 && limitedValue.length < 12) {
                    setLrnError('LRN must be exactly 12 digits');  // ✅ Changed message
                } else {
                    setLrnError('');
                }
                
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        lrn: limitedValue
                    }
                }));
                return;
            }
            
            // ✅ Auto-calculate age if birthDate changes
            if (fieldName === 'birthDate' && value) {
                // Fix timezone issue by parsing date correctly
                const [year, month, day] = value.split('-').map(Number);
                

                // ✅ Block years outside 1990-2011 range
                if (year > 2012) {
                    return; // Don't update if year is outside valid range
                }
                
                const birthDate = new Date(year, month - 1, day); // month is 0-indexed
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                // Adjust age if birthday hasn't occurred this year yet
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        birthDate: value,
                        age: age >= 0 ? age.toString() : '0'
                    }
                }));
            }
            
            else {
                // ✅ Fields that should not contain numbers and special characters
                const textOnlyFields = ['lastName', 'firstName', 'middleName', 'placeOfBirth', 'motherTongue'];
                
                const finalValue = textOnlyFields.includes(fieldName) 
                    ? removeNumbersAndSpecialChars(value)  // ✅ NEW
                    : value;
                
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        [fieldName]: finalValue
                    }
                }));
            }
        } else {

            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setHasChanges(true);
    };



    const handleNext = async () => {
        setErrorMessage('');  
        setShowErrorModal(false);

        const isIncomplete = sessionStorage.getItem("step1Saved") === "true";
        const enrollmentId = sessionStorage.getItem("enrollmentId");



        // ✅ If already submitted, no need for loading - just navigate
        if(isIncomplete && !hasChanges){
            window.scrollTo({ top: 0, behavior: "auto"});
            navigate("/enrollment/step2", { state: { allowed: true }});
            return 
        }

        // ✅ If has changes, clear the saved indicator to force re-submit
        if (hasChanges) {
            sessionStorage.removeItem("step1Saved");
        }



        // ✅ Show loading only when making API call
        setIsLoading(true);


        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    step: "step1",
                    enrollmentId: enrollmentId,
                    gradeLevelToEnroll: formData.gradeLevelToEnroll,
                    isReturning: formData.isReturning,
                    learnerInfo: JSON.stringify(formData.learnerInfo)
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            sessionStorage.setItem("enrollmentId", data.enrollmentId); 
            sessionStorage.setItem("myForm", JSON.stringify(formData));
            sessionStorage.setItem("step1Saved", data.step1);

            

            window.scrollTo({ top: 0, behavior: "auto"});
            navigate("/enrollment/step2", { state: { allowed: true }});
        } catch (error) {
            setErrorMessage(error.message);  
            setShowErrorModal(true);
        } finally {
            // ✅ Hide loading after API call completes
            setIsLoading(false);
        }
    };




    const handleDisabilityCheckbox = (e) => {
        const { value, checked, id } = e.target;
        
        setFormData(prev => {
            let currentDisabilities = [...(prev.learnerInfo.learnerWithDisability.disabilityType || [])];
            
            // Handle parent categories with sub-options
            if (id === 'visualImpairment') {
                if (checked) {
                    // Add "Visual Impairment" if not exists
                    if (!currentDisabilities.some(d => d.startsWith('Visual Impairment'))) {
                        currentDisabilities.push('Visual Impairment');
                    }
                } else {
                    // Remove Visual Impairment and all its specifics
                    currentDisabilities = currentDisabilities.filter(d => !d.startsWith('Visual Impairment'));
                }
            }
            // Handle Visual Impairment specifics (blind, low vision)
            else if (id === 'blind' || id === 'lowVision') {
                const visualIndex = currentDisabilities.findIndex(d => d.startsWith('Visual Impairment'));
                const specific = id === 'blind' ? 'blind' : 'low vision';
                
                if (checked) {
                    if (visualIndex === -1) {
                        // Add Visual Impairment with specific
                        currentDisabilities.push(`Visual Impairment: ${specific}`);
                    } else {
                        const current = currentDisabilities[visualIndex];
                        if (current === 'Visual Impairment') {
                            // Replace with specific
                            currentDisabilities[visualIndex] = `Visual Impairment: ${specific}`;
                        } else {
                            // Add to existing specifics
                            const specifics = current.split(': ')[1].split(', ');
                            if (!specifics.includes(specific)) {
                                specifics.push(specific);
                                currentDisabilities[visualIndex] = `Visual Impairment: ${specifics.join(', ')}`;
                            }
                        }
                    }
                } else {
                    if (visualIndex !== -1) {
                        const current = currentDisabilities[visualIndex];
                        if (current.includes(':')) {
                            const specifics = current.split(': ')[1].split(', ').filter(s => s !== specific);
                            if (specifics.length > 0) {
                                currentDisabilities[visualIndex] = `Visual Impairment: ${specifics.join(', ')}`;
                            } else {
                                currentDisabilities[visualIndex] = 'Visual Impairment';
                            }
                        }
                    }
                }
            }
            // Handle Special Health with Cancer sub-option
            else if (id === 'specialHealth') {
                if (checked) {
                    if (!currentDisabilities.some(d => d.startsWith('Special Health Problem'))) {
                        currentDisabilities.push('Special Health Problem/Chronic Disease');
                    }
                } else {
                    currentDisabilities = currentDisabilities.filter(d => !d.startsWith('Special Health Problem'));
                }
            }
            else if (id === 'cancer') {
                const healthIndex = currentDisabilities.findIndex(d => d.startsWith('Special Health Problem'));
                
                if (checked) {
                    if (healthIndex === -1) {
                        currentDisabilities.push('Special Health Problem/Chronic Disease: Cancer');
                    } else {
                        const current = currentDisabilities[healthIndex];
                        if (current === 'Special Health Problem/Chronic Disease') {
                            currentDisabilities[healthIndex] = 'Special Health Problem/Chronic Disease: Cancer';
                        } else if (!current.includes('Cancer')) {
                            const specifics = current.split(': ')[1].split(', ');
                            specifics.push('Cancer');
                            currentDisabilities[healthIndex] = `Special Health Problem/Chronic Disease: ${specifics.join(', ')}`;
                        }
                    }
                } else {
                    if (healthIndex !== -1) {
                        const current = currentDisabilities[healthIndex];
                        if (current.includes(':')) {
                            const specifics = current.split(': ')[1].split(', ').filter(s => s !== 'Cancer');
                            if (specifics.length > 0) {
                                currentDisabilities[healthIndex] = `Special Health Problem/Chronic Disease: ${specifics.join(', ')}`;
                            } else {
                                currentDisabilities[healthIndex] = 'Special Health Problem/Chronic Disease';
                            }
                        }
                    }
                }
            }
            // Handle simple checkboxes (no sub-options)
            else {
                if (checked) {
                    currentDisabilities.push(value);
                } else {
                    currentDisabilities = currentDisabilities.filter(d => d !== value);
                }
            }
            
            return {
                ...prev,
                learnerInfo: {
                    ...prev.learnerInfo,
                    learnerWithDisability: {
                        ...prev.learnerInfo.learnerWithDisability,
                        disabilityType: currentDisabilities
                    }
                }
            };
        });
        setHasChanges(true);
    };



    const isDisabilityChecked = (id, specific = null) => {
        const disabilities = formData.learnerInfo?.learnerWithDisability?.disabilityType || [];
        
        if (specific) {
            // Check if specific is in the array
            return disabilities.some(d => d.includes(specific));
        } else {
            // Check if category exists
            if (id === 'visualImpairment') {
                return disabilities.some(d => d.startsWith('Visual Impairment'));
            } else if (id === 'specialHealth') {
                return disabilities.some(d => d.startsWith('Special Health Problem'));
            } else {
                return disabilities.includes(id);
            }
        }
    };




    // Reusable render functions
    const renderTextField = (field, isNested = false) => {
        
        // ✅ Special handling for PSA No. field (add after LRN check)
        if (field.name === 'psaNo') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label}
                        {field.note && <span className="text-muted ms-2">({field.note})</span>}
                        {field.optional && <span className="text-muted ms-2">(Optional)</span>}
                    </label>
                    <input
                        type="text"
                        name="learnerInfo.psaNo"
                        value={formData?.learnerInfo?.psaNo || ''}
                        onChange={handleChange}
                        className={`form-control ${psaError ? 'is-invalid' : ''}`}
                        disabled={viewOnly}
                        maxLength="12"  // ✅ Limit to 12 digits
                        placeholder="Enter 12-digit PSA Certificate No."  // ✅ Updated placeholder
                    />
                    {psaError && <div className="invalid-feedback d-block">{psaError}</div>}
                </div>
            );
        }


        // ✅ Special handling for LRN field
        if (field.name === 'lrn') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label}
                        {!field.optional && <span className="text-danger ms-1">*</span>}  
                        {field.note && <span className="text-muted ms-2">({field.note})</span>}
                    </label>
                    <input
                        type="text"
                        name="learnerInfo.lrn"
                        value={formData?.learnerInfo?.lrn || ''}
                        onChange={handleChange}
                        className={`form-control ${lrnError ? 'is-invalid' : ''}`}
                        disabled={viewOnly}
                        maxLength="12"  // ✅ Changed from 13 to 12
                        placeholder="Enter 12-digit LRN"  // ✅ Changed message
                    />
                    {lrnError && <div className="invalid-feedback d-block">{lrnError}</div>}
                </div>
            );
        }

        // ✅ Special handling for Extension Name (dropdown)
        if (field.name === 'extensionName') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label}
                        {field.optional && <span className="text-muted ms-2">(Optional)</span>}
                    </label>
                    <select
                        name="learnerInfo.extensionName"
                        value={formData?.learnerInfo?.extensionName || ''}
                        onChange={handleChange}
                        className="form-select"
                        disabled={viewOnly}
                    >
                        <option value="">Select Extension Name</option>
                        {extensionNameOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            );
        }


        return (
            <div key={field.name} className="mb-3">
                <label className="form-label small">
                    {field.label}
                    {!field.optional && <span className="text-danger ms-1">*</span>}  {/* ✅ ADD RED ASTERISK */}
                    {field.note && <span className="text-muted ms-2">({field.note})</span>}
                    {field.optional && <span className="text-muted ms-2">(Optional)</span>}
                </label>
                <input
                    type={field.type}
                    name={isNested ? `learnerInfo.${field.name}` : field.name}
                    placeholder={field.placeholder}
                    value={isNested ? (formData?.learnerInfo?.[field.name] || '') : (formData[field.name] || '')}
                    onChange={handleChange}
                    className={`form-control ${
                        field.name === 'email' && emailError ? 'is-invalid' : ''
                    }`}
                    disabled={viewOnly}
                />

                {field.name === 'email' && emailError && (
                    <div className="invalid-feedback d-block">
                        {emailError}
                    </div>
                )}

            </div>
        );
    };


    const renderRadioGroup = (group, path = null) => {
        const value = path 
            ? formData?.learnerInfo?.[path]?.[group.name]
            : formData?.[group.name];

        return (
            <div className="mb-3" key={group.name}>
                <label className="fw-semibold d-block mb-2 w-100">
                    {group.label}
                    {group.name === 'isReturning' && <span className="text-danger ms-1">*</span>} 
                </label>
                {group.options.map(option => (
                    <div className="form-check form-check-inline" key={option}>
                        <input 
                            className="form-check-input" 
                            type="radio" 
                            name={group.name}
                            value={option}
                            checked={value === option}
                            onChange={(e) => path ? handleChange(e, path) : handleChange(e)}
                            id={`${group.name}${option}`}
                            disabled={viewOnly}
                        />
                        <label className="form-check-label" htmlFor={`${group.name}${option}`}>
                            {option}
                        </label>    
                    </div>
                ))}
            </div>
        );
    };



    const renderConditionalSection = (section) => {
        const isMember = formData?.learnerInfo?.[section.path]?.[section.radioName];
        
        // ✅ Check if this is indigenous people section
        const isIndigenousSection = section.path === 'indigenousCommunity';
        const isFourPsSection = section.path === 'fourPs';


        return (
            <div className="mb-3" key={section.path}>
                <label className="form-label small">
                    {section.label}
                    <span className="text-danger ms-1">*</span>
                </label>
                <div className="mb-2">
                    {renderRadioGroup(
                        { name: section.radioName, options: ['Yes', 'No'], label: '' },
                        section.path
                    )}
                </div>
                <label className="form-label small">{section.inputLabel}</label>
                
                {/* ✅ Dropdown for Indigenous People, Text input for others */}
                {isIndigenousSection ? (
                    <select
                        name={section.inputName}
                        value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                        onChange={(e) => handleChange(e, section.path)}
                        className="form-select"
                        disabled={isMember !== 'Yes' || viewOnly}
                    >
                        <option value="">Select Indigenous Group</option>
                        {indigenousPeopleOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                ) : isFourPsSection ? (
                    // ✅ Special input for 4Ps with validation
                    <>
                        <input
                            type="text"
                            name={section.inputName}
                            placeholder="Enter 12-digit Household ID"
                            value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                            onChange={(e) => handleChange(e, section.path)}
                            className={`form-control ${fourPsError ? 'is-invalid' : ''}`}
                            disabled={isMember !== 'Yes' || viewOnly}
                            maxLength="12"
                        />
                        {fourPsError && <div className="invalid-feedback d-block">{fourPsError}</div>}
                    </>
                )   :   (
                    <input
                        type="text"
                        name={section.inputName}
                        placeholder={section.inputPlaceholder}
                        value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                        onChange={(e) => handleChange(e, section.path)}
                        className="form-control"
                        disabled={isMember !== 'Yes' || viewOnly}
                    />
                )}
            </div>
        );
    };



    const renderDisabilityCheckbox = (item) => {
        if (item.subOptions) {
            return (
                <div className="mb-2" key={item.id}>
                    <div className="form-check">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            value={item.value || item.label} 
                            id={item.id}
                            onChange={handleDisabilityCheckbox}
                            checked={isDisabilityChecked(item.id)}
                            disabled={viewOnly}
                        />
                        <label className="form-check-label" htmlFor={item.id}>{item.label}</label>
                    </div>
                    <div className="ms-4">
                        {item.subOptions.map(sub => (
                            <div className="form-check" key={sub.id}>
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    value={sub.value || sub.label} 
                                    id={sub.id}
                                    onChange={handleDisabilityCheckbox}
                                    checked={isDisabilityChecked(null, sub.label.includes('blind') ? 'blind' : sub.label.includes('low vision') ? 'low vision' : 'Cancer')}
                                    disabled={viewOnly}
                                />
                                <label className="form-check-label" htmlFor={sub.id}>{sub.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else {
            return (
                <div className="form-check mb-2" key={item.id}>
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        value={item.value} 
                        id={item.id}
                        onChange={handleDisabilityCheckbox}
                        checked={isDisabilityChecked(item.value)}
                        disabled={viewOnly}
                    />
                    <label className="form-check-label" htmlFor={item.id}>{item.label}</label>
                </div>
            );
        }
    };


    // ✅ Check if all required fields are filled
    const isFormValid = () => {

        
        // ✅ If already submitted (incomplete status exists), allow to proceed
        const statusRegistration = sessionStorage.getItem("statusRegistration");
        if (statusRegistration === "incomplete") {
            return true;
        }

     // Check top-level required fields
        if (!formData.gradeLevelToEnroll || !formData.isReturning) {
            return false;
        }

        // Check learnerInfo required fields
        const requiredLearnerFields = [
            'email', 'lastName', 'firstName', 'middleName', 
            'birthDate', 'age', 'sex', 'placeOfBirth', 'motherTongue'
        ];


        for (const field of requiredLearnerFields) {
            if (!formData?.learnerInfo?.[field] || formData.learnerInfo[field].trim() === '') {
                return false;
            }
        }

        

        return true;
    };

    // ✅ Error Modal Component
    const ErrorModal = () => {
        if (!showErrorModal) return null;

        return (
            <>
                {/* Backdrop */}
                <div 
                    className="modal-backdrop fade show" 
                    style={{ zIndex: 1040 }}
                    onClick={() => setShowErrorModal(false)}
                ></div>
                
                {/* Modal */}
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            {/* ✅ Icon at Top Center */}
                            <div className="modal-body text-center pt-5 pb-4">
                                <div className="mb-3">
                                    <i className="fa-solid fa-circle-xmark text-danger" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h5 className="fw-bold mb-3">Oops! Something went wrong</h5>
                                <p className="text-muted mb-0">{errorMessage}</p>
                            </div>
                            
                            {/* ✅ Footer with Close Button */}
                            <div className="modal-footer border-0 justify-content-center pb-4">
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-4" 
                                    onClick={() => setShowErrorModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };



    // ✅ Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    // ✅ Set max date to December 31, 2011
    const maxDate = '2012-12-31'; 


    return (
        <div className="container bg-light d-flex position-relative">

            <TermsAndConditionsModal 
                isOpen={showTermsModal}
                onClose={handleDeclineTerms}
                onAccept={handleAcceptTerms}
            />

            {hasAcceptedTerms || role === "admin" || role === "staff" ? (
                <div className={`row justify-content-center `}
            style={{marginTop: "120px"}}

            >
                <div className="col-12 col-md-12 col-lg-12 ">

                    {!location?.state?.forPrint && !viewOnly && (
                        <ProgressStepper currentStep={1} />
                    )}


                    <div className="p-0 p-md-4">
                    

                        {/* Main Form Grid */}
                        <div className="row justify-content-center">
                            {/* Left Column - Learner Information */}
                            <div className="col-12 col-md-8">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <h2 className="h5 fw-bold mb-4">STUDENT INFORMATION</h2>
                                        {learnerFields.map(field => renderTextField(field, true))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Additional Info */}
                            <div className="col-12 col-md-8">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <div className="row mb-3 ">
                                           {rightFields.map(field => (
                                                <div key={field.name} className={field.colClass}>
                                                    <label className="form-label small">
                                                        {field.label}
                                                        <span className="text-danger ms-1">*</span>  {/* ✅ ADD - all required */}
                                                    </label>
                                                    <input
                                                        type={field.type}
                                                        name={`learnerInfo.${field.name}`}
                                                        value={formData?.learnerInfo?.[field.name] || ''}
                                                        onChange={handleChange}
                                                        className="form-control"
                                                        disabled={viewOnly || field.name === 'age'}
                                                        style={field.name === 'age' ? { backgroundColor: '#e9ecef' } : {}}
                                                        min={field.type === 'date' ? '1990-01-01' : undefined}
                                                        max={field.type === 'date' ? maxDate : undefined}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sex */}
                                        <div className="mb-3">
                                            <label className="form-label small d-block">
                                                Sex
                                                <span className="text-danger ms-1">*</span>    
                                            </label>
                                            {['Male', 'Female'].map(sex => (
                                                <div className="form-check form-check-inline" key={sex}>
                                                    <input 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        name="learnerInfo.sex" 
                                                        value={sex}
                                                        checked={formData?.learnerInfo?.sex === sex}
                                                        onChange={handleChange}
                                                        id={`sex${sex}`}
                                                        disabled={viewOnly}
                                                    />
                                                    <label className="form-check-label" htmlFor={`sex${sex}`}>{sex}</label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Conditional Sections */}
                                        {conditionalSections.map(section => renderConditionalSection(section))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* School Year & Grade Level Section */}
                        <div className="row justify-content-center mt-2">
                            <div className="col-12 col-md-8 ">
                                
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        {headerFields.map(field => renderTextField(field, false))}
                                        
                                        {/* Grade Level Dropdown */}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Grade level to Enroll:
                                                <span className="text-danger ms-1">*</span>    
                                            </label>
                                            <select
                                                name="gradeLevelToEnroll"
                                                value={formData.gradeLevelToEnroll || ''}
                                                onChange={handleChange}
                                                className="form-select"
                                                disabled={viewOnly}
                                            >
                                                <option value="">Select Grade Level</option>
                                                {gradeLevelOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            
                            <div className="col-12 col-md-8 mt-2">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <p className="mb-3">Check the appropriate circle only</p>
                                        {radioGroups.map(group => renderRadioGroup(group))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Learner with Disability */}
                        <div className="row justify-content-center mt-2 
                        ">
                            <div className="col-12 col-md-8">
                                <div className="card h-100 border-0  p-3">
                                    <label className="form-label small fw-semibold">
                                        Is the child a Learner with Disability?
                                        <span className="text-danger ms-1">*</span> 
                                    </label>

                                    {renderRadioGroup(
                                        { name: 'isDisabled', options: ['Yes', 'No'], label: '' },
                                        'learnerWithDisability'
                                    )}
                                    
                                    {formData?.learnerInfo?.learnerWithDisability?.isDisabled === 'Yes' && (
                                        <>
                                            <label className="form-label small fw-semibold mb-3">
                                                If Yes, specify the type of disability:
                                            </label>
                                            
                                            <div className="row">
                                                {disabilityTypes.map(column => (
                                                    <div className="col-md-6" key={column.column}>
                                                        {column.items.map(item => renderDisabilityCheckbox(item))}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    {!location?.state?.forPrint && (
                        <div className="my-3 d-flex align-items-center justify-content-center py-3 gap-3">
                            <button 
                                className="btn btn-secondary text-white text-capitalize px-5"
                                onClick={() => {
                                    if(!role) {
                                        window.scrollTo({ top: 0, behavior: "auto"});
                                    } else {
                                        document.getElementById("scrollContainer").scrollTo({
                                            top: 0,
                                            behavior: "auto"
                                        });
                                    }
                                    navigate(-1, { replace: true });
                                }}
                            >
                                back
                            </button>
                            <button 
                                className="btn btn-primary text-white text-capitalize px-5"
                                onClick={handleNext}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'next'
                                )}
                            </button>
                        </div>
                    )}

                </div>
                </div>
            ):(
                <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh', marginTop: "120px"}}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Please accept the terms and conditions to continue...</p>
                    </div>
                </div>
            )}
            
            <ErrorModal />
        </div>
    );
};




// Constants moved outside component
const STRAND_OPTIONS = {
    Academic: [
        { value: 'STEM', label: 'STEM (Science, Technology, Engineering, Mathematics)' },
        { value: 'ABM', label: 'ABM (Accountancy, Business, Management)' },
        { value: 'HUMSS', label: 'HUMSS (Humanities and Social Sciences)' },
    ],
    TVL: [
        { value: 'Home Economics', label: 'Home Economics' },
        { value: 'ICT', label: 'Information and Communications Technology' },
        { value: 'Industrial Arts', label: 'Industrial Arts' },
    ],
};

const FORM_FIELDS = {
    parentInfo: [
        { label: 'Last Name', name: 'lastName', type: 'text' }, 
        { label: 'First Name', name: 'firstName', type: 'text' },
        { label: 'Middle Name', name: 'middleName', type: 'text', optional: true },
        { label: 'Contact Number', name: 'contactNumber', type: 'tel' }
    ],
    schoolHistory: [
        { label: 'Last Grade Level Completed', name: 'lastGradeLevelCompleted', type: 'text' },
        { label: 'Last School Year Completed', name: 'lastSchoolYearCompleted', type: 'text' },
        { label: 'Last School Attended', name: 'lastSchoolAttended', type: 'text' },
        { label: 'School ID', name: 'schoolId', type: 'text' }
    ]
};

const DEFAULT_FORM_STRUCTURE = {
    address: {
        current: {
            houseNo: '',
            street: '',
            region: '',
            province: '',
            municipality: '',
            barangay: '',
            country: 'Philippines',
            zipCode: '',
            contactNumber: ''
        },
        permanent: {
            sameAsCurrent: false,
            houseNo: '',
            street: '',
            region: '',
            province: '',
            municipality: '',
            barangay: '',
            country: 'Philippines',
            zipCode: ''
        }
    },
    parentGuardianInfo: {
        father: { lastName: '', firstName: '', middleName: '', contactNumber: '' },
        mother: { lastName: '', firstName: '', middleName: '', contactNumber: '' },
        guardian: { lastName: '', firstName: '', middleName: '', contactNumber: '' }
    },
    schoolHistory: {
        returningLearner: false,
        lastGradeLevelCompleted: '',
        lastSchoolYearCompleted: '',
        lastSchoolAttended: '',
        schoolId: ''
    },
    seniorHigh: {
        semester: '',
        track: '',
        strand: ''
    }
};

// ZIP Code mapping for major cities/municipalities
const ZIP_CODE_MAP = {


    // BATANGAS - Complete List
    'Agoncillo': '4211',
    'Alitagtag': '4205',
    'Balayan': '4213',
    'Balete': '4219',
    'City of Batangas': '4200',
    'Batangas City': '4200',
    'Bauan': '4201',
    'Calaca': '4212',
    'Calatagan': '4215',
    'Cuenca': '4222',
    'Ibaan': '4230',
    'Laurel': '4221',
    'Lemery': '4209',
    'Lian': '4216',
    'City of Lipa': '4217',
    'Lipa': '4217',
    'Lipa City': '4217',
    'Lobo': '4229',
    'Mabini': '4202',
    'Malvar': '4233',
    'Mataasnakahoy': '4223',
    'Mataas na Kahoy': '4223',
    'Nasugbu': '4231',
    'Padre Garcia': '4224',
    'Rosario': '4225',
    'San Jose': '4227',
    'San Juan': '4226',
    'San Luis': '4210',
    'San Nicolas': '4207',
    'San Pascual': '4204',
    'City of Tanauan': '4232',
    'Tanauan': '4232',
    'Tanauan City': '4232',
    'Talisay': '4220',
    'Taysan': '4228',
    'Tingloy': '4208',
    'Tuy': '4214',


    // Metro Manila
    'Manila': '1000',
    'Quezon City': '1100',
    'Makati': '1200',
    'Pasay': '1300',
    'Mandaluyong': '1550',
    'San Juan': '1500',
    'Pasig': '1600',
    'Marikina': '1800',
    'Taguig': '1630',
    'Parañaque': '1700',
    'Las Piñas': '1740',
    'Muntinlupa': '1770',
    'Caloocan': '1400',
    'Malabon': '1470',
    'Navotas': '1485',
    'Valenzuela': '1440',

    // CAVITE - Complete List
    'Cavite City': '4100',
    'City of Cavite': '4100',
    'Kawit': '4104',
    'Noveleta': '4105',
    'Rosario': '4106',
    'City of Bacoor': '4102',
    'Bacoor': '4102',
    'City of Imus': '4103',
    'Imus': '4103',
    'Tanza': '4108',
    'City of Trece Martires': '4109',
    'Trece Martires City': '4109',
    'Trece Martires': '4109',
    'Naic': '4110',
    'Ternate': '4111',
    'Maragondon': '4112',
    'Magallanes': '4113',
    'City of Dasmariñas': '4114',
    'Dasmariñas': '4114',
    'Carmona': '4116',
    'City of General Trias': '4107',
    'General Trias': '4107',
    'Gen. Trias': '4107',
    'General Mariano Alvarez': '4117',
    'Gen. Mariano Alvarez': '4117',
    'Silang': '4118',
    'Amadeo': '4119',
    'City of Tagaytay': '4120',
    'Tagaytay': '4120',
    'Mendez': '4121',
    'Mendez-Nuñez': '4121',
    'Indang': '4122',
    'Alfonso': '4123',
    
    // Laguna
    'City of Calamba': '4027',
    'Calamba': '4027',
    'City of Santa Rosa': '4026',
    'Santa Rosa': '4026',
    'City of Biñan': '4024',
    'Biñan': '4024',
    'City of San Pedro': '4023',
    'San Pedro': '4023',
    'Los Baños': '4030',
    'City of Cabuyao': '4025',
    'Cabuyao': '4025',
    
    // Bulacan
    'City of Malolos': '3000',
    'Malolos': '3000',
    'City of Meycauayan': '3020',
    'Meycauayan': '3020',
    'City of San Jose del Monte': '3023',
    'San Jose del Monte': '3023',
    
    // Rizal
    'City of Antipolo': '1870',
    'Antipolo': '1870',
    'Cainta': '1900',
    'Taytay': '1920',
    
    // Major Cities
    'Cebu City': '6000',
    'City of Cebu': '6000',
    'Davao City': '8000',
    'City of Davao': '8000',
    'Zamboanga City': '7000',
    'City of Zamboanga': '7000',
    'Cagayan de Oro': '9000',
    'City of Cagayan de Oro': '9000',
    'Bacolod': '6100',
    'City of Bacolod': '6100',
    'Iloilo City': '5000',
    'City of Iloilo': '5000',
    'Baguio': '2600',
    'City of Baguio': '2600',
};


// Helper function to get ZIP code from map
const getZipCode = (municipalityName) => {
    if (!municipalityName) return '';
    
    // Try exact match
    let zipCode = ZIP_CODE_MAP[municipalityName];
    
    // Try without "City of" prefix
    if (!zipCode && municipalityName.startsWith('City of ')) {
        zipCode = ZIP_CODE_MAP[municipalityName.replace('City of ', '')];
    }
    
    // Try with "City of" prefix
    if (!zipCode && !municipalityName.startsWith('City of ')) {
        zipCode = ZIP_CODE_MAP['City of ' + municipalityName];
    }
    
    return zipCode || '';
};


// Utility function to merge saved data with defaults
const mergeWithDefaults = (savedData) => {
    return {
        ...savedData,
        address: {
            current: { ...DEFAULT_FORM_STRUCTURE.address.current, ...(savedData.address?.current || {}) },
            permanent: { ...DEFAULT_FORM_STRUCTURE.address.permanent, ...(savedData.address?.permanent || {}) }
        },
        parentGuardianInfo: {
            father: { ...DEFAULT_FORM_STRUCTURE.parentGuardianInfo.father, ...(savedData.parentGuardianInfo?.father || {}) },
            mother: { ...DEFAULT_FORM_STRUCTURE.parentGuardianInfo.mother, ...(savedData.parentGuardianInfo?.mother || {}) },
            guardian: { ...DEFAULT_FORM_STRUCTURE.parentGuardianInfo.guardian, ...(savedData.parentGuardianInfo?.guardian || {}) }
        },
        schoolHistory: { ...DEFAULT_FORM_STRUCTURE.schoolHistory, ...(savedData.schoolHistory || {}) },
        seniorHigh: { ...DEFAULT_FORM_STRUCTURE.seniorHigh, ...(savedData.seniorHigh || {}) }
    };
};

// Address Dropdowns Component with API
const AddressDropdowns = ({ addressType, values, onChange, disabled }) => {
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [municipalities, setMunicipalities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [selectedCodes, setSelectedCodes] = useState({
        regionCode: '',
        provinceCode: '',
        municipalityCode: '',
        barangayCode: ''
    });
    const [loading, setLoading] = useState({
        regions: false,
        provinces: false,
        municipalities: false,
        barangays: false
    });

    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch regions on mount
    useEffect(() => {
        const fetchRegions = async () => {
            setLoading(prev => ({ ...prev, regions: true }));
            try {
                const response = await fetch('https://psgc.gitlab.io/api/regions/');
                const data = await response.json();
                
                // Sort by region code para maayos ang order
                const sorted = data.sort((a, b) => a.code.localeCompare(b.code));
                setRegions(sorted);
                
            } catch (error) {
                console.error('Error fetching regions:', error);
            } finally {
                setLoading(prev => ({ ...prev, regions: false }));
            }
        };
        fetchRegions();
    }, []);








    // Sync selectedCodes with values when component loads or values change externally
    // useEffect(() => {
    //     if (values.region && regions.length > 0) {
    //         const region = regions.find(r => r.name === values.region || r.regionName === values.region);
    //         if (region) setSelectedCodes(prev => ({ ...prev, regionCode: region.code }));
    //     }
    // }, [values.region, regions]);


    // Comprehensive sync effect - syncs ALL dropdown values when data changes
    useEffect(() => {
        if (!regions.length) return;

        const syncAllCodes = async () => {
            try {
                let newCodes = { regionCode: '', provinceCode: '', municipalityCode: '', barangayCode: '' };

                // 1. Sync Region
                if (values.region) {
                    const region = regions.find(r => {
                        const displayName = r.regionName 
                            ? `${r.regionName} (${r.name})`
                            : r.name;
                        return displayName === values.region;
                    });
                    
                    if (region) {
                        newCodes.regionCode = region.code;

                        // 2. Fetch and sync Province
                        if (values.province && newCodes.regionCode) {
                            
                            if (newCodes.regionCode === '130000000') {
                                // NCR - walang province, direkta sa cities/municipalities
                                newCodes.provinceCode = 'NCR';
                                
                                const cityRes = await fetch(`https://psgc.gitlab.io/api/regions/${newCodes.regionCode}/cities-municipalities/`);
                                const cities = await cityRes.json();
                                
                                // ✅ Sort alphabetically
                                const sorted = cities.sort((a, b) => a.name.localeCompare(b.name));
                                setMunicipalities(sorted);
                                setProvinces([{ code: 'NCR', name: 'Metro Manila (NCR)' }]);
                            }
                            
                            else {
                                // Regular provinces
                                const provRes = await fetch(`https://psgc.gitlab.io/api/regions/${newCodes.regionCode}/provinces/`);
                                const provs = await provRes.json();
                                setProvinces(provs);
                                
                                const province = provs.find(p => p.name === values.province);
                                if (province) {
                                    newCodes.provinceCode = province.code;
                                }
                            }

                            // 3. Fetch and sync Municipality
                            if (values.municipality && newCodes.provinceCode) {
                                let munis = [];
                                if (newCodes.regionCode === '130000000') {
                                    // Already fetched for NCR
                                    munis = municipalities.length ? municipalities : await (await fetch(`https://psgc.gitlab.io/api/regions/${newCodes.regionCode}/cities-municipalities/`)).json();
                                } else {
                                    const muniRes = await fetch(`https://psgc.gitlab.io/api/provinces/${newCodes.provinceCode}/cities-municipalities/`);
                                    munis = await muniRes.json();
                                }
                                setMunicipalities(munis);
                                
                                

                                const muni = munis.find(m => m.name === values.municipality);
                                if (muni) {
                                    newCodes.municipalityCode = muni.code;


                                    // Auto-fetch ZIP code based on municipality
                                    const zipCode = getZipCode(values.municipality);

                                    // Update ZIP code if found
                                    if (zipCode) {
                                        onChange({ target: { name: 'zipCode', value: zipCode } }, addressType);
                                    }



                                    // 4. Fetch and sync Barangay
                                    if (values.barangay && newCodes.municipalityCode) {
                                        const brgyRes = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${newCodes.municipalityCode}/barangays/`);
                                        const brgys = await brgyRes.json();
                                        setBarangays(brgys);
                                        
                                        const brgy = brgys.find(b => b.name === values.barangay);
                                        if (brgy) {
                                            newCodes.barangayCode = brgy.code;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                setSelectedCodes(newCodes);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error syncing address codes:', error);
                setIsInitialized(true);
            }
        };

        syncAllCodes();
    }, [values.region, values.province, values.municipality, values.barangay, regions]);




    // Fetch provinces when region changes
    useEffect(() => {
        if (!selectedCodes.regionCode || !isInitialized) {
            if (!selectedCodes.regionCode) {
                setProvinces([]);
                setMunicipalities([]);
                setBarangays([]);
            }
            return;
        }


        // ✅ NCR - skip fetching provinces, fetch cities na agad
        if (selectedCodes.regionCode === '130000000') {
            setProvinces([{ code: 'NCR', name: 'Metro Manila (NCR)' }]);
            setSelectedCodes(prev => ({ ...prev, provinceCode: 'NCR' }));
            return;
        }
        

        const fetchProvinces = async () => {
            setLoading(prev => ({ ...prev, provinces: true }));
            try {
                const response = await fetch(`https://psgc.gitlab.io/api/regions/${selectedCodes.regionCode}/provinces/`);
                const data = await response.json();
                
                // Sort alphabetically
                const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
                setProvinces(sorted);
                
            } catch (error) {
                console.error('Error fetching provinces:', error);
            } finally {
                setLoading(prev => ({ ...prev, provinces: false }));
            }
        };


        fetchProvinces();
    }, [selectedCodes.regionCode, isInitialized]);






    // Fetch municipalities when province changes (skip if initializing from sync)
    useEffect(() => {
        if (!selectedCodes.provinceCode || selectedCodes.provinceCode === 'NCR' || !isInitialized) {
            if (selectedCodes.provinceCode !== 'NCR' && !selectedCodes.provinceCode) {
                setMunicipalities([]);
                setBarangays([]);
            }
            return;
        }

        const fetchMunicipalities = async () => {
            setLoading(prev => ({ ...prev, municipalities: true }));
            try {
                const response = await fetch(`https://psgc.gitlab.io/api/provinces/${selectedCodes.provinceCode}/cities-municipalities/`);
                const data = await response.json();
                setMunicipalities(data);
            } catch (error) {
                console.error('Error fetching municipalities:', error);
            } finally {
                setLoading(prev => ({ ...prev, municipalities: false }));
            }
        };
        fetchMunicipalities();
    }, [selectedCodes.provinceCode, isInitialized]);





   // Fetch barangays when municipality changes (skip if initializing from sync)
    useEffect(() => {
        if (!selectedCodes.municipalityCode || !isInitialized) {
            if (!selectedCodes.municipalityCode) {
                setBarangays([]);
            }
            return;
        }

        const fetchBarangays = async () => {
            setLoading(prev => ({ ...prev, barangays: true }));
            try {
                const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCodes.municipalityCode}/barangays/`);
                const data = await response.json();
                setBarangays(data);
            } catch (error) {
                console.error('Error fetching barangays:', error);
            } finally {
                setLoading(prev => ({ ...prev, barangays: false }));
            }
        };
        fetchBarangays();
    }, [selectedCodes.municipalityCode, isInitialized]);





    // Sa handleRegionChange, i-save yung name at code
    const handleRegionChange = (e) => {
        const selectedRegion = regions.find(r => r.code === e.target.value);
        setSelectedCodes(prev => ({ ...prev, regionCode: e.target.value, provinceCode: '', municipalityCode: '', barangayCode: '' }));
        
        // ✅ I-save yung name (readable) sa formData, yung code sa selectedCodes lang
        const regionDisplayName = selectedRegion?.regionName 
            ? `${selectedRegion.regionName} (${selectedRegion.name})`
            : selectedRegion?.name || '';

        onChange({ target: { name: 'region', value: regionDisplayName } }, addressType);
        
        // Reset dependent fields
        onChange({ target: { name: 'province', value: '' } }, addressType);
        onChange({ target: { name: 'municipality', value: '' } }, addressType);
        onChange({ target: { name: 'barangay', value: '' } }, addressType);
        onChange({ target: { name: 'zipCode', value: '' } }, addressType);
    };




    const handleProvinceChange = (e) => {
        const selectedProvince = provinces.find(p => p.code === e.target.value);
        setSelectedCodes(prev => ({ ...prev, provinceCode: e.target.value, municipalityCode: '', barangayCode: '' }));
        onChange({ target: { name: 'province', value: selectedProvince?.name || '' } }, addressType);
        // Reset dependent fields
        onChange({ target: { name: 'municipality', value: '' } }, addressType);
        onChange({ target: { name: 'barangay', value: '' } }, addressType);
        onChange({ target: { name: 'zipCode', value: '' } }, addressType);
    };

    const handleMunicipalityChange = async (e) => {
        const selectedMunicipality = municipalities.find(m => m.code === e.target.value);
        const municipalityName = selectedMunicipality?.name || '';
        
        
        setSelectedCodes(prev => ({ ...prev, municipalityCode: e.target.value, barangayCode: '' }));
        
        // Reset barangay first
        onChange({ target: { name: 'barangay', value: '' } }, addressType);
        
        // Auto-fill ZIP code
        let zipCode = '';
        
        // First, try to get from API
        try {
            const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${e.target.value}`);
            if (response.ok) {
                const data = await response.json();
                console.log('API data:', data);
                if (data?.zipCode) {
                    zipCode = data.zipCode;
                }
            }
        } catch (error) {
            console.error('Error fetching ZIP code from API:', error);
        }
        
        // If API didn't provide zipCode, use our fallback map
        if (!zipCode && municipalityName) {
            // Try exact match first
            zipCode = ZIP_CODE_MAP[municipalityName];
            
            // Try normalized version (remove special chars, extra spaces)
            if (!zipCode) {
                const normalizedName = municipalityName.trim();
                zipCode = ZIP_CODE_MAP[normalizedName];
            }
            
            // Try without "City of" prefix
            if (!zipCode && municipalityName.startsWith('City of ')) {
                const withoutPrefix = municipalityName.replace('City of ', '');
                zipCode = ZIP_CODE_MAP[withoutPrefix];
            }
            
            // Try with "City of" prefix if not present
            if (!zipCode && !municipalityName.startsWith('City of ')) {
                const withPrefix = 'City of ' + municipalityName;
                zipCode = ZIP_CODE_MAP[withPrefix];
            }
        }
        
        // Update municipality and ZIP code together using setTimeout to ensure proper state update
        setTimeout(() => {
            onChange({ target: { name: 'municipality', value: municipalityName } }, addressType);
            onChange({ target: { name: 'zipCode', value: zipCode || '' } }, addressType);
        }, 0);
    };

    const handleBarangayChange = (e) => {
        const selectedBarangay = barangays.find(b => b.code === e.target.value);
        setSelectedCodes(prev => ({ ...prev, barangayCode: e.target.value }));
        onChange({ target: { name: 'barangay', value: selectedBarangay?.name || '' } }, addressType);
    };

    return (
        <>
            <div className="mb-3" >
                <label className="form-label small">
                    Region
                    <span className="text-danger ms-1">*</span>    
                </label>
                <select
                    name="region"
                    value={selectedCodes.regionCode}
                    onChange={handleRegionChange}
                    className="form-select"
                    disabled={disabled || loading.regions}
                >
                    <option value="">{loading.regions ? 'Loading regions...' : 'Select Region'}</option>
                    {regions.map(region => (
                        <option key={region.code} value={region.code}>
                            {region.regionName 
                                ? `${region.regionName} (${region.name})` 
                                : region.name
                            }
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small">
                    Province
                    <span className="text-danger ms-1">*</span>    
                </label>
                <select
                    name="province"
                    value={selectedCodes.provinceCode}
                    onChange={handleProvinceChange}
                    className="form-select"
                    disabled={disabled || !selectedCodes.regionCode || loading.provinces}
                >
                    <option value="">
                        {loading.provinces ? 'Loading provinces...' : 
                         !selectedCodes.regionCode ? 'Select Region First' : 'Select Province'}
                    </option>
                    {provinces.map(province => (
                        <option key={province.code} value={province.code}>{province.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small">
                    Municipality/City
                    <span className="text-danger ms-1">*</span>
                </label>
                <select
                    name="municipality"
                    value={selectedCodes.municipalityCode}
                    onChange={handleMunicipalityChange}
                    className="form-select"
                    disabled={disabled || (!selectedCodes.provinceCode && selectedCodes.regionCode !== '130000000') || loading.municipalities}
                >
                    <option value="">
                        {loading.municipalities ? 'Loading municipalities...' : 
                         (!selectedCodes.provinceCode && selectedCodes.regionCode !== '130000000') ? 'Select Province First' : 'Select Municipality/City'}
                    </option>
                    {municipalities.map(municipality => (
                        <option key={municipality.code} value={municipality.code}>{municipality.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small">
                    Barangay
                    <span className="text-danger ms-1">*</span>
                </label>
                <select
                    name="barangay"
                    value={selectedCodes.barangayCode}
                    onChange={handleBarangayChange}
                    className="form-select"
                    disabled={disabled || !selectedCodes.municipalityCode || loading.barangays}
                >
                    <option value="">
                        {loading.barangays ? 'Loading barangays...' : 
                         !selectedCodes.municipalityCode ? 'Select Municipality First' : 'Select Barangay'}
                    </option>
                    {barangays.map(barangay => (
                        <option key={barangay.code} value={barangay.code}>{barangay.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small">
                    Country
                    <span className="text-danger ms-1">*</span>
                </label>
                <input
                    type="text"
                    name="country"
                    value="Philippines"
                    className="form-control"
                    disabled
                    readOnly
                />
            </div>
        </>
    );
};


const FormField = ({ label, name, type, value, onChange, disabled, required = false }) => {
    
    
    // ✅ Special handling for Zip Code (numbers only)
    if (name === 'zipCode') {
        return (
            <div className="mb-3">
                <label className="form-label small">
                    {label}
                    {required && <span className="text-danger ms-1">*</span>}

                </label>
                
                <input
                    type="text"
                    name={name}
                    className="form-control"
                    value={value || ''}
                    onChange={onChange}
                    disabled={disabled}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="4"
                />
                <small className="text-muted">Numbers only (4 digits)</small>
            </div>
        );
    }
    
    
    // ✅ Special handling for Contact Number
    if (name === 'contactNumber') {
        return (
            <div className="mb-3">
                <label className="form-label small">
                    {label}
                    {required && <span className="text-danger ms-1">*</span>}

                </label>
                <input
                    type="text"
                    name={name}
                    className="form-control"
                    value={value || ''}
                    onChange={onChange}
                    disabled={disabled}
                    maxLength="13"
                />
                <small className="text-muted">Format: 0XXX XXX XXXX (11 digits)</small>
            </div>
        );
    }

   // ✅ NEW: Special handling for House Number (alphanumeric)
    if (name === 'houseNo') {
        return (
            <div className="mb-3">
                <label className="form-label small">
                    {label}
                    {required && <span className="text-danger ms-1">*</span>}

                </label>
                <input
                    type="text"
                    name={name}
                    className="form-control"
                    value={value || ''}
                    onChange={onChange}
                    disabled={disabled}
                    maxLength="50"
                    placeholder="e.g., 123, Block 5 Lot 10, 45-A"
                />
                <small className="text-muted">Can include block/lot number (alphanumeric)</small>
            </div>
        );
    }

    // ✅ Regular fields
    return (
        <div className="mb-3">
            
            <label className="form-label small">
                {label}
                {required && <span className="text-danger ms-1">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className="form-control"
                disabled={disabled}
            />
        </div>
    );
};





// Reusable Section Component
const FormSection = ({ title, fields, values, onChange, disabled, parentType }) => (
    <div className="mb-4">
        {title && <h3 className="h6 fw-semibold mb-3">{title}</h3>}

        <div className="row justify-content-center">


            {fields.map(field => {
                // ✅ Special handling for Contact Number
                if (field.name === 'contactNumber') {
                    return (
                        <div key={field.name} className="col-12 mb-3 ">
                            <label className="form-label small">
                                {field.label}
                                </label>
                            <input
                                type="text"
                                name={field.name}
                                className="form-control"
                                value={values?.[field.name] || ''}
                                onChange={(e) => onChange(e, parentType)}
                                disabled={disabled}
                                maxLength="13"
                            />
                            <small className="text-muted">Format: 0XXX XXX XXXX (11 digits)</small>
                        </div>
                    );
                }

                // ✅ Regular fields
                return (
                    <div key={field.name} className="col-12 mb-3">
                        <label className="form-label small">
                            {field.label}
                            {field.required && <span className="text-danger ms-1">*</span>}
                            {field.optional && <span className="text-muted ms-2">(Optional)</span>}  {/* ✅ ADD THIS */}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={values?.[field.name] || ''}
                            onChange={(e) => onChange(e, parentType)}
                            className="form-control"
                            disabled={disabled}
                        />
                    </div>
                );
            })}
        </div>
    </div>
);





export const Step2 = () => {
    const { formData, setFormData, role } = useContext(globalContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [allFilled, setAllFilled] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const hasLoadedData = useRef(false);
    const hasAutoFilled = useRef(false);


    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false); 



    // Access control check
    useEffect(() => {
        if (!location?.state?.allowed) {
            navigate("/404_forbidden", { replace: true });
        }
    }, [location, navigate]);

    if (!location?.state?.allowed) return null;

    // Load from sessionStorage (runs once)
    useEffect(() => {
        if (hasLoadedData.current) return;
        const saved = sessionStorage.getItem("myForm");
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...mergeWithDefaults(parsedData) }));
                hasLoadedData.current = true;
            } catch (error) {
                console.error("Error loading form data from sessionStorage:", error);
            }
        }
    }, [setFormData]);



    // Prefill for admin/staff view
    useEffect(() => {
        if (role !== "admin" && role !== "staff") return;
        if (viewOnly) return;

        const prefill = location?.state?.applicant;
        if (!prefill) return;

        setFormData(prev => ({
            ...prev,
            schoolYear: prefill?.schoolYear ?? '',
            gradeLevelToEnroll: prefill?.gradeLevelToEnroll ?? '',
            isReturning: prefill?.isReturning ? "Yes" : "No",
            studentType: prefill?.studentType ?? "regular",
            learnerInfo: { ...prev.learnerInfo, ...prefill?.learnerInfo },
            address: {
                current: { ...prev.address?.current, ...(prefill?.address?.current || {}) },
                permanent: { ...prev.address?.permanent, ...(prefill?.address?.permanent || {}) }
            },
            parentGuardianInfo: {
                father: { ...prev.parentGuardianInfo?.father, ...(prefill?.parentGuardianInfo?.father || {}) },
                mother: { ...prev.parentGuardianInfo?.mother, ...(prefill?.parentGuardianInfo?.mother || {}) },
                guardian: { ...prev.parentGuardianInfo?.guardian, ...(prefill?.parentGuardianInfo?.guardian || {}) }
            },
            schoolHistory: { ...prev.schoolHistory, ...(prefill?.schoolHistory || {}) },
            seniorHigh: { ...prev.seniorHigh, ...(prefill?.seniorHigh || {}) }
        }));

        setViewOnly(true);
    }, [location?.state?.applicant, role, setFormData, viewOnly]);

    // Auto-fill permanent address
    useEffect(() => {
        if (!formData.address?.permanent?.sameAsCurrent || !formData.address?.current || hasAutoFilled.current) {
            if (!formData.address?.permanent?.sameAsCurrent) {
                hasAutoFilled.current = false;
            }
            return;
        }

        hasAutoFilled.current = true;
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                permanent: {
                    ...prev.address.permanent,
                    sameAsCurrent: true,
                    houseNo: prev.address.current.houseNo || '',
                    street: prev.address.current.street || '',
                    region: prev.address.current.region || '',
                    province: prev.address.current.province || '',
                    municipality: prev.address.current.municipality || '',
                    barangay: prev.address.current.barangay || '',
                    country: prev.address.current.country || 'Philippines',
                    zipCode: prev.address.current.zipCode || ''
                }
            }
        }));
    }, [formData.address?.permanent?.sameAsCurrent, setFormData]);




    // Validation logic
    const checkExtraSections = useCallback(() => {
        const { address, parentGuardianInfo, schoolHistory, seniorHigh } = formData;

        if (!address || !parentGuardianInfo || !seniorHigh) return false;

        // Check current address
        const cur = address.current;
        const requiredCurrentFields = ['houseNo', 'street', 'barangay', 'municipality', 'province', 'country', 'zipCode', 'contactNumber'];
        if (requiredCurrentFields.some(field => !cur?.[field])) return false;

        // Check permanent address
        const perm = address.permanent;
        if (!perm.sameAsCurrent) {
            const requiredPermFields = ['houseNo', 'street', 'barangay', 'municipality', 'province', 'country', 'zipCode'];
            if (requiredPermFields.some(field => !perm?.[field])) return false;
        }


        // Guardian is REQUIRED
        const { guardian } = parentGuardianInfo;
        const requiredGuardianFields = ['lastName', 'firstName'];
        if (requiredGuardianFields.some(field => !guardian?.[field])) return false;

        // ✅ Check school history ONLY if isReturning is "Yes"
        if (formData.isReturning === 'Yes' && schoolHistory?.returningLearner) {
            if (!formData.studentType || (formData.studentType !== 'transferee' && formData.studentType !== 'returnee')) {
                return false;
            }
            const requiredSchoolFields = ['lastGradeLevelCompleted', 'lastSchoolYearCompleted', 'lastSchoolAttended', 'schoolId'];
            if (requiredSchoolFields.some(field => !schoolHistory?.[field])) return false;
        }

        // Check senior high
        if (!seniorHigh?.semester || !seniorHigh?.track?.trim() || !seniorHigh?.strand?.trim()) return false;

        return true;
    }, [formData]);




    useLayoutEffect(() => {
        setAllFilled(checkExtraSections());
    }, [checkExtraSections]);





    const handleAddressChange = useCallback((e, addressType) => {
        const { name, value, checked } = e.target;

        if (name === 'sameAsCurrent') {
            hasAutoFilled.current = false;
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    permanent: { ...prev.address.permanent, sameAsCurrent: checked }
                }
            }));
        } 
        else if (name === 'contactNumber') {
            // ✅ Contact Number formatting (existing code)
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
            
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressType]: { 
                        ...prev.address[addressType], 
                        [name]: formatted 
                    }
                }
            }));
        }
        // ✅ NEW: House Number - Alphanumeric (letters, numbers, spaces, hyphens)
        else if (name === 'houseNo') {
            // Allow alphanumeric, spaces, and hyphens only
            const cleaned = value.replace(/[^a-zA-Z0-9\s\-]/g, '');
            // Limit to 50 characters
            const limited = cleaned.substring(0, 50);
            
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressType]: { 
                        ...prev.address[addressType], 
                        [name]: limited 
                    }
                }
            }));
        }

        else if (name === 'zipCode') {
                // Remove all non-digit characters and limit to 4 digits
                const cleaned = value.replace(/\D/g, '').substring(0, 4);
                
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        [addressType]: { 
                            ...prev.address[addressType], 
                            [name]: cleaned 
                        }
                    }
                }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressType]: { ...prev.address[addressType], [name]: value }
                }
            }));
        }

        setHasChanges(true);
    }, [setFormData]);





    const handleParentGuardianChange = useCallback((e, parentType) => {
        const { name, value } = e.target;
        
        // ✅ Same formatting logic for parent/guardian contact numbers
        if (name === 'contactNumber') {
            let cleaned = value.replace(/\D/g, '');
        
            // ✅ Limit to 11 digits
            cleaned = cleaned.substring(0, 11);
            
            // ✅ Format as 0XXX XXX XXXX
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
            
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    [parentType]: { 
                        ...prev.parentGuardianInfo[parentType], 
                        [name]: formatted 
                    }
                }
            }));
        } else {
            // ✅ Fields that should not contain numbers
            const textOnlyFields = ['lastName', 'firstName', 'middleName'];
            
            const finalValue = textOnlyFields.includes(name) 
                ? removeNumbersAndSpecialChars(value)
                : value;
            
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    [parentType]: { ...prev.parentGuardianInfo[parentType], [name]: finalValue }
                }
            }));
        }


        setHasChanges(true);
    }, [setFormData]);













    const handleSchoolHistoryChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            schoolHistory: {
                ...prev.schoolHistory,
                [name]: type === 'checkbox' ? checked : value
            }
        }));
        setHasChanges(true);
    }, [setFormData]);









    const handleAcademicStatusChange = useCallback((status) => {
        setFormData(prev => ({
            ...prev,
            studentType: prev.studentType === status ? '' : status
        }));
        setHasChanges(true);
    }, [setFormData]);







    const handleSeniorHighChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            seniorHigh: {
                ...prev.seniorHigh,
                [name]: value,
                ...(name === 'track' && { strand: '' })
            }
        }));
        setHasChanges(true);
    }, [setFormData]);





    const handleNext = useCallback(async () => {
        setErrorMessage('');
        setShowErrorModal(false);
        


        // // ✅ For admin/staff, no API call needed
        // if (role === "admin" || role === "staff") {
        //     const scrollContainer = document.getElementById("scrollContainer");
        //     scrollContainer?.scrollTo({ top: 0, behavior: "auto" });
        //     navigate(`/${role}/applicant_form/step3`, { 
        //         state: { allowed: true, applicant: location?.state.applicant } 
        //     });
        //     return;
        // }




        // ✅ Check if already saved
        const enrollmentId = sessionStorage.getItem("enrollmentId");
        const step2Saved = sessionStorage.getItem("step2Saved");




        // ✅ If already submitted and NO changes, just navigate
        if (step2Saved === "true" && !hasChanges) {
            window.scrollTo({ top: 0, behavior: "auto" });
            navigate("/enrollment/step3", { state: { allowed: true } });
            return;
        }

         // ✅ If has changes, clear the saved indicator to force re-submit
        if (hasChanges) {
            sessionStorage.removeItem("step2Saved");
        }



        // ✅ Show loading
        setIsLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    step: "step2",
                    enrollmentId: enrollmentId,
                    address: JSON.stringify(formData.address),
                    parentGuardianInfo: JSON.stringify(formData.parentGuardianInfo),
                    schoolHistory: JSON.stringify(formData.schoolHistory),
                    seniorHigh: JSON.stringify(formData.seniorHigh),
                    studentType: formData.studentType
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // ✅ Mark step2 as saved
            sessionStorage.setItem("myForm", JSON.stringify(formData));
            sessionStorage.setItem("step2Saved", data.step2);
            
            window.scrollTo({ top: 0, behavior: "auto" });
            navigate("/enrollment/step3", { state: { allowed: true } });
        } catch (error) {
            setErrorMessage(error.message);
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    }, [role, navigate, location, formData]);






    const handleBack = useCallback(() => {
        if (role) {
            document.getElementById("scrollContainer")?.scrollTo({ top: 0, behavior: "auto" });
        } else {
            window.scrollTo({ top: 0, behavior: "auto" });
        }
        navigate(-1, { state: { allowed: true } });
    }, [role, navigate]);



    // ✅ Error Modal Component (add bago return)
    const ErrorModal = () => {
        if (!showErrorModal) return null;

        return (
            <>
                <div 
                    className="modal-backdrop fade show" 
                    style={{ zIndex: 1040 }}
                    onClick={() => setShowErrorModal(false)}
                ></div>
                
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center pt-5 pb-4">
                                <div className="mb-3">
                                    <i className="fa-solid fa-circle-xmark text-danger" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h5 className="fw-bold mb-3">Oops! Something went wrong</h5>
                                <p className="text-muted mb-0">{errorMessage}</p>
                            </div>
                            
                            <div className="modal-footer border-0 justify-content-center pb-4">
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-4" 
                                    onClick={() => setShowErrorModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };


    const removeNumbersAndSpecialChars = (value) => {
        // Allow: letters (a-z, A-Z), spaces, hyphens, apostrophes only
        // NO dots/periods, NO special chars
        return value.replace(/[^a-zA-Z\s\-']/g, '');
    };

    return (
        <div className="container bg-light d-flex">
            <div className={`row  justify-content-center w-100 g-0`}
            style={{marginTop: "120px"}}
            >
                <div className="col-12 ">

                    {!viewOnly && (
                        <ProgressStepper currentStep={2} />
                    )}

                    <div className="p-0 p-md-4">

                        
                        {/* Parent/Guardian Information */}
                        <div className="row justify-content-center">
                            <div className="col-md-8">
                                <div className="card border-0 mb-4">
                                    <div className="card-body">

                                        <h2 className="h5 fw-bold mb-4">PARENT/GUARDIAN INFORMATION</h2>

                                        
                                        <FormSection
                                            title="Father's Information (Optional)"
                                            fields={FORM_FIELDS.parentInfo}
                                            values={formData.parentGuardianInfo?.father}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="father"
                                        />

                                        <FormSection
                                            title="Mother's Information (Optional)"
                                            fields={FORM_FIELDS.parentInfo}
                                            values={formData.parentGuardianInfo?.mother}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="mother"
                                        />

                                        <FormSection
                                            title="Guardian's Information (Required)"
                                            fields={FORM_FIELDS.parentInfo.map(field => ({
                                                ...field,
                                                required: field.name === 'lastName' || field.name === 'firstName'  // ✅ ADD THIS
                                            }))}
                                            values={formData.parentGuardianInfo?.guardian}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="guardian"
                                        />

                                    </div>
                                </div>
                            </div>

                        </div>



                        {/* Address Section */}
                        <div className="row mb-4 justify-content-center ">
                            {/* Current Address */}
                            <div className="col-md-8">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <h2 className="h5 fw-bold mb-4">CURRENT ADDRESS</h2>
                                        
                                        <FormField
                                            label="House No."
                                            name="houseNo"
                                            type="text"
                                            value={formData.address?.current?.houseNo}
                                            onChange={(e) => handleAddressChange(e, 'current')}
                                            disabled={viewOnly}
                                            required={true}
                                        />
                                        
                                        <FormField
                                            label="Street"
                                            name="street"
                                            type="text"
                                            value={formData.address?.current?.street}
                                            onChange={(e) => handleAddressChange(e, 'current')}
                                            disabled={viewOnly}
                                            required={true}

                                        />

                                        <AddressDropdowns
                                            addressType="current"
                                            values={formData.address?.current || {}}
                                            onChange={handleAddressChange}
                                            disabled={viewOnly}
                                        />


                                        <FormField
                                            label="Zip Code"
                                            name="zipCode"
                                            type="text"
                                            value={formData.address?.current?.zipCode}
                                            onChange={(e) => handleAddressChange(e, 'current')}
                                            disabled={viewOnly}
                                            required={true} 
                                        />

                                        <FormField
                                            label="Contact Number"
                                            name="contactNumber"
                                            type="tel"
                                            value={formData.address?.current?.contactNumber}
                                            onChange={(e) => handleAddressChange(e, 'current')}
                                            disabled={viewOnly}
                                            required={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Permanent Address */}
                            <div className="col-md-8 mt-2">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <h2 className="h5 fw-bold mb-3">PERMANENT ADDRESS</h2>
                                        
                                        <div className="mb-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    name="sameAsCurrent"
                                                    checked={formData.address?.permanent?.sameAsCurrent || false}
                                                    onChange={handleAddressChange}
                                                    id="sameAsCurrent"
                                                    disabled={viewOnly}
                                                />
                                                <label className="form-check-label" htmlFor="sameAsCurrent">
                                                    Same as Current Address
                                                </label>
                                            </div>
                                        </div>

                                        <FormField
                                            label="House No."
                                            name="houseNo"
                                            type="text"
                                            value={formData.address?.permanent?.houseNo}
                                            onChange={(e) => handleAddressChange(e, 'permanent')}
                                            disabled={formData.address?.permanent?.sameAsCurrent || viewOnly}
                                            required={!formData.address?.permanent?.sameAsCurrent} 
                                        />

                                        <FormField
                                            label="Street"
                                            name="street"
                                            type="text"
                                            value={formData.address?.permanent?.street}
                                            onChange={(e) => handleAddressChange(e, 'permanent')}
                                            disabled={formData.address?.permanent?.sameAsCurrent || viewOnly}
                                            required={!formData.address?.permanent?.sameAsCurrent} 

                                        />

                                        <AddressDropdowns
                                            addressType="permanent"
                                            values={formData.address?.permanent || {}}
                                            onChange={handleAddressChange}
                                            disabled={formData.address?.permanent?.sameAsCurrent || viewOnly}
                                        />


                                        <FormField
                                            label="Zip Code"
                                            name="zipCode"
                                            type="text"
                                            value={formData.address?.permanent?.zipCode}
                                            onChange={(e) => handleAddressChange(e, 'permanent')}
                                            disabled={formData.address?.permanent?.sameAsCurrent || viewOnly}
                                            required={!formData.address?.permanent?.sameAsCurrent} 

                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* School History - ✅ Only show if isReturning is "Yes" */}
                        {formData.isReturning === 'Yes' && (
                            <div className="row justify-content-center">
                                <div className="col-md-8">
                                    <div className="card border-0 mb-4">
                                        <div className="card-body">
                                            <h2 className="h5 fw-bold mb-3">
                                                FOR RETURNING LEARNER (BALIK-ARAL) AND THOSE WHO WILL TRANSFER/MOVE IN
                                            </h2>
                                            
                                            <div className="mb-4">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        name="returningLearner"
                                                        checked={formData.schoolHistory?.returningLearner || false}
                                                        onChange={handleSchoolHistoryChange}
                                                        id="returningLearner"
                                                        disabled={viewOnly}
                                                    />
                                                    <label className="form-check-label" htmlFor="returningLearner">
                                                        I am a Returning Learner or Transferee
                                                        <span className="text-danger ms-1">*</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="d-flex gap-4 my-2">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={formData.studentType === 'transferee'}
                                                        onChange={() => handleAcademicStatusChange('transferee')}
                                                        disabled={!formData.schoolHistory?.returningLearner || viewOnly}
                                                        id="transferee"
                                                    />
                                                    <label className="form-check-label" htmlFor="transferee">
                                                        Transferee
                                                        <span className="text-danger ms-1">*</span>
                                                    </label>
                                                </div>
                                                
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={formData.studentType === 'returnee'}
                                                        onChange={() => handleAcademicStatusChange('returnee')}
                                                        disabled={!formData.schoolHistory?.returningLearner || viewOnly}
                                                        id="returnee"
                                                    />
                                                    <label className="form-check-label" htmlFor="returnee">
                                                        Returning Learner (Balik-Aral)
                                                        <span className="text-danger ms-1">*</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="row">
                                                {FORM_FIELDS.schoolHistory.map(field => (
                                                    <div key={field.name} className="col-12 mb-3">
                                                        <label className="form-label small">
                                                            {field.label}
                                                            <span className="text-danger ms-1">*</span>
                                                        </label>
                                                        <input
                                                            type={field.type}
                                                            name={field.name}
                                                            value={formData.schoolHistory?.[field.name] || ''}
                                                            onChange={handleSchoolHistoryChange}
                                                            className="form-control"
                                                            disabled={!formData.schoolHistory?.returningLearner || viewOnly}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        )}

                        {/* Senior High School */}
                        
                        <div className="row justify-content-center">
                            <div className="col-12 col-md-8">
                                <div className="card border-0 mb-4">
                                    <div className="card-body">
                                        <h2 className="h5 fw-bold mb-4">FOR LEARNERS IN SENIOR HIGH SCHOOL</h2>
                                        
                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <label className="form-label small">
                                                    Semester
                                                    <span className="text-danger ms-1">*</span> 
                                                </label>
                                                <select
                                                    name="semester"
                                                    value={formData.seniorHigh?.semester || ''}
                                                    onChange={handleSeniorHighChange}
                                                    className="form-select"
                                                    disabled={viewOnly}
                                                >
                                                    <option value="">Select Semester</option>
                                                    <option value="1st">First</option>
                                                    <option value="2nd">Second</option>
                                                </select>
                                            </div>

                                            <div className="col-12 mb-3">
                                                <label className="form-label small">
                                                Track
                                                <span className="text-danger ms-1">*</span>  
                                                </label>
                                                <select
                                                    name="track"
                                                    value={formData.seniorHigh?.track || ''}
                                                    onChange={handleSeniorHighChange}
                                                    className="form-select"
                                                    disabled={viewOnly}
                                                >
                                                    <option value="">Select Track</option>
                                                    <option value="Academic">Academic</option>
                                                    <option value="TVL">TVL (Technical-Vocational-Livelihood)</option>
                                                </select>
                                            </div>

                                            <div className="col-12 mb-3">

                                                <label className="form-label small">
                                                    Strand
                                                    <span className="text-danger ms-1">*</span>  
                                                </label>
                                                <select
                                                    name="strand"
                                                    value={formData.seniorHigh?.strand || ''}
                                                    onChange={handleSeniorHighChange}
                                                    className="form-select"
                                                    disabled={!formData.seniorHigh?.track || viewOnly}
                                                >
                                                    <option value="">
                                                        {!formData.seniorHigh?.track ? 'Select Track First' : 'Select Strand'}
                                                    </option>
                                                    {formData.seniorHigh?.track && 
                                                        STRAND_OPTIONS[formData.seniorHigh.track]?.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                       

                        {/* Navigation Buttons */}
                        <div className="d-flex align-items-center justify-content-center gap-3 my-3">
                            <button 
                                className="btn btn-secondary text-white text-capitalize px-5"
                                onClick={handleBack}
                            >
                                back
                            </button>
                            {/* <button 
                                className="btn btn-primary text-white text-capitalize px-5"
                                onClick={handleNext}
                                // disabled={!allFilled}
                            >
                                next
                            </button> */}

                            <button 
                                className="btn btn-primary text-white text-capitalize px-5"
                                onClick={handleNext}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'next'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ErrorModal />
        </div>
    );
};

























export const Step3 = () => {
    const { formData, setFormData, role } = useContext(globalContext);   
    const navigate = useNavigate();
    const fileRef = useRef({});
    const [allFilled, setAllField] = useState(false);
    const location = useLocation();
    const [approveModal, setApproveShowModal] = useState({
        isShow: false,
        data: {}
    });
    
    const [viewOnly, setViewOnly] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errorModal, setErrorModal] = useState({
        isShow: false,
        message: ''
    });




    useEffect(() => {
        if (!location?.state?.allowed) {
            navigate("/404_forbidden", { replace: true });
        }
    }, [location, navigate]);

    if(!location?.state?.allowed) return;

    // Initialize step3 data if it doesn't exist
    useEffect(() => {
        if (!formData.certification) {
            setFormData(prev => ({
                ...prev,
            
                certification: {
          
                    psaBirthCertFile: null,
                    psaBirthCertFileName: '',
                    psaBirthCertPreview: null,

                    reportCardFile: null,
                    reportCardFileName: '',
                    reportCardPreview: null,
                    
                    goodMoralFile: null,
                    goodMoralFileName: '',
                    goodMoralPreview: null,
                    
                    idPictureFile: null,
                    idPictureFileName: '',
                    idPicturePreview: null,

                    dateSigned: ''
                }
            }));
        }
    }, []);

    
    useEffect(() => {
        const saved = localStorage.getItem("myForm");
        if (saved) {
            setFormData(JSON.parse(saved));
        }else{

        }
    },[]);


    useEffect(() => {
        if (role !== "admin" && role !== "staff") return;

        const prefill = location?.state?.applicant;
        setApproveShowModal((prev) => ({...prev, data: prefill, isShow: prev.isShow }))
        if (!prefill) return;


        // Helper function to convert backend file path to full URL
        const getFilePreviewUrl = (filePath) => {
            if (!filePath) return null;

            // Base64? return as is.
            if (filePath.startsWith("data:")) return filePath;

            // Convert backslash → forward slash
            const normalized = filePath.replace(/\\/g, "/");

            // filePath: "uploads/enrollments/filename.png"
            return `${import.meta.env.VITE_API_URL}/api/${normalized}`;
        };


        setFormData(prev => ({
            ...prev,

            // 🔹 Certification + File Fields (FOR VIEWING ONLY)
             certification: {
                goodMoralFile: prefill.requiredDocuments.goodMoral?.filePath || null,
                goodMoralFileName: prefill.requiredDocuments.goodMoral?.filePath?.split("/").pop() || '',
                goodMoralPreview: getFilePreviewUrl(prefill.requiredDocuments.goodMoral?.filePath),

                idPictureFile: prefill.requiredDocuments.idPicture?.filePath || null,
                idPictureFileName: prefill.requiredDocuments.idPicture?.filePath?.split("/").pop() || '',
                idPicturePreview: getFilePreviewUrl(prefill.requiredDocuments.idPicture?.filePath),


                psaBirthCertFile: prefill.requiredDocuments.psaBirthCert?.filePath || null,
                psaBirthCertFileName: prefill.requiredDocuments.psaBirthCert?.filePath?.split("/").pop() || '',
                psaBirthCertPreview: getFilePreviewUrl(prefill.requiredDocuments.psaBirthCert?.filePath),

                reportCardFile: prefill.requiredDocuments.reportCard?.filePath || null,
                reportCardFileName: prefill.requiredDocuments.reportCard?.filePath?.split("/").pop() || '',
                reportCardPreview: getFilePreviewUrl(prefill.requiredDocuments.reportCard?.filePath),


                dateSigned: prefill.signature?.dateSigned
                ? new Date(prefill.signature?.dateSigned).toISOString().split('T')[0] 
                : ''
            },

            status: prefill.status
        }));


        setViewOnly(true);
    }, [location?.state?.applicant, approveModal?.data, role, viewOnly]);


    
    const checkPreferredAndCert = () => {
        const r = formData;

        if (!r.certification) {
            return false;
        }

        const c = r.certification;

        // ✅ For new submissions: check if File objects exist
        // ✅ For viewing mode: check if preview exists
        const hasPsaBirthCert = (c.psaBirthCertFile instanceof File) || c.psaBirthCertPreview;
        const hasReportCard = (c.reportCardFile instanceof File) || c.reportCardPreview;
        const hasIdPicture = (c.idPictureFile instanceof File) || c.idPicturePreview;

        if (!hasPsaBirthCert || !hasReportCard || !hasIdPicture) {
            return false;
        }

        return true;
    };







    useLayoutEffect(() => {
        setAllField(checkPreferredAndCert());
    }, [formData]);



    const [showModal, setShowModal] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState(null);


    
    const handleCertificationChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            certification: {
                ...prev.certification,
                [name]: value
            }
        }));
    };


    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        
        if (!file) return;

        // ✅ Validate file type FIRST
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
            alert('Only JPG and PNG files are allowed!');
            e.target.value = '';
            return;
        }
        
        try {
            // ✅ Compression options
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: file.type
            };

            // ✅ Compress the image
            const compressedBlob = await imageCompression(file, options);
            
            
            // ✅ Convert Blob to File with original filename
            const compressedFile = new File([compressedBlob], file.name, {
                type: compressedBlob.type,
                lastModified: Date.now()
            });
            
            // ✅ Create preview URL (not base64)
            const previewUrl = URL.createObjectURL(compressedFile);
            
            setFormData(prev => ({
                ...prev,
                certification: {
                    ...prev.certification,
                    [`${fieldName}File`]: compressedFile, // ✅ Now it's a proper File object
                    [`${fieldName}FileName`]: file.name,
                    [`${fieldName}Preview`]: previewUrl // ✅ Use object URL instead of base64
                }
            }));
            
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('Failed to compress image. Please try again.');
            e.target.value = '';
        }
    };







    const handleRemoveFile = (fieldName) => {
        const inputRef = fileRef.current[fieldName];

        if (inputRef) {
            inputRef.value = "";
        }

        // ✅ Revoke object URL to prevent memory leaks
        const previewUrl = formData.certification?.[`${fieldName}Preview`];
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setFormData(prev => ({
            ...prev,
            certification: {
                ...prev.certification,
                [`${fieldName}File`]: null,
                [`${fieldName}FileName`]: null,
                [`${fieldName}Preview`]: null
            }
        }));
    };

    useEffect(() => {
        // Cleanup function to revoke all object URLs when component unmounts
        return () => {
            const cert = formData.certification;
            if (cert) {
                ['psaBirthCertPreview', 'reportCardPreview', 'goodMoralPreview', 'idPicturePreview'].forEach(field => {
                    const url = cert[field];
                    if (url && url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                    }
                });
            }
        };
    }, []);




    const handleViewImage = (preview) => {
        if (preview) {
            setPreviewImage(preview);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        window.scrollTo({ top: 0, behavior: "auto"});

    };



    const truncateFilename = (filename, maxLength = 20) => {
        if (!filename) return '';
        
        if (filename.length <= maxLength) return filename;
        
        const extension = filename.split('.').pop();
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
        
        return `${truncatedName}...${extension}`;
    };



    const handleNext = async() => {
        if(role === "admin" || role === "staff"){
            setApproveShowModal((prev) => ({...prev, isShow: true, data: prev.data }));
            return
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();

            submitData.append('step', 'step3');
            
            const enrollmentId = sessionStorage.getItem('enrollmentId');
            if (!enrollmentId) {
                throw new Error('Enrollment ID not found. Please start from Step 1.');
            }
            submitData.append('enrollmentId', enrollmentId);

            // ✅ Simplified file appending
            const fileFields = ['psaBirthCert', 'reportCard', 'idPicture', 'goodMoral'];
            
            fileFields.forEach(fieldName => {
                const file = formData.certification?.[`${fieldName}File`];
                if (file instanceof File) {
                    submitData.append(`${fieldName}File`, file);
                }
            });

            // ✅ Debug: Check what's being sent
            console.log("=== FormData Contents ===");
            for (let [key, value] of submitData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}:`, {
                        name: value.name,
                        size: value.size,
                        type: value.type
                    });
                } else {
                    console.log(`${key}:`, value);
                }
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollment`, {
                method: "POST",
                credentials: "include",
                body: submitData
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit enrollment');
            }

            if(data.success) {
                setFormData({});
                sessionStorage.clear();
                setSuccessModal(true);
                setIsSubmitting(false); 
                return
            }
            
        } catch (error) {
            console.error("Error: ", error.message);
            setErrorModal({
                isShow: true,
                message: error.message || 'Something went wrong. Please try again.'
            });
            setIsSubmitting(false); 
        }
    };




    const handleBack = () => {
        
        if(!role) {
            window.scrollTo({ top: 0, behavior: "auto"});
        } else{
            document.getElementById("scrollContainer").scrollTo({
                top: 0,
                behavior: "auto"
            });
        }

        navigate(-1, { state: { allowed: true }});

    };

    return (
        <div className="container bg-light d-flex ">
            <div className={`row justify-content-center w-100 g-0`}
            style={{marginTop: "120px"}}
            >
                <div className="col-12 col-md-12 col-lg-12">

                    {!viewOnly && (
                        <ProgressStepper currentStep={3} />
                    )}
                    
                    <div className="p-0 p-md-4">
                        {/* Certification */}

                        <div className="row justify-content-center">
                            <div className="col-12 col-md-8">
                                <div className="card border-0 my-4">
                                    <div className="card-body">
                                        <h2 className="h5 fw-bold mb-4 text-muted">CERTIFICATION & REQUIRED DOCUMENTS</h2>
                                        
                                        <div className="alert alert-info mb-4">
                                            <p className="mb-2 small">
                                                <strong>I CERTIFY that:</strong>
                                            </p>
                                            <ul className="small mb-0">
                                                <li>All information provided in this form is true and correct</li>
                                                <li>I understand that any false information may result in the cancellation of my enrollment</li>
                                                <li>I agree to comply with all school policies and regulations</li>
                                            </ul>
                                        </div>

                                        <div className="row">
                                            {/* Right Column - Upload Required Documents */}
                                            <div className="col-md-12">
                                                <h3 className="h6 fw-semibold mb-3">Upload Required Documents</h3>
                                                
                                                {/* PSA Birth Certificate */}
                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        PSA BIRTH CERTIFICATE
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>
                                                            (JPG, PNG only)
                                                        </span>
                                                    </label>
                                                    
                                                    
                                                    
                                                    <div className="input-group">
                                                        <input
                                                            ref={(el) => (fileRef.current['psaBirthCert'] = el)}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'psaBirthCert')}
                                                            className="form-control"
                                                            disabled={viewOnly}
                                                        />
                                                    </div>
                                                    {formData.certification?.psaBirthCertFileName && (
                                                        <div className="mt-2 d-flex align-items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                                                onClick={() => handleViewImage(formData.certification.psaBirthCertPreview)}
                                                                title={formData.certification.psaBirthCertFileName} 
                                                            >
                                                                📄 {truncateFilename(formData.certification.psaBirthCertFileName, 25)} 
                                                            </button>
                                                            {!role && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger rounded-circle p-0"
                                                                    style={{ width: '24px', height: '24px' }}
                                                                    onClick={() => handleRemoveFile('psaBirthCert')}
                                                                    title="Remove file"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Report Card (Form 138) */}
                                                <div className="mb-3">
                                                    
                                                    <label className="form-label small fw-semibold text-muted">
                                                        REPORT CARD (FORM 138)
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>
                                                            (JPG, PNG only)
                                                        </span>
                                                    </label>
                                                    <div className="input-group">
                                                        <input
                                                            ref={(el) => (fileRef.current['reportCard'] = el)}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'reportCard')}
                                                            className="form-control"
                                                            disabled={viewOnly}
                                                        />
                                                    </div>
                                                    {formData.certification?.reportCardFileName && (
                                                        <div className="mt-2 d-flex align-items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                                                onClick={() => handleViewImage(formData.certification.reportCardPreview)}
                                                                title={formData.certification.reportCardFileName}  
                                                            >
                                                                📄 {truncateFilename(formData.certification.reportCardFileName, 25)} 
                                                            </button>
                                                            {!role && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger rounded-circle p-0"
                                                                    style={{ width: '24px', height: '24px' }}
                                                                    onClick={() => handleRemoveFile('reportCard')}
                                                                    title="Remove file"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Good Moral */}
                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        GOOD MORAL
                                                        <small className="text-muted ms-2">{"(optional)"}</small>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>
                                                            (JPG, PNG only)
                                                        </span>
                                                    </label>
                                                    <div className="input-group">
                                                        <input
                                                            ref={(el) => (fileRef.current['goodMoral'] = el)}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'goodMoral')}
                                                            className="form-control"
                                                            disabled={viewOnly}
                                                        />
                                                    </div>
                                                    {formData.certification?.goodMoralFileName && (
                                                        <div className="mt-2 d-flex align-items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                                                onClick={() => handleViewImage(formData.certification.goodMoralPreview)}
                                                                title={formData.certification.goodMoralFileName}  
                                                            >
                                                                📄 {truncateFilename(formData.certification.goodMoralFileName, 25)}  
                                                            </button>
                                                            {!role && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger rounded-circle p-0"
                                                                    style={{ width: '24px', height: '24px' }}
                                                                    onClick={() => handleRemoveFile('goodMoral')}
                                                                    title="Remove file"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2x2 ID Picture */}
                                                <div className="mb-3">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        2X2 ID PICTURE
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>
                                                            (JPG, PNG only)
                                                        </span>
                                                    </label>

                                                    
                                                    <div className="input-group">
                                                        <input
                                                            ref={(el) => (fileRef.current['idPicture'] = el)}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'idPicture')}
                                                            className="form-control"
                                                            disabled={viewOnly}
                                                        />
                                                    </div>
                                                    {formData.certification?.idPictureFileName && (
                                                        <div className="mt-2 d-flex align-items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                                                onClick={() => handleViewImage(formData.certification.idPicturePreview)}
                                                                title={formData.certification.idPictureFileName}  
                                                            >
                                                                📄 {truncateFilename(formData.certification.idPictureFileName, 25)}  
                                                            </button>
                                                            {!role && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger rounded-circle p-0"
                                                                    style={{ width: '24px', height: '24px' }}
                                                                    onClick={() => handleRemoveFile('idPicture')}
                                                                    title="Remove file"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Navigation Buttons */}
                        <div className="d-flex align-items-center justify-content-center gap-3 my-3">
                            <button 
                                className="btn btn-secondary text-white text-capitalize px-5"
                                onClick={handleBack}
                            >
                                back
                            </button>
                            <button 
                                className="btn btn-success text-white text-capitalize px-5"
                                onClick={handleNext}
                                disabled={
                                    !role 
                                        ? (!allFilled || isSubmitting) 
                                        : (formData?.status === "approved" || isSubmitting)
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    !role ? "submit" : formData?.status === "approved" ? "Approved" : "approve"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
              {/* Modal */}
            {approveModal?.isShow && approveModal?.data &&  (
                <div className="modal fade show d-block" 
                style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable 
                        `}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {'Approve Applicant'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setApproveShowModal(false)}
                                ></button>
                            </div>

                            {/* Approve Modal */}
                            <div className="modal-body text-center">
                                <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
                                <h5 className="mb-3">Approve Application?</h5>
                                <p className="text-muted">
                                    Do you want to approve the enrollment application of:
                                    <br/>
                                    <strong className="text-capitalize">
                                        {approveModal?.data.learnerInfo?.firstName} {approveModal?.data.learnerInfo?.lastName}
                                    </strong>
                                    <br/>
                                    <span className="badge bg-secondary mt-2">
                                        {approveModal?.data.gradeLevelToEnroll} - S.Y. {approveModal?.data.schoolYear}
                                    </span>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={()=>setApproveShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={async()=>{
                                        setApproveShowModal((prev) => ({...prev, isShow: false, data: prev.data }))
                                        
                                        try {
                                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                                                method: "PATCH",
                                                headers: {"Content-Type": "application/json"},
                                                body: JSON.stringify({ enrollmentId: approveModal?.data._id }),
                                                credentials: "include",
                                            })
                                            const data = await res.json();
                                            if(!res.ok) throw new Error(data.message);
                                            
                                            
                                            alert(data.message);

                                            document.getElementById("scrollContainer").scrollTo({
                                                top: 0,
                                                behavior: "smooth"
                                            });

                                            navigate(`/${role}/applicants`, {replace: true })
                                            
                                        } catch (error) {
                                            alert("Error: ", error.message);
                                        }
                                    }}
                                >
                                    <i className="fa fa-check me-2"></i>
                                    Yes, Approve
                                </button>
                            </div>
                        </div>
                    </div>  
                </div>
            )}

            {/* Image Preview Modal */}
            {showModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={handleCloseModal}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Image preview</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                {previewImage && (
                                    <img 
                                        src={previewImage} 
                                        alt="Signature Preview" 
                                        className="img-fluid"
                                        style={{ maxHeight: '500px' }}
                                    />
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleCloseModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Success Modal */}
            {successModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center py-5">
                                <div className="mb-4">
                                    <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h4 className="fw-bold mb-3">Admission Successful!</h4>
                                <p className="text-muted mb-4">
                                    We will send you an email after the admission approval.
                                </p>
                                <button 
                                    type="button" 
                                    className="btn btn-success px-5"
                                    onClick={() => {
                                        setSuccessModal(false);
                                        navigate('/', { replace: true, state: { allowed: false }});
                                        window.scrollTo({ top: 0, behavior: "auto"});
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Error Modal */}
            {errorModal.isShow && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center py-5">
                                <div className="mb-4">
                                    <i className="fa-solid fa-circle-xmark text-danger" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h4 className="fw-bold mb-3">Submission Failed</h4>
                                <p className="text-muted mb-4">
                                    {errorModal.message}
                                </p>
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-5"
                                    onClick={() => {
                                        setErrorModal({
                                            isShow: false,
                                            message: ''
                                        });
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
















const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [hasAccepted, setHasAccepted] = useState(false);

    const handleScroll = (e) => {
        const element = e.target;
        const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5;
        if (isAtBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = () => {
        if (hasAccepted && hasScrolledToBottom) {
            onAccept();
            // onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="modal-backdrop fade show" 
                style={{ zIndex: 1055 }}
            ></div>
            
            {/* Modal */}
            <div 
                className="modal fade show d-block" 
                tabIndex="-1" 
                style={{ zIndex: 1056 }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="modal-content" style={{ borderRadius: 0 }}>
                        {/* Header */}
                        <div className="modal-header bg-danger text-white" style={{ borderRadius: 0 }}>
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-file-contract me-2"></i>
                                Terms and Conditions for Enrollment
                            </h5>
                        </div>
                        
                        {/* Body */}
                        <div 
                            className="modal-body" 
                            style={{ maxHeight: '60vh', overflowY: 'auto' }}
                            onScroll={handleScroll}
                        >
                            {/* Introduction */}
                            <div className="alert alert-warning rounded mb-4" style={{ borderRadius: 0 }}>
                                <p className="mb-0 small">
                                    <strong>Important Notice:</strong> Please read the following terms and conditions carefully before proceeding with enrollment. 
                                    By clicking "I Agree", you consent to comply with all school policies and regulations.
                                </p>
                            </div>

                            {/* 1. Enrollment Agreement */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-check-circle me-2"></i>
                                    1. Enrollment Agreement
                                </h6>
                                <ul className="small">
                                    <li>I certify that all information provided in this enrollment form is true and accurate.</li>
                                     {/* Added */}
                                    <li>I confirm that my Learner Reference Number (LRN) is valid and registered under my name.</li>
                                    <li>I confirm that the Gmail address I provided is active and will be used to receive school notifications and announcements.</li>
                                    <li>I understand that any false information may result in the cancellation of my enrollment.</li>
                                    <li>I agree to comply with all school policies and regulations.</li>
                                    <li>I acknowledge that the school has the right to modify policies as necessary.</li>

                                   
                                </ul>
                            </section>

                            {/* 2. Tuition and Fees Policy */}
                            {/* <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-money-bill-wave me-2"></i>
                                    2. Tuition and Fees Policy
                                </h6>
                                <ul className="small">
                                    <li><strong>Payment Options:</strong> Tuition may be paid in full or through an installment plan.</li>
                                    <li><strong>Reservation Fee:</strong> The reservation fee is <strong>non-refundable</strong> once paid.</li>
                                    <li><strong>Late Payment:</strong> Late payments will incur penalties according to the schedule provided by the school.</li>
                                    <li><strong>Clearance:</strong> Students with outstanding balances will not receive report cards, diplomas, or be allowed to graduate until all fees are paid in full.</li>
                                    <li>The school reserves the right to deny examination privileges to students with unpaid balances.</li>
                                </ul>
                            </section> */}

                            {/* 3. School Rules and Discipline */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-school me-2"></i>
                                    2. School Rules and Discipline
                                </h6>
                                <ul className="small">
                                    <li><strong>Student Handbook:</strong> All students must comply with the rules stated in the Student Handbook.</li>
                                    <li><strong>Dress Code:</strong> Proper school uniform must be worn and maintained according to school policy.</li>
                                    <li><strong>Behavior Policy:</strong> Good conduct and respect toward fellow students, teachers, and school staff are expected.</li>
                                    <li><strong>Prohibited Items:</strong> Bringing prohibited items such as weapons, drugs, or any dangerous materials is strictly forbidden.</li>
                                    <li><strong>Sanctions:</strong> Violation of school policies will result in appropriate disciplinary action ranging from warnings to suspension or dismissal.</li>
                                </ul>
                            </section>

                            {/* 4. Attendance Policy */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-calendar-check me-2"></i>
                                    3. Attendance Policy
                                </h6>
                                <ul className="small">
                                    <li><strong>Required Attendance:</strong> A minimum of 75% attendance is required to pass a subject.</li>
                                    <li><strong>Excused Absences:</strong> Absences due to illness (with medical certificate), family emergencies, or other valid reasons may be excused.</li>
                                    <li><strong>Unexcused Absences:</strong> Absences without valid reason will negatively affect grades and may result in failure.</li>
                                    <li><strong>Tardiness:</strong> Repeated tardiness is equivalent to an absence. Three (3) times tardy equals one (1) absence.</li>
                                    <li>An excuse letter must be presented to the guidance counselor or class adviser within 3 days.</li>
                                </ul>
                            </section>

                            {/* 5. Academic Policy */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-graduation-cap me-2"></i>
                                    4. Academic Policy
                                </h6>
                                <ul className="small">
                                    <li><strong>Grading System:</strong> Grading follows the Department of Education (DepEd) grading system for Senior High School.</li>
                                    <li><strong>Passing Grade:</strong> The minimum passing grade is 75. Grades below 75 are considered failing.</li>
                                    <li><strong>Retention Rules:</strong> Students who fail three (3) or more subjects may not be allowed to advance to the next grade level.</li>
                                    <li><strong>Academic Honesty:</strong> Cheating, plagiarism, and other forms of academic dishonesty are strictly prohibited.</li>
                                    <li><strong>Academic Sanctions:</strong> Students caught cheating will receive a failing grade for the subject and may face disciplinary action.</li>
                                </ul>
                            </section>

                            {/* 6. Data Privacy Consent */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-shield-halved me-2"></i>
                                    5. Data Privacy Consent
                                </h6>
                                <p className="small mb-2">
                                    In accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>:
                                </p>
                                <ul className="small">
                                    <li><strong>Data Collection:</strong> The school collects personal information such as name, address, contact details, and academic records.</li>
                                    <li><strong>Purpose:</strong> This information will be used solely for enrollment, student records, academic purposes, and official school communications.</li>
                                    <li><strong>Protection:</strong> All personal data is securely stored and protected against unauthorized access.</li>
                                    <li><strong>Sharing:</strong> Your information will not be shared with third parties unless required by law or with your consent.</li>
                                    <li><strong>Rights:</strong> You have the right to access, correct, or request deletion of your personal data.</li>
                                </ul>
                            </section>

                            {/* 7. Withdrawal / Cancellation Policy */}
                            {/* <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-right-from-bracket me-2"></i>
                                    7. Withdrawal / Cancellation Policy
                                </h6>
                                <ul className="small">
                                    <li><strong>Deadline:</strong> Withdrawal must be processed before the prescribed period (usually before midterms).</li>
                                    <li><strong>Refund Policy:</strong> 
                                        <ul>
                                            <li>Withdrawal before classes start - 100% tuition refund (minus reservation fee)</li>
                                            <li>Withdrawal within 1st week - 75% refund</li>
                                            <li>Withdrawal within 2nd week - 50% refund</li>
                                            <li>Withdrawal after 2nd week - No refund</li>
                                        </ul>
                                    </li>
                                    <li><strong>Clearance:</strong> The clearance process must be completed and all school property returned.</li>
                                    <li><strong>Transfer Credentials:</strong> Transfer credentials will only be released if the student is cleared of all obligations.</li>
                                </ul>
                            </section> */}

                            {/* 8. Parent / Guardian Consent */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-users me-2"></i>
                                    6. Parent / Guardian Consent
                                </h6>
                                <ul className="small">
                                    <li>As a parent or legal guardian, I agree to comply with all school policies.</li>
                                    <li>I acknowledge my responsibility to monitor my child's academic progress and behavior.</li>
                                    <li>I agree to communicate with the school regarding any issues or concerns about my child.</li>
                                    <li>I understand that the school has the right to impose disciplinary measures when necessary.</li>
                                    <li>I agree to pay all fees and tuition in a timely manner.</li>
                                </ul>
                            </section>

                            {/* 9. Liability / Safety Clause */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    7. Liability and Safety Clause
                                </h6>
                                <ul className="small">
                                    <li><strong>Lost Items:</strong> The school is not liable for lost or damaged personal belongings of students.</li>
                                    <li><strong>Accidents/Injuries:</strong> While the school strives to maintain a safe environment, we are not liable for accidents unless directly caused by school negligence.</li>
                                    <li><strong>Health and Safety:</strong> 
                                        <ul>
                                            <li>Students must comply with school health protocols</li>
                                            <li>Report immediately if experiencing symptoms of illness</li>
                                            <li>Students with contagious diseases are not allowed on campus</li>
                                        </ul>
                                    </li>
                                    <li><strong>Emergency Contact:</strong> Emergency contact information must be kept current in school records.</li>
                                    <li><strong>Valuables:</strong> Avoid bringing valuable items to school. If necessary, they are brought at the student's own risk.</li>
                                </ul>
                            </section>

                            {/* Final Note */}
                            {/* <div className="alert alert-warning mt-4" style={{ borderRadius: 0 }}>
                                <p className="small mb-0">
                                    <strong><i className="fa-solid fa-info-circle me-2"></i>Notice:</strong> 
                                    These policies may be amended by the school at any time. Changes will be communicated through official channels. 
                                    Continued enrollment constitutes acceptance of any new policies.
                                </p>
                            </div> */}

                            {/* Scroll Reminder */}
                            {/* {!hasScrolledToBottom && (
                                <div className="alert alert-danger mt-3" style={{ borderRadius: 0 }}>
                                    <small>
                                        <i className="fa-solid fa-arrow-down me-2"></i>
                                        Please scroll down to read all terms and conditions.
                                    </small>
                                </div>
                            )} */}
                        </div>
                        
                        {/* Footer */}
                        <div className="modal-footer border-top" style={{ borderRadius: 0 }}>
                            <div className="form-check mb-2 w-100">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="acceptTerms"
                                    checked={hasAccepted}
                                    onChange={(e) => setHasAccepted(e.target.checked)}
                                    disabled={!hasScrolledToBottom}
                                />
                                <label className="form-check-label small" htmlFor="acceptTerms">
                                    I have read and understood all the terms and conditions above, and I agree to comply with them.
                                </label>
                            </div>
                            
                            <div className="w-100 d-flex gap-2 justify-content-end">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary " 
                                    onClick={onClose}
                                >
                                    <i className="fa-solid fa-times me-2"></i>
                                    Decline
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={handleAccept}
                                    disabled={!hasAccepted || !hasScrolledToBottom}
                                >
                                    <i className="fa-solid fa-check me-2"></i>
                                    I Agree
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};