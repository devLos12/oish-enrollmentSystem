import React, { useContext, useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../context/global";
import imageCompression from 'browser-image-compression';




const Reminder = () => {

    const [showReminder, setShowReminder] = useState(true);

    return (
        
        showReminder && (
            <div className="alert alert-warning alert-dismissible fade show bg-warning bg-opacity-10 border-warning mx-auto mb-3" 
                style={{ maxWidth: '700px' }} 
                role="alert">
                <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>
                <strong>Reminder:</strong> This form will ask for the following requirements:
                <ul className="mb-0 mt-1 small">
                    <li>PSA Birth Certificate</li>
                    <li>Report Card (Form 138)</li>
                    <li>2x2 ID Picture</li>
                    <li>Good Moral Certificate <span className="text-muted">(optional)</span></li>
                </ul>
                <button type="button" 
                onClick={() => setShowReminder(false)}
                className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        )  

    )
}




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
                                                backgroundColor: currentStep > step.number ? '#198754' : '#d6d6d6',
                                                transition: 'background-color 0.4s ease',
                                                zIndex: 0
                                            }}
                                        />
                                    )}

                                    {/* Circle with Number */}
                                    <div 
                                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold position-relative
                                            ${currentStep >= step.number ? 'bg-success text-white' : 'bg-white border border-2 text-secondary'}`}
    
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
                                            ${currentStep >= step.number ? 'text-success' : 'text-secondary'}`}
                                        
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
    const [emailValid, setEmailValid] = useState(false);



    


    useEffect(() => {
        const checkAccess = async () => {
            // isUpdate flow — direct allow, skip enrollment check
                        
            if (location?.state?.isUpdate) {
                setHasAcceptedTerms(true);
                return;
            }


            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllSchoolYears`, {
                    method: "GET",
                    credentials: "include"
                });
                const data = await res.json();
                if (data.success && data.data) {
                    const activeYear = data.data.find(sy => sy.isCurrent);

                    if (activeYear?.enrollmentStatus !== 'open') {
                        navigate("/404_forbidden", { replace: true });
                        return;
                    }


                } else {
                    navigate("/404_forbidden", { replace: true });
                    return;
                }
            } catch (err) {
                navigate("/404_forbidden", { replace: true });
                return;
            }

            // ✅ Terms modal logic — only runs if enrollment is open
            const termsAccepted = sessionStorage.getItem("termsAccepted");
            if (!termsAccepted) {
                setShowTermsModal(true);
            } else {
                setHasAcceptedTerms(true);
            }
        };

        checkAccess();
    }, [location?.state?.isUpdate]);









    useEffect(() => {
        getAllEmailsForValidations();
    },[]);





    const getAllEmailsForValidations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllEmails`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if(data.success){
                // Kung update flow — i-exclude yung sariling email nya
                // para hindi mag-appear as duplicate
                if(location?.state?.isUpdate) {
                    const ownEmail = location?.state?.enrollmentData?.learnerInfo?.email?.toLowerCase();
                    setEmailVerify(data.emails.filter(e => 
                        e.learnerInfo?.email?.toLowerCase() !== ownEmail
                    ));
                } else {
                    setEmailVerify(data.emails);
                }
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
        // ✅ Skip sessionStorage load kung update flow
        if(location?.state?.isUpdate) return;
        const saved = sessionStorage.getItem("myForm");
        if (saved) {
            setFormData(JSON.parse(saved));
        }
    },[]);



    // ✅ Prefill para sa update flow
    useEffect(() => {
        if (!location?.state?.isUpdate) return;

        const prefill = location?.state?.enrollmentData;
        if (!prefill) return;

        // ✅ I-save sa sessionStorage para ma-access ng Steps 2 at 3
        sessionStorage.setItem("enrollmentId", prefill._id);
        sessionStorage.setItem("updateToken", location?.state?.token);
        sessionStorage.setItem("isUpdate", "true");



        setFormData(prev => ({
            ...prev,
            isReturning: prefill.isReturning ? "Yes" : "No",
            learnerInfo: {
                ...prev.learnerInfo,
                email: prefill.learnerInfo?.email || '',
                lrn: prefill.learnerInfo?.lrn || '',
                lastName: prefill.learnerInfo?.lastName || '',
                firstName: prefill.learnerInfo?.firstName || '',
                middleName: prefill.learnerInfo?.middleName === 'N/A' ? '' : prefill.learnerInfo?.middleName || '',
                extensionName: prefill.learnerInfo?.extensionName === 'N/A' ? '' : prefill.learnerInfo?.extensionName || '',
                birthDate: new Date(prefill.learnerInfo.birthDate).toISOString().split("T")[0] || '',
                age: prefill.learnerInfo?.age?.toString() || '',
                sex: prefill.learnerInfo?.sex || '',
                placeOfBirth: prefill.learnerInfo?.placeOfBirth || '',
                motherTongue: prefill.learnerInfo?.motherTongue || '',
                learnerWithDisability: {
                    isDisabled: prefill.learnerInfo?.learnerWithDisability?.isDisabled ? "Yes" : "No",
                    disabilityType: prefill.learnerInfo?.learnerWithDisability?.disabilityType || []
                },
                indigenousCommunity: {
                    isMember: prefill.learnerInfo?.indigenousCommunity?.isMember ? "Yes" : "No",
                    name: prefill.learnerInfo?.indigenousCommunity?.name || ''
                },
                fourPs: {
                    isBeneficiary: prefill.learnerInfo?.fourPs?.isBeneficiary ? "Yes" : "No",
                    householdId: prefill.learnerInfo?.fourPs?.householdId || ''
                }
            }
        }));
    }, [location?.state?.isUpdate, location?.state?.enrollmentData]);

   

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
                    setEmailValid(false);
                } else {
                    setEmailError('');
                    setEmailValid(emailValue.length > 0);
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
            

            navigate("/enrollment/step2", { 
                state: { 
                    allowed: true,
                    isUpdate: location?.state?.isUpdate || false,
                    enrollmentData: location?.state?.enrollmentData  // ✅ dagdag
                }
            });


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
                    isReturning: formData.isReturning,
                    learnerInfo: JSON.stringify(formData.learnerInfo),
                })
            });


            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            sessionStorage.setItem("enrollmentId", data.enrollmentId); 
            sessionStorage.setItem("myForm", JSON.stringify(formData));
            sessionStorage.setItem("step1Saved", data.step1);


            window.scrollTo({ top: 0, behavior: "auto"});

            navigate("/enrollment/step2", { 
                state: { 
                    allowed: true,
                    isUpdate: location?.state?.isUpdate || false,
                    enrollmentData: location?.state?.enrollmentData  
                }
            });


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
       // Palitan ang buong extensionName block (mula sa `if (field.name === 'extensionName')`) ng:

        if (field.name === 'extensionName') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label}
                        {field.optional && <span className="text-muted ms-2">(Optional)</span>}
                    </label>
                    <input
                        type="text"
                        name="learnerInfo.extensionName"
                        value={formData?.learnerInfo?.extensionName || ''}
                        onChange={handleChange}
                        className="form-control"
                        disabled={viewOnly}
                        placeholder="e.g. Jr., Sr., II, III"
                        maxLength={10}
                    />
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
                        field.name === 'email' && emailError ? 'is-invalid' : 
                        field.name === 'email' && emailValid ? 'is-valid' : ''
                    }`}

                    disabled={viewOnly}
                />

                {field.name === 'email' && emailError && (
                    <div className="text-danger d-block mt-1" style={{fontSize: '0.875rem'}}>
                        <i className="fa-solid fa-circle-xmark me-1"></i>
                        {emailError}
                    </div>
                )}

                {field.name === 'email' && emailValid && (
                    <div className="text-success d-block mt-1" style={{fontSize: '0.875rem'}}>
                        <i className="fa-solid fa-circle-check me-1"></i>
                        Email is available
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
        if (!formData.isReturning) {
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

                    <Reminder/>


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
                            
                            <div className="col-12 col-md-8 mt-2">
                                <div className="card border-0 h-100">
                                    <div className="card-body">
                                        <p className="mb-3">Select the appropriate circle only</p>
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
                <div className="d-flex justify-content-center align-items-center w-100" 
                style={{minHeight: '60vh', marginTop: "120px"}}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            )}
            
            <ErrorModal />
        </div>
    );
};



export const FORM_FIELDS = {
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
        guardian: { lastName: '', firstName: '', middleName: '', contactNumber: '', relationship: '' }
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
export const ZIP_CODE_MAP = {
    // Format: 'MunicipalityName, ProvinceName': 'zipCode'
    
    // ILOCOS NORTE
    'Laoag, Ilocos Norte': '2900',
    'Batac, Ilocos Norte': '2906',
    'Adams, Ilocos Norte': '2919',
    'Bacarra, Ilocos Norte': '2916',
    'Badoc, Ilocos Norte': '2904',
    'Bangui, Ilocos Norte': '2920',
    'Banna, Ilocos Norte': '2914',
    'Burgos, Ilocos Norte': '2922',
    'Carasi, Ilocos Norte': '2913',
    'Currimao, Ilocos Norte': '2903',
    'Dingras, Ilocos Norte': '2911',
    'Dumalneg, Ilocos Norte': '2921',
    'Marcos, Ilocos Norte': '2908',
    'Nueva Era, Ilocos Norte': '2912',
    'Pagudpud, Ilocos Norte': '2923',
    'Paoay, Ilocos Norte': '2902',
    'Pasuquin, Ilocos Norte': '2917',
    'Piddig, Ilocos Norte': '2915',
    'Pinili, Ilocos Norte': '2907',
    'San Nicolas, Ilocos Norte': '2901',
    'Sarrat, Ilocos Norte': '2910',
    'Solsona, Ilocos Norte': '2909',
    'Vintar, Ilocos Norte': '2918',

    // ILOCOS SUR
    'Vigan, Ilocos Sur': '2700',
    'Candon, Ilocos Sur': '2517',
    'Bantay, Ilocos Sur': '2727',
    'Cabugao, Ilocos Sur': '2724',
    'Caoayan, Ilocos Sur': '2705',
    'Cervantes, Ilocos Sur': '2716',
    'Galimuyod, Ilocos Sur': '2514',
    'Gregorio del Pilar, Ilocos Sur': '2720',
    'Lidlidda, Ilocos Sur': '2719',
    'Magsingal, Ilocos Sur': '2722',
    'Nagbukel, Ilocos Sur': '2706',
    'Narvacan, Ilocos Sur': '2508',
    'Quirino, Ilocos Sur': '2718',
    'Salcedo, Ilocos Sur': '2713',
    'San Emilio, Ilocos Sur': '2721',
    'San Esteban, Ilocos Sur': '2509',
    'San Ildefonso, Ilocos Sur': '2707',
    'San Juan, Ilocos Sur': '2726',
    'San Vicente, Ilocos Sur': '2710',
    'Santa, Ilocos Sur': '2723',
    'Santa Catalina, Ilocos Sur': '2711',
    'Santa Cruz, Ilocos Sur': '2512',
    'Santa Lucia, Ilocos Sur': '2715',
    'Santa Maria, Ilocos Sur': '2709',
    'Santiago, Ilocos Sur': '2725',
    'Santo Domingo, Ilocos Sur': '2712',
    'Sigay, Ilocos Sur': '2717',
    'Sinait, Ilocos Sur': '2506',
    'Sugpon, Ilocos Sur': '2714',
    'Suyo, Ilocos Sur': '2716',
    'Tagudin, Ilocos Sur': '2515',

    // LA UNION
    'San Fernando, La Union': '2500',
    'Agoo, La Union': '2504',
    'Aringay, La Union': '2503',
    'Bacnotan, La Union': '2515',
    'Bagulin, La Union': '2506',
    'Balaoan, La Union': '2511',
    'Bangar, La Union': '2513',
    'Bauang, La Union': '2501',
    'Burgos, La Union': '2516',
    'Caba, La Union': '2502',
    'Luna, La Union': '2512',
    'Naguilian, La Union': '2505',
    'Pugo, La Union': '2508',
    'Rosario, La Union': '2519',
    'San Gabriel, La Union': '2507',
    'San Juan, La Union': '2514',
    'Santo Tomas, La Union': '2504',
    'Santol, La Union': '2509',
    'Sudipen, La Union': '2510',
    'Tubao, La Union': '2503',

    // PANGASINAN
    'Dagupan, Pangasinan': '2400',
    'San Carlos, Pangasinan': '2420',
    'Urdaneta, Pangasinan': '2428',
    'Alaminos, Pangasinan': '2404',
    'Agno, Pangasinan': '2408',
    'Aguilar, Pangasinan': '2415',
    'Alcala, Pangasinan': '2425',
    'Anda, Pangasinan': '2405',
    'Asingan, Pangasinan': '2432',
    'Balungao, Pangasinan': '2443',
    'Bani, Pangasinan': '2407',
    'Basista, Pangasinan': '2423',
    'Bautista, Pangasinan': '2442',
    'Bayambang, Pangasinan': '2423',
    'Binalonan, Pangasinan': '2436',
    'Binmaley, Pangasinan': '2417',
    'Bolinao, Pangasinan': '2406',
    'Bugallon, Pangasinan': '2416',
    'Burgos, Pangasinan': '2409',
    'Calasiao, Pangasinan': '2418',
    'Dasol, Pangasinan': '2410',
    'Infanta, Pangasinan': '2412',
    'Labrador, Pangasinan': '2412',
    'Laoac, Pangasinan': '2437',
    'Lingayen, Pangasinan': '2401',
    'Mabini, Pangasinan': '2411',
    'Malasiqui, Pangasinan': '2421',
    'Manaoag, Pangasinan': '2430',
    'Mangaldan, Pangasinan': '2432',
    'Mangatarem, Pangasinan': '2413',
    'Mapandan, Pangasinan': '2429',
    'Natividad, Pangasinan': '2439',
    'Pozorrubio, Pangasinan': '2435',
    'Rosales, Pangasinan': '2441',
    'San Fabian, Pangasinan': '2433',
    'San Jacinto, Pangasinan': '2431',
    'San Manuel, Pangasinan': '2438',
    'San Nicolas, Pangasinan': '2447',
    'San Quintin, Pangasinan': '2444',
    'Santa Barbara, Pangasinan': '2419',
    'Santa Maria, Pangasinan': '2427',
    'Santo Tomas, Pangasinan': '2434',
    'Sison, Pangasinan': '2434',
    'Sual, Pangasinan': '2403',
    'Tayug, Pangasinan': '2445',
    'Umingan, Pangasinan': '2440',
    'Urbiztondo, Pangasinan': '2414',
    'Villasis, Pangasinan': '2427',

    // MISAMIS ORIENTAL
    'Cagayan de Oro, Misamis Oriental': '9000',
    'Gingoog, Misamis Oriental': '9014',
    'El Salvador, Misamis Oriental': '9017',
    'Alubijid, Misamis Oriental': '9003',
    'Balingasag, Misamis Oriental': '9005',
    'Balingoan, Misamis Oriental': '9007',
    'Binuangan, Misamis Oriental': '9006',
    'Claveria, Misamis Oriental': '9004',
    'Gitagum, Misamis Oriental': '9022',
    'Initao, Misamis Oriental': '9001',
    'Jasaan, Misamis Oriental': '9003',
    'Kinoguitan, Misamis Oriental': '9008',
    'Lagonglong, Misamis Oriental': '9023',
    'Laguindingan, Misamis Oriental': '9019',
    'Libertad, Misamis Oriental': '9021',
    'Lugait, Misamis Oriental': '9002',
    'Magsaysay, Misamis Oriental': '9020',
    'Manticao, Misamis Oriental': '9018',
    'Medina, Misamis Oriental': '9011',
    'Naawan, Misamis Oriental': '9023',
    'Opol, Misamis Oriental': '9016',
    'Salay, Misamis Oriental': '9009',
    'Sugbongcogon, Misamis Oriental': '9010',
    'Tagoloan, Misamis Oriental': '9001',
    'Talisayan, Misamis Oriental': '9013',
    'Villanueva, Misamis Oriental': '9023',

    // MISAMIS OCCIDENTAL
    'Oroquieta, Misamis Occidental': '7207',
    'Ozamiz, Misamis Occidental': '7200',
    'Tangub, Misamis Occidental': '7214',
    'Aloran, Misamis Occidental': '7205',
    'Baliangao, Misamis Occidental': '7212',
    'Bonifacio, Misamis Occidental': '7213',
    'Calamba, Misamis Occidental': '7206',
    'Clarin, Misamis Occidental': '7203',
    'Concepcion, Misamis Occidental': '7208',
    'Don Victoriano Chiongbian, Misamis Occidental': '7215',
    'Jimenez, Misamis Occidental': '7204',
    'Lopez Jaena, Misamis Occidental': '7209',
    'Panaon, Misamis Occidental': '7201',
    'Plaridel, Misamis Occidental': '7210',
    'Sapang Dalaga, Misamis Occidental': '7211',
    'Sinacaban, Misamis Occidental': '7202',
    'Tudela, Misamis Occidental': '7216',

    // BUKIDNON
    'Malaybalay, Bukidnon': '8700',
    'Valencia, Bukidnon': '8709',
    'Cabanglasan, Bukidnon': '8707',
    'Baungon, Bukidnon': '8703',
    'Damulog, Bukidnon': '8706',
    'Dangcagan, Bukidnon': '8707',
    'Don Carlos, Bukidnon': '8712',
    'Impasugong, Bukidnon': '8702',
    'Kadingilan, Bukidnon': '8714',
    'Kalilangan, Bukidnon': '8713',
    'Kibawe, Bukidnon': '8710',
    'Kitaotao, Bukidnon': '8711',
    'Lantapan, Bukidnon': '8701',
    'Libona, Bukidnon': '8703',
    'Malitbog, Bukidnon': '8714',
    'Manolo Fortich, Bukidnon': '8703',
    'Maramag, Bukidnon': '8716',
    'Pangantucan, Bukidnon': '8715',
    'Quezon, Bukidnon': '8715',
    'San Fernando, Bukidnon': '8712',
    'Sumilao, Bukidnon': '8704',
    'Talakag, Bukidnon': '8705',

    // LANAO DEL NORTE
    'Iligan, Lanao del Norte': '9200',
    'Bacolod, Lanao del Norte': '9211',
    'Baloi, Lanao del Norte': '9209',
    'Baroy, Lanao del Norte': '9210',
    'Kapatagan, Lanao del Norte': '9214',
    'Kauswagan, Lanao del Norte': '9209',
    'Kolambugan, Lanao del Norte': '9207',
    'Lala, Lanao del Norte': '9210',
    'Linamon, Lanao del Norte': '9208',
    'Magsaysay, Lanao del Norte': '9212',
    'Maigo, Lanao del Norte': '9205',
    'Matungao, Lanao del Norte': '9213',
    'Munai, Lanao del Norte': '9215',
    'Nunungan, Lanao del Norte': '9216',
    'Pantao Ragat, Lanao del Norte': '9217',
    'Pantar, Lanao del Norte': '9218',
    'Poona Piagapo, Lanao del Norte': '9219',
    'Salvador, Lanao del Norte': '9206',
    'Sapad, Lanao del Norte': '9220',
    'Sultan Naga Dimaporo, Lanao del Norte': '9204',
    'Tagoloan, Lanao del Norte': '9201',
    'Tangkal, Lanao del Norte': '9221',
    'Tubod, Lanao del Norte': '9203',

    // CAMIGUIN
    'Mambajao, Camiguin': '9100',
    'Catarman, Camiguin': '9103',
    'Guinsiliban, Camiguin': '9104',
    'Mahinog, Camiguin': '9101',
    'Sagay, Camiguin': '9102',

    // BATANGAS
    'Agoncillo, Batangas': '4211',
    'Alitagtag, Batangas': '4205',
    'Balayan, Batangas': '4213',
    'Balete, Batangas': '4219',
    'Batangas City, Batangas': '4200',
    'Bauan, Batangas': '4201',
    'Calaca, Batangas': '4212',
    'Calatagan, Batangas': '4215',
    'Cuenca, Batangas': '4222',
    'Ibaan, Batangas': '4230',
    'Laurel, Batangas': '4221',
    'Lemery, Batangas': '4209',
    'Lian, Batangas': '4216',
    'Lipa, Batangas': '4217',
    'Lobo, Batangas': '4229',
    'Mabini, Batangas': '4202',
    'Malvar, Batangas': '4233',
    'Mataas na Kahoy, Batangas': '4223',
    'Nasugbu, Batangas': '4231',
    'Padre Garcia, Batangas': '4224',
    'Rosario, Batangas': '4225',
    'San Antonio, Batangas': '4203',
    'San Jose, Batangas': '4227',
    'San Juan, Batangas': '4226',
    'San Luis, Batangas': '4210',
    'San Nicolas, Batangas': '4207',
    'San Pascual, Batangas': '4204',
    'Santa Teresita, Batangas': '4206',
    'Santo Tomas, Batangas': '4234',
    'Talisay, Batangas': '4220',
    'Tanauan, Batangas': '4232',
    'Taysan, Batangas': '4228',
    'Tingloy, Batangas': '4208',
    'Tuy, Batangas': '4214',

    // CAVITE
    'Cavite City, Cavite': '4100',
    'Kawit, Cavite': '4104',
    'Noveleta, Cavite': '4105',
    'Rosario, Cavite': '4106',
    'Bacoor, Cavite': '4102',
    'Imus, Cavite': '4103',
    'Tanza, Cavite': '4108',
    'Trece Martires, Cavite': '4109',
    'Naic, Cavite': '4110',
    'Ternate, Cavite': '4111',
    'Maragondon, Cavite': '4112',
    'Magallanes, Cavite': '4113',
    'Dasmariñas, Cavite': '4114',
    'Carmona, Cavite': '4116',
    'General Trias, Cavite': '4107',
    'General Mariano Alvarez, Cavite': '4117',
    'Silang, Cavite': '4118',
    'Amadeo, Cavite': '4119',
    'Tagaytay, Cavite': '4120',
    'Mendez, Cavite': '4121',
    'Indang, Cavite': '4122',
    'Alfonso, Cavite': '4123',

    // LAGUNA
    'Calamba, Laguna': '4027',
    'Santa Rosa, Laguna': '4026',
    'Biñan, Laguna': '4024',
    'San Pedro, Laguna': '4023',
    'Los Baños, Laguna': '4030',
    'Cabuyao, Laguna': '4025',
    'San Pablo, Laguna': '4000',
    'Santa Cruz, Laguna': '4009',
    'Pagsanjan, Laguna': '4008',
    'Paete, Laguna': '4016',
    'Pakil, Laguna': '4013',
    'Pangil, Laguna': '4017',
    'Majayjay, Laguna': '4005',
    'Liliw, Laguna': '4004',
    'Magdalena, Laguna': '4007',
    'Cavinti, Laguna': '4013',
    'Luisiana, Laguna': '4032',
    'Lucban, Laguna': '4328',
    'Siniloan, Laguna': '4019',
    'Famy, Laguna': '4021',
    'Mabitac, Laguna': '4020',
    'Nagcarlan, Laguna': '4003',
    'Rizal, Laguna': '4001',
    'Alaminos, Laguna': '4001',
    'Bay, Laguna': '4033',
    'Calauan, Laguna': '4012',
    'Kalayaan, Laguna': '4015',
    'Lumban, Laguna': '4014',
    'Pila, Laguna': '4010',
    'San Antonio, Laguna': '4011',
    'Victoria, Laguna': '4031',
    'Santa Maria, Laguna': '4022',

    // RIZAL
    'Antipolo, Rizal': '1870',
    'Cainta, Rizal': '1900',
    'Taytay, Rizal': '1920',
    'Angono, Rizal': '1930',
    'Binangonan, Rizal': '1940',
    'Cardona, Rizal': '1950',
    'Jala-Jala, Rizal': '1960',
    'Morong, Rizal': '1960',
    'Pililla, Rizal': '1910',
    'San Mateo, Rizal': '1850',
    'Tanay, Rizal': '1980',
    'Baras, Rizal': '1970',
    'Teresa, Rizal': '1880',
    'Rodriguez, Rizal': '1860',

    // QUEZON
    'Lucena, Quezon': '4301',
    'Tayabas, Quezon': '4327',
    'Sariaya, Quezon': '4322',
    'Candelaria, Quezon': '4323',
    'Tiaong, Quezon': '4325',
    'Dolores, Quezon': '4326',
    'San Antonio, Quezon': '4324',
    'Pagbilao, Quezon': '4302',
    'Padre Burgos, Quezon': '4303',
    'Atimonan, Quezon': '4331',
    'Gumaca, Quezon': '4307',
    'Plaridel, Quezon': '4308',
    'Lopez, Quezon': '4316',
    'Macalelon, Quezon': '4309',
    'General Luna, Quezon': '4310',
    'Pitogo, Quezon': '4311',
    'Mulanay, Quezon': '4312',
    'San Narciso, Quezon': '4313',
    'San Francisco, Quezon': '4314',
    'Catanauan, Quezon': '4306',
    'General Nakar, Quezon': '4335',
    'Infanta, Quezon': '4336',
    'Real, Quezon': '4335',
    'Polillo, Quezon': '4337',
    'Burdeos, Quezon': '4338',
    'Panukulan, Quezon': '4339',
    'Patnanungan, Quezon': '4340',
    'Jomalig, Quezon': '4341',
    'Perez, Quezon': '4304',
    'Unisan, Quezon': '4305',
    'Guinayangan, Quezon': '4319',
    'Tagkawayan, Quezon': '4318',
    'Calauag, Quezon': '4318',
    'Mauban, Quezon': '4330',
    'Quezon, Quezon': '4332',
    'Alabat, Quezon': '4333',
    'Baler, Quezon': '3200',

    // NCR
    'Manila, Metro Manila': '1000',
    'Quezon City, Metro Manila': '1100',
    'Makati, Metro Manila': '1200',
    'Pasay, Metro Manila': '1300',
    'Mandaluyong, Metro Manila': '1550',
    'Pasig, Metro Manila': '1600',
    'Marikina, Metro Manila': '1800',
    'Taguig, Metro Manila': '1630',
    'Parañaque, Metro Manila': '1700',
    'Las Piñas, Metro Manila': '1740',
    'Muntinlupa, Metro Manila': '1770',
    'Caloocan, Metro Manila': '1400',
    'Malabon, Metro Manila': '1470',
    'Navotas, Metro Manila': '1485',
    'Valenzuela, Metro Manila': '1440',
    'San Juan, Metro Manila': '1500',

    // MAJOR CITIES
    'Cebu City, Cebu': '6000',
    'Davao City, Davao del Sur': '8000',
    'Zamboanga City, Zamboanga del Sur': '7000',
    'Bacolod, Negros Occidental': '6100',
    'Iloilo City, Iloilo': '5000',
    'Baguio, Benguet': '2600',

    // BULACAN
    'Malolos, Bulacan': '3000',
    'Meycauayan, Bulacan': '3020',
    'San Jose del Monte, Bulacan': '3023',
    'Marilao, Bulacan': '3019',
    'Bocaue, Bulacan': '3018',
    'Balagtas, Bulacan': '3016',
    'Guiguinto, Bulacan': '3015',
    'Plaridel, Bulacan': '3004',
    'Pulilan, Bulacan': '3005',
    'Bustos, Bulacan': '3007',
    'San Rafael, Bulacan': '3008',
    'San Miguel, Bulacan': '3011',
    'Baliuag, Bulacan': '3006',
    'Calumpit, Bulacan': '3003',
    'Hagonoy, Bulacan': '3002',
    'Paombong, Bulacan': '3001',
    'Obando, Bulacan': '3021',
    'Santa Maria, Bulacan': '3022',
    'Norzagaray, Bulacan': '3013',
    'San Ildefonso, Bulacan': '3010',
    'Angat, Bulacan': '3012',
    'Doña Remedios Trinidad, Bulacan': '3009',
    'Pandi, Bulacan': '3014',
};


// Helper function to get ZIP code from map
export const getZipCode = (municipalityName, provinceName = '') => {
    if (!municipalityName) return '';
    
    // Try with province first (most accurate)
    if (provinceName) {
        const withProvince = `${municipalityName}, ${provinceName}`;
        if (ZIP_CODE_MAP[withProvince]) return ZIP_CODE_MAP[withProvince];

        // Try cleaning "City of" prefix
        if (municipalityName.startsWith('City of ')) {
            const without = municipalityName.replace('City of ', '');
            if (ZIP_CODE_MAP[`${without}, ${provinceName}`]) 
                return ZIP_CODE_MAP[`${without}, ${provinceName}`];
        }
    }

    // Fallback - municipality name lang (para sa NCR at unique names)
    const direct = ZIP_CODE_MAP[`${municipalityName}, ${provinceName}`] 
        || Object.entries(ZIP_CODE_MAP).find(([k]) => k.startsWith(municipalityName + ','))?.[1]
        || '';
    
    return direct;
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
export const AddressDropdowns = ({ addressType, values, onChange, disabled }) => {
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
                                    const zipCode = getZipCode(values.municipality, values.province);

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
            const currentProvince = provinces.find(p => p.code === selectedCodes.provinceCode)?.name || '';
            zipCode = getZipCode(municipalityName, currentProvince);
            
            
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
            // ✅ I-flag kung auto-filled o hindi
            onChange({ target: { name: 'zipAutoFilled', value: !!zipCode } }, addressType);
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


export const FormField = ({ label, name, type, value, onChange, disabled, required = false, zipAutoFilled = false, hasMunicipality = false }) => {
    
    
    // ✅ Special handling for Zip Code (numbers only)
    if (name === 'zipCode') {

        const isDisabled = disabled || zipAutoFilled;

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
                    disabled={isDisabled}
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
export const FormSection = ({ title, fields, values, onChange, disabled, parentType }) => (
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


    const [guardianSameAs, setGuardianSameAs] = useState(() => {
        return sessionStorage.getItem("guardianSameAs") || '';
    });



    const [programs, setPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);


    // Access control check
    useEffect(() => {
        if (!location?.state?.allowed && !location?.state?.isUpdate) {
            navigate("/404_forbidden", { replace: true });
        }
    }, [location, navigate]);

    if (!location?.state?.allowed && !location?.state?.isUpdate) return null;






    useEffect(() => {
        const fetchProgram = async() => {
            try {

                setLoadingPrograms(true);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getActivePrograms`, {
                    method: "GET",
                    credentials: "include"
                });
                const data = await res.json();
                if(!res.ok) throw new Error(data.message);
                setPrograms(data);
                
            } catch (error) {
                console.log("Error: ", error.message);
            } finally {
                setLoadingPrograms(false);
            }
        }

        fetchProgram();
    },[]);

    




    // Load from sessionStorage (runs once)
    useEffect(() => {
        if (hasLoadedData.current) return;
        // ✅ Skip sessionStorage load kung update flow
        if (location?.state?.isUpdate) return;
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
        if (!location?.state?.isUpdate) return;

        const prefill = location?.state?.enrollmentData;
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
            seniorHigh: {
                ...prev.seniorHigh,
                ...(prefill?.seniorHigh || {}),
                semester: prefill?.seniorHigh?.semester ? parseInt(prefill?.seniorHigh?.semester, 10) : ''
            }
        }));

    }, [location?.state?.isUpdate, location?.state?.enrollmentData]);



    


    
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

            if (!formData.gradeLevelToEnroll) return false;
            if (!seniorHigh?.track?.trim() || !seniorHigh?.strand?.trim()) return false;


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
        // ✅ Convert semester to number
        const finalValue = name === 'semester' && value ? parseInt(value, 10) : value;
        
        setFormData(prev => ({
            ...prev,
            seniorHigh: {
                ...prev.seniorHigh,
                [name]: finalValue,
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

            navigate("/enrollment/step3", { 
                state: { 
                    allowed: true,
                    isUpdate: location?.state?.isUpdate || false,
                    enrollmentData: location?.state?.enrollmentData
                }
            });


            return;
        }

        // ✅ If has changes, clear the saved indicator to force re-submit
        if (hasChanges) {
            sessionStorage.removeItem("step2Saved");
        }



        // ✅ Show loading
        setIsLoading(true);

        try {
            // ✅ Ensure semester is a number
            const seniorHighData = {
                ...formData.seniorHigh,
                semester: formData.seniorHigh?.semester ? parseInt(formData.seniorHigh.semester, 10) : ''
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    step: "step2",
                    enrollmentId: enrollmentId,
                    gradeLevelToEnroll: formData.gradeLevelToEnroll,
                    address: JSON.stringify(formData.address),
                    parentGuardianInfo: JSON.stringify(formData.parentGuardianInfo),
                    schoolHistory: JSON.stringify(formData.schoolHistory),
                    seniorHigh: JSON.stringify(seniorHighData),
                    studentType: formData.studentType
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // ✅ Mark step2 as saved
            sessionStorage.setItem("myForm", JSON.stringify(formData));
            sessionStorage.setItem("step2Saved", data.step2);
            sessionStorage.removeItem("guardianSameAs");
            

            window.scrollTo({ top: 0, behavior: "auto" });

            navigate("/enrollment/step3", { 
                state: { 
                    allowed: true,
                    isUpdate: location?.state?.isUpdate || false,
                    enrollmentData: location?.state?.enrollmentData
                }
            });


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




    const handleGuardianSameAs = useCallback((source) => {
        const newSource = guardianSameAs === source ? '' : source;
        setGuardianSameAs(newSource);
        sessionStorage.setItem("guardianSameAs", newSource);

        if (newSource === 'mother') {
            // ✅ Copy mother data + auto-set relationship to "mother"
            const motherData = formData.parentGuardianInfo?.mother;
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    guardian: {
                        lastName: motherData?.lastName || '',
                        firstName: motherData?.firstName || '',
                        middleName: motherData?.middleName || '',
                        contactNumber: motherData?.contactNumber || '',
                        relationship: 'mother'  // ← AUTO-SET
                    }
                }
            }));
        } 
        else if (newSource === 'father') {
            // ✅ Copy father data + auto-set relationship to "father"
            const fatherData = formData.parentGuardianInfo?.father;
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    guardian: {
                        lastName: fatherData?.lastName || '',
                        firstName: fatherData?.firstName || '',
                        middleName: fatherData?.middleName || '',
                        contactNumber: fatherData?.contactNumber || '',
                        relationship: 'father'  // ← AUTO-SET
                    }
                }
            }));
        } 
        else {
            // ✅ Uncheck/Clear all
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    guardian: {
                        lastName: '',
                        firstName: '',
                        middleName: '',
                        contactNumber: '',
                        relationship: '',
                        relationshipOther: ''
                    }
                }
            }));
        }

        setHasChanges(true);
    }, [guardianSameAs, formData.parentGuardianInfo, setFormData]);





    
    return (
        <div className="container bg-light d-flex">
            <div className={`row  justify-content-center w-100 g-0`}
            style={{marginTop: "120px"}}
            >
                <div className="col-12 ">

                    {!viewOnly && (
                        <ProgressStepper currentStep={2} />
                    )}

                    <Reminder/>

                    <div className="p-0 p-md-4">

                        
                        {/* Parent/Guardian Information */}
                        <div className="row justify-content-center">
                            <div className="col-md-8">
                                <div className="card border-0 mb-4">
                                    <div className="card-body">

                                        <h2 className="h5 fw-bold mb-4">PARENT/GUARDIAN INFORMATION</h2>

                                        
                                    <FormSection
                                            title="Father's Information (Optional)"
                                            fields={FORM_FIELDS.parentInfo.map(field => ({
                                                ...field,
                                                required: false,
                                            }))}
                                            values={formData.parentGuardianInfo?.father}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="father"
                                        />

                                        <FormSection
                                            title="Mother's Information (Optional)"
                                            fields={FORM_FIELDS.parentInfo.map(field => ({
                                                ...field,
                                                required: false,
                                            }))}
                                            values={formData.parentGuardianInfo?.mother}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="mother"
                                        />

                                        {/* ✅ Guardian Checkboxes - Same As Mother/Father */}
                                        <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="fw-semibold small mb-3 d-block">Guardian Same as:</label>
                                            <div className="d-flex gap-3">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={guardianSameAs === 'mother'}
                                                        onChange={() => handleGuardianSameAs('mother')}
                                                        disabled={viewOnly}
                                                        id="sameAsMother"
                                                    />
                                                    <label className="form-check-label" htmlFor="sameAsMother">
                                                        Mother
                                                    </label>
                                                </div>
                                                
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={guardianSameAs === 'father'}
                                                        onChange={() => handleGuardianSameAs('father')}
                                                        disabled={viewOnly}
                                                        id="sameAsFather"
                                                    />
                                                    <label className="form-check-label" htmlFor="sameAsFather">
                                                        Father
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <FormSection
                                            title="Guardian's Information"
                                            fields={FORM_FIELDS.parentInfo.map(field => ({
                                                ...field,
                                                required: field.name === 'lastName' || field.name === 'firstName',
                                                optional: field.name === 'middleName' || field.name === 'contactNumber'
                                            }))}
                                            values={formData.parentGuardianInfo?.guardian}
                                            onChange={handleParentGuardianChange}
                                            disabled={viewOnly}
                                            parentType="guardian"
                                        />

                                        {/* Guardian Relationship Dropdown */}
                                        <div className="mb-3">
                                            <label className="form-label small">
                                                Guardian Relationship
                                                <span className="text-danger ms-1">*</span>
                                            </label>
                                            <select
                                                name="relationship"
                                                value={formData.parentGuardianInfo?.guardian?.relationship || ''}
                                                onChange={(e) => handleParentGuardianChange(e, 'guardian')}
                                                className="form-select"
                                                disabled={viewOnly}
                                            >
                                                <option value="">Select Relationship</option>
                                                {guardianSameAs === 'mother' && (
                                                    <option value="mother">Mother</option>
                                                )}
                                                {guardianSameAs === 'father' && (
                                                    <option value="father">Father</option>
                                                )}
                                                {!guardianSameAs && (
                                                    <>
                                                        <option value="mother">Mother</option>
                                                        <option value="father">Father</option>
                                                        <option value="sister">Sister</option>
                                                        <option value="brother">Brother</option>
                                                        <option value="grandmother">Grandmother</option>
                                                        <option value="grandfather">Grandfather</option>
                                                        <option value="aunt">Aunt</option>
                                                        <option value="uncle">Uncle</option>
                                                        <option value="cousin">Cousin</option>
                                                        <option value="godmother">Godmother</option>
                                                        <option value="godfather">Godfather</option>
                                                        <option value="stepmother">Stepmother</option>
                                                        <option value="stepfather">Stepfather</option>
                                                        <option value="adoptive-mother">Adoptive Mother</option>
                                                        <option value="adoptive-father">Adoptive Father</option>
                                                        <option value="others">Others</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        {/* Text Input for Others */}
                                        {!guardianSameAs && formData.parentGuardianInfo?.guardian?.relationship === 'others' && (
                                            <div className="mb-3">
                                                <label className="form-label small">
                                                    Please specify:
                                                    <span className="text-danger ms-1">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="relationshipOther"
                                                    placeholder="e.g., Godmother, Aunt, Step-parent, etc."
                                                    value={formData.parentGuardianInfo?.guardian?.relationshipOther || ''}
                                                    onChange={(e) => handleParentGuardianChange(e, 'guardian')}
                                                    className="form-control"
                                                    disabled={viewOnly}
                                                />
                                            </div>
                                        )}


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
                                            zipAutoFilled={!!formData.address?.current?.zipAutoFilled}
                                            hasMunicipality={!!formData.address?.current?.municipality}
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
                                            zipAutoFilled={!!formData.address?.permanent?.zipAutoFilled}
                                            hasMunicipality={!!formData.address?.permanent?.municipality}
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
                                                    Grade Level to Enroll
                                                    <span className="text-danger ms-1">*</span>
                                                </label>
                                                <select
                                                    name="gradeLevelToEnroll"
                                                    value={formData.gradeLevelToEnroll || ''}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({ ...prev, gradeLevelToEnroll: e.target.value }));
                                                        setHasChanges(true);
                                                    }}
                                                    className="form-select"
                                                    disabled={viewOnly}
                                                >
                                                    <option value="">Select Grade Level</option>
                                                    <option value="Grade 11">Grade 11</option>
                                                    <option value="Grade 12">Grade 12</option>
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
                                                    <option value="">
                                                        {loadingPrograms ? 'Loading tracks...' : 'Select Track'}
                                                    </option>
                                                    {programs.map(p => (
                                                        <option key={p._id} value={p.trackName}>
                                                            {p.trackName}
                                                        </option>
                                                    ))}
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
                                                    {programs
                                                        .find(p => p.trackName === formData.seniorHigh?.track)
                                                        ?.strands
                                                        .filter(s => s.isActive)
                                                        .map(s => (
                                                            <option key={s._id} value={s.strandName}>
                                                                {s.strandName}
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

    const [psaError, setPsaError] = useState('');




    useEffect(() => {
        if (!location?.state?.allowed && !location?.state?.isUpdate) {
            navigate("/404_forbidden", { replace: true });
        }
    }, [location, navigate]);

    if(!location?.state?.allowed && !location?.state?.isUpdate) return;





    if(!location?.state?.allowed) return;

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
                    psaNo: ''
                }
            }));
        }
    }, []);

    
    
    useEffect(() => {
        if (location?.state?.isUpdate) return; // ✅ skip
        const saved = localStorage.getItem("myForm");
        if (saved) {
            setFormData(JSON.parse(saved));
        }
    },[]);



    // ✅ Prefill existing documents para sa update flow
    useEffect(() => {
        if (!location?.state?.isUpdate) return;

        const prefill = location?.state?.enrollmentData;
        if (!prefill) return;

        const getFilePreviewUrl = (filePath) => {
            if (!filePath) return null;
            if (filePath.startsWith("data:") || filePath.startsWith("http")) return filePath;
            const normalized = filePath.replace(/\\/g, "/");
            return `${import.meta.env.VITE_API_URL}/api/${normalized}`;
        };

        setFormData(prev => ({
            ...prev,
            certification: {
                ...prev.certification,
                psaBirthCertFile: prefill.requiredDocuments?.psaBirthCert?.filePath || null,
                psaBirthCertFileName: prefill.requiredDocuments?.psaBirthCert?.filePath?.split("/").pop() || '',
                psaBirthCertPreview: getFilePreviewUrl(prefill.requiredDocuments?.psaBirthCert?.filePath),

                reportCardFile: prefill.requiredDocuments?.reportCard?.filePath || null,
                reportCardFileName: prefill.requiredDocuments?.reportCard?.filePath?.split("/").pop() || '',
                reportCardPreview: getFilePreviewUrl(prefill.requiredDocuments?.reportCard?.filePath),

                goodMoralFile: prefill.requiredDocuments?.goodMoral?.filePath || null,
                goodMoralFileName: prefill.requiredDocuments?.goodMoral?.filePath?.split("/").pop() || '',
                goodMoralPreview: getFilePreviewUrl(prefill.requiredDocuments?.goodMoral?.filePath),

                idPictureFile: prefill.requiredDocuments?.idPicture?.filePath || null,
                idPictureFileName: prefill.requiredDocuments?.idPicture?.filePath?.split("/").pop() || '',
                idPicturePreview: getFilePreviewUrl(prefill.requiredDocuments?.idPicture?.filePath),

                psaNo: prefill.psaNo || ''
            }
        }));
    }, [location?.state?.isUpdate, location?.state?.enrollmentData]);





    const checkPreferredAndCert = () => {
        const r = formData;
        if (!r.certification) return false;
        const c = r.certification;
        const hasPsaBirthCert = (c.psaBirthCertFile instanceof File) || c.psaBirthCertPreview;
        const hasReportCard = (c.reportCardFile instanceof File) || c.reportCardPreview;
        const hasIdPicture = (c.idPictureFile instanceof File) || c.idPicturePreview;
        if (!hasPsaBirthCert || !hasReportCard || !hasIdPicture) return false;
        return true;
    };

    useLayoutEffect(() => {
        setAllField(checkPreferredAndCert());
    }, [formData]);

    const [showModal, setShowModal] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState(null);

    const handleCertificationChange = (e) => {
        const { name, value } = e.target;
        
        // ✅ PSA No. validation - allow letters, digits and hyphens
        if (name === 'psaNo') {
            // Allow only alphanumeric and hyphens
            const cleanedValue = value.replace(/[^a-zA-Z0-9\-]/g, '');
            // Get only alphanumeric count (for validation)
            const alphanumericCount = cleanedValue.replace(/\D/g, '').length;
            
            // Update PSA error message (only if not empty since it's optional)
            if (cleanedValue.length > 0 && cleanedValue.length < 13) {
                setPsaError('PSA Birth Certificate No. must be at least 13 characters.');
            } else {
                setPsaError('');
            }
                        
            setFormData(prev => ({
                ...prev,
                certification: {
                    ...prev.certification,
                    [name]: cleanedValue
                }
            }));
            return;
        }
        
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

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
            alert('Only JPG and PNG files are allowed!');
            e.target.value = '';
            return;
        }
        
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: file.type
            };
            const compressedBlob = await imageCompression(file, options);
            const compressedFile = new File([compressedBlob], file.name, {
                type: compressedBlob.type,
                lastModified: Date.now()
            });
            const previewUrl = URL.createObjectURL(compressedFile);
            
            setFormData(prev => ({
                ...prev,
                certification: {
                    ...prev.certification,
                    [`${fieldName}File`]: compressedFile,
                    [`${fieldName}FileName`]: file.name,
                    [`${fieldName}Preview`]: previewUrl
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
        if (inputRef) inputRef.value = "";

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
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('step', 'step3');
            
            const enrollmentId = sessionStorage.getItem('enrollmentId');
            if (!enrollmentId) throw new Error('Enrollment ID not found. Please start from Step 1.');
            submitData.append('enrollmentId', enrollmentId);

            const fileFields = ['psaBirthCert', 'reportCard', 'idPicture', 'goodMoral'];
            fileFields.forEach(fieldName => {
                const file = formData.certification?.[`${fieldName}File`];
                if (file instanceof File) {
                    submitData.append(`${fieldName}File`, file);
                }
            });

            // ✅ Append PSA No. to submitData
            if (formData.certification?.psaNo) {
                submitData.append('psaNo', formData.certification.psaNo.trim());
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollment`, {
                method: "POST",
                credentials: "include",
                body: submitData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit enrollment');

            if(data.success) {
                setFormData({});
                sessionStorage.clear();
                setSuccessModal(true);
                setIsSubmitting(false); 
                return;
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
        } else {
            document.getElementById("scrollContainer").scrollTo({ top: 0, behavior: "auto" });
        }
        navigate(-1, { state: { allowed: true }});
    };

    // ✅ Reusable file preview card (Google Classroom style)
    const FilePreviewCard = ({ fieldName, preview, fileName }) => {
        if (!preview) return null;
        return (
            <div
                className="d-flex align-items-center gap-2 mt-2 p-2 border rounded"
                style={{ maxWidth: '320px', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                onClick={() => handleViewImage(preview)}
            >
                {/* Mini thumbnail */}
                <img
                    src={preview}
                    alt={fileName}
                    style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flexShrink: 0,
                        border: '1px solid #dee2e6'
                    }}
                />
                {/* Filename + hint */}
                <div className="d-flex flex-column overflow-hidden flex-grow-1">
                    <span
                        className="fw-semibold text-truncate text-dark"
                        style={{ fontSize: '0.8rem' }}
                        title={fileName}
                    >
                        {fileName}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        🔍 Click to view
                    </span>
                </div>
                {/* Remove button - only for applicants (no role) */}
                {!role && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0 p-1"
                        style={{ flexShrink: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(fieldName);
                        }}
                        title="Remove file"
                    >
                        <i className="fa fa-times"></i>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="container bg-light d-flex">
            <div className="row justify-content-center w-100 g-0" style={{marginTop: "120px"}}>
                <div className="col-12 col-md-12 col-lg-12">

                    {!viewOnly && (
                        <ProgressStepper currentStep={3} />
                    )}

                    <Reminder/>
                    
                    <div className="p-0 p-md-4">
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
                                            <div className="col-md-12">
                                                <h3 className="h6 fw-semibold mb-3">Upload Required Documents</h3>
                                                
                                                {/* PSA Birth Certificate */}
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        PSA BIRTH CERTIFICATE
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>(JPG, PNG only)</span>
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
                                                    <FilePreviewCard
                                                        fieldName="psaBirthCert"
                                                        preview={formData.certification?.psaBirthCertPreview}
                                                        fileName={formData.certification?.psaBirthCertFileName}
                                                    />
                                                </div>

                                                {/* Report Card (Form 138) */}
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        REPORT CARD (FORM 138)
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>(JPG, PNG only)</span>
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
                                                    <FilePreviewCard
                                                        fieldName="reportCard"
                                                        preview={formData.certification?.reportCardPreview}
                                                        fileName={formData.certification?.reportCardFileName}
                                                    />
                                                </div>

                                                {/* Good Moral */}
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        GOOD MORAL
                                                        <small className="text-muted ms-2">(optional)</small>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>(JPG, PNG only)</span>
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
                                                    <FilePreviewCard
                                                        fieldName="goodMoral"
                                                        preview={formData.certification?.goodMoralPreview}
                                                        fileName={formData.certification?.goodMoralFileName}
                                                    />
                                                </div>

                                                {/* 2x2 ID Picture */}
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        2X2 ID PICTURE
                                                        <span className="text-danger ms-1">*</span>
                                                        <span className="text-danger ms-2" style={{ fontSize: '0.85rem' }}>(JPG, PNG only)</span>
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
                                                    <FilePreviewCard
                                                        fieldName="idPicture"
                                                        preview={formData.certification?.idPicturePreview}
                                                        fileName={formData.certification?.idPictureFileName}
                                                    />
                                                </div>

                                                {/* PSA Birth Certificate No. */}
                                                <div className="mb-4">
                                                    <label className="form-label small fw-semibold text-muted">
                                                        PSA BIRTH CERTIFICATE NO.
                                                        <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>(e.g., A123456-789012 or leave empty)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="psaNo"
                                                        value={formData.certification?.psaNo || ''}
                                                        onChange={handleCertificationChange}
                                                        className={`form-control ${psaError ? 'is-invalid' : ''}`}
                                                        disabled={viewOnly}
                                                        placeholder="e.g., A123456-789012"
                                                        maxLength="13"
                                                        pattern="[a-zA-Z0-9\-]*"
                                                    />
                                                    {psaError && <div className="invalid-feedback d-block">{psaError}</div>}
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

            {/* Approve Modal */}
            {approveModal?.isShow && approveModal?.data && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">Approve Applicant</h5>
                                <button type="button" className="btn-close" onClick={() => setApproveShowModal(false)}></button>
                            </div>
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
                                <button type="button" className="btn btn-secondary" onClick={() => setApproveShowModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={async () => {
                                        setApproveShowModal((prev) => ({...prev, isShow: false, data: prev.data}));
                                        try {
                                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                                                method: "PATCH",
                                                headers: {"Content-Type": "application/json"},
                                                body: JSON.stringify({ enrollmentId: approveModal?.data._id }),
                                                credentials: "include",
                                            });
                                            const data = await res.json();
                                            if(!res.ok) throw new Error(data.message);
                                            alert(data.message);
                                            document.getElementById("scrollContainer").scrollTo({ top: 0, behavior: "smooth" });
                                            navigate(`/${role}/applicants`, { replace: true });
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
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body text-center">
                                {previewImage && (
                                    <img 
                                        src={previewImage} 
                                        alt="Preview" 
                                        className="img-fluid"
                                        style={{ maxHeight: '500px' }}
                                    />
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center py-5">
                                <div className="mb-4">
                                    <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h4 className="fw-bold mb-3">Admission Successful!</h4>
                                <p className="text-muted mb-4">
                                    Please wait for admin approval. Please check your email for validation.
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
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center py-5">
                                <div className="mb-4">
                                    <i className="fa-solid fa-circle-xmark text-danger" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h4 className="fw-bold mb-3">Submission Failed</h4>
                                <p className="text-muted mb-4">{errorModal.message}</p>
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-5"
                                    onClick={() => setErrorModal({ isShow: false, message: '' })}
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
                        <div className="modal-header bg-red text-white" style={{ borderRadius: 0 }}>
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
                            <section className="mb-4 ">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-check-circle me-2"></i>
                                    1. Enrollment Agreement
                                </h6>
                                <div className="ms-4">

                                <p className="small mb-1">I certify that all information provided in this enrollment form is true and accurate.</p>
                                <p className="small mb-1">I confirm that my Learner Reference Number (LRN) is valid and registered under my name.</p>
                                <p className="small mb-1">I confirm that the Gmail address I provided is active and will be used to receive school notifications and announcements.</p>
                                <p className="small mb-1">I understand that any false information may result in the cancellation of my enrollment.</p>
                                <p className="small mb-1">I agree to comply with all school policies and regulations.</p>
                                <p className="small mb-0">I acknowledge that the school has the right to modify policies as necessary.</p>
                                </div>

                            
                            </section>

                            {/* 3. School Rules and Discipline */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-school me-2"></i>
                                    2. School Rules and Discipline
                                </h6>
                                <div className="ms-4">

                                <p className="small mb-1"><strong>Student Handbook:</strong> All students must comply with the rules stated in the Student Handbook.</p>
                                <p className="small mb-1"><strong>Dress Code:</strong> Proper school uniform must be worn and maintained according to school policy.</p>
                                <p className="small mb-1"><strong>Behavior Policy:</strong> Good conduct and respect toward fellow students, teachers, and school staff are expected.</p>
                                <p className="small mb-1"><strong>Prohibited Items:</strong> Bringing prohibited items such as weapons, drugs, or any dangerous materials is strictly forbidden.</p>
                                <p className="small mb-0"><strong>Sanctions:</strong> Violation of school policies will result in appropriate disciplinary action ranging from warnings to suspension or dismissal.</p>
                                </div>

                            
                            </section>

                            {/* 6. Data Privacy Consent */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-shield-halved me-2"></i>
                                    3. Data Privacy Consent
                                </h6>
                                <div className="ms-4">

                                <p className="small mb-2">
                                    In accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>:
                                </p>
                                <p className="small mb-1"><strong>Data Collection:</strong> The school collects personal information such as name, address, contact details, and academic records.</p>
                                <p className="small mb-1"><strong>Purpose:</strong> This information will be used solely for enrollment, student records, academic purposes, and official school communications.</p>
                                <p className="small mb-1"><strong>Protection:</strong> All personal data is securely stored and protected against unauthorized access.</p>
                                <p className="small mb-1"><strong>Sharing:</strong> Your information will not be shared with third parties unless required by law or with your consent.</p>
                                <p className="small mb-0"><strong>Rights:</strong> You have the right to access, correct, or request deletion of your personal data.</p>
                                </div>
                            </section>



                            {/* 9. Liability / Safety Clause */}
                            <section className="mb-4">
                                <h6 className="fw-bold text-danger">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    4. Liability and Safety Clause
                                </h6>
                                <div className="ms-4">

                                <p className="small mb-1"><strong>Lost Items:</strong> The school is not liable for lost or damaged personal belongings of students.</p>
                                <p className="small mb-1"><strong>Accidents/Injuries:</strong> While the school strives to maintain a safe environment, we are not liable for accidents unless directly caused by school negligence.</p>
                                <p className="small mb-1"><strong>Health and Safety:</strong></p>
                                <p className="small mb-1 ms-3">Students must comply with school health protocols</p>
                                <p className="small mb-1 ms-3">Report immediately if experiencing symptoms of illness</p>
                                <p className="small mb-1 ms-3">Students with contagious diseases are not allowed on campus</p>
                                <p className="small mb-1"><strong>Emergency Contact:</strong> Emergency contact information must be kept current in school records.</p>
                                <p className="small mb-0"><strong>Valuables:</strong> Avoid bringing valuable items to school. If necessary, they are brought at the student's own risk.</p>
                                </div>
                            
                            </section>
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
                                    className="btn btn-secondary btn-sm " 
                                    onClick={onClose}
                                >
                                    <i className="fa-solid fa-times me-2"></i>
                                    Decline
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm" 
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


