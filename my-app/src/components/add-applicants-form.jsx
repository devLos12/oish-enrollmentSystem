import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { globalContext } from "../context/global";
import imageCompression from 'browser-image-compression';
import { ZIP_CODE_MAP, getZipCode, AddressDropdowns, FormField, FormSection, FORM_FIELDS } 
from "../pages/enrollmentForm";





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



// ═══════════════════════════════════════════════════════════════
// PROGRESS STEPPER
// ═══════════════════════════════════════════════════════════════
const ProgressStepper = ({ currentStep }) => {
    const steps = [
        { number: 1, label: 'Student\nInformation' },
        { number: 2, label: 'Address & Parents' },
        { number: 3, label: 'Documents' }
    ];
    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between position-relative">
                {steps.map((step, index) => (
                    <div key={step.number} className="d-flex flex-column align-items-center position-relative" style={{ flex: 1 }}>
                        {index < steps.length - 1 && (
                            <div className="position-absolute" style={{
                                height: '3px', width: 'calc(100% - 42px)',
                                top: '20px', left: 'calc(50% + 21px)',
                                backgroundColor: currentStep > step.number ? '#198754' : '#d6d6d6',
                                transition: 'background-color 0.4s ease', zIndex: 0
                            }} />
                        )}
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold position-relative
                                ${currentStep >= step.number ? 'bg-success text-white' : 'bg-white border border-2 text-secondary'}`}
                            style={{ width: '42px', height: '42px', fontSize: '1rem', transition: 'all 0.3s ease', borderColor: currentStep >= step.number ? '#198754' : '#6c757d', zIndex: 1 }}
                        >
                            {step.number}
                        </div>
                        <div
                            className={`mt-2 text-center small fw-semibold ${currentStep >= step.number ? 'text-success' : 'text-secondary'}`}
                            style={{ maxWidth: '100px', lineHeight: '1.2', whiteSpace: 'pre-line', fontSize: '0.7rem' }}
                        >
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════
// STEP 1 COMPONENT
// ═══════════════════════════════════════════════════════════════
const AddApplicantStep1 = ({
    formData,
    setFormData,
    emailVerify,
    emailError, setEmailError,
    emailValid, setEmailValid,
    lrnError,   setLrnError,
    fourPsError, setFourPsError,
    currentApplicantId, 
}) => {

    // ── Static data ────────────────────────────────────────────────────────────
    const indigenousPeopleOptions = [
        'Aeta','Agta','Ati','Badjao','Bagobo','Banwaon','Bontoc','Bukidnon','Dumagat','Gaddang',
        'Higaonon','Ibaloi','Ifugao','Igorot','Ilongot','Isneg','Kalinga','Kankanaey','Lumad',
        'Maguindanao','Mangyan','Manobo','Maranao','Subanon','Tagbanwa','Tausug','Teduray',
        'Tingguian',"T'boli",'Yakan',
    ];

    const learnerFields = [
        { label: 'First Name',                                    name: 'firstName',     type: 'text' },
        { label: 'Middle Name',                                   name: 'middleName',    type: 'text', optional: true },
        { label: 'Last Name',                                     name: 'lastName',      type: 'text' },
        { label: 'Extension Name e.g. Jr., III (if applicable)', name: 'extensionName', type: 'text', optional: true },
        { label: 'Email Address',                                 name: 'email',         type: 'email' },
        { label: 'Learner Reference No.',                         name: 'lrn',           type: 'text' },
    ];

    const rightFields = [
        { label: 'Birthdate (Day/Month/Year)',                     name: 'birthDate',    type: 'date',   colClass: 'col-md-6' },
        { label: 'Place of Birth (Municipality/City)',             name: 'placeOfBirth', type: 'text',   colClass: 'col-md-6' },
        { label: 'Age',                                            name: 'age',          type: 'number', colClass: 'col-md-6 mt-2' },
        { label: 'Mother Tongue (e.g., Tagalog, Bisaya, Ilocano)',name: 'motherTongue', type: 'text',   colClass: 'col-md-6 mt-2' }
    ];

    const conditionalSections = [
        {
            label: 'Belonging to any Indigenous Peoples (IP) Community/Indigenous Cultural Community?',
            path: 'indigenousCommunity', radioName: 'isMember',
            inputLabel: 'If Yes, pls specify:', inputName: 'name', inputPlaceholder: 'Enter'
        },
        {
            label: 'Is your family a beneficiary of 4Ps?',
            path: 'fourPs', radioName: 'isBeneficiary',
            inputLabel: 'If Yes, write the 4Ps Household ID Number below',
            inputName: 'householdId', inputPlaceholder: 'Enter'
        }
    ];

    const disabilityTypes = [
        { column: 1, items: [
            { id: 'visualImpairment', label: 'Visual Impairment',
              subOptions: [{ id: 'blind', label: 'a. blind' }, { id: 'lowVision', label: 'b. low vision' }] },
            { id: 'multipleDisorder', label: 'Multiple Disorder', value: 'Multiple Disorder' }
        ]},
        { column: 2, items: [
            { id: 'hearingImpairment', label: 'Hearing Impairment',       value: 'Hearing Impairment' },
            { id: 'autismSpectrum',    label: 'Autism Spectrum Disorder', value: 'Autism Spectrum Disorder' },
            { id: 'speechLanguage',    label: 'Speech/Language Disorder', value: 'Speech/Language Disorder' }
        ]},
        { column: 3, items: [
            { id: 'learningDisability',  label: 'Learning Disability',           value: 'Learning Disability' },
            { id: 'emotionalBehavioral', label: 'Emotional-Behavioral Disorder', value: 'Emotional-Behavioral Disorder' },
            { id: 'cerebralPalsy',       label: 'Cerebral Palsy',                value: 'Cerebral Palsy' }
        ]},
        { column: 4, items: [
            { id: 'intellectualDisability', label: 'Intellectual Disability',      value: 'Intellectual Disability' },
            { id: 'orthopedicPhysical',     label: 'Orthopedic/Physical Handicap', value: 'Orthopedic/Physical Handicap' },
            { id: 'specialHealth', label: 'Special Health Problem/Chronic Disease',
              subOptions: [{ id: 'cancer', label: 'a. Cancer' }] }
        ]}
    ];

    const maxDate = '2012-12-31';

    // ── Helpers ────────────────────────────────────────────────────────────────
    const removeNumbersAndSpecialChars = (v) => v.replace(/[^a-zA-Z\s\-']/g, '');

    // ── handleChange — EXACT SAME LOGIC AS enrollmentForm Step1 ───────────────
    const handleChange = (e, path) => {
        const { name, value } = e.target;

        if (path) {
            if (path === 'learnerWithDisability' && name === 'isDisabled') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        learnerWithDisability: {
                            isDisabled: value,
                            disabilityType: value === 'No' ? [] : prev.learnerInfo?.learnerWithDisability?.disabilityType
                        }
                    }
                }));
                return;
            }
            if (path === 'indigenousCommunity' && name === 'isMember') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        indigenousCommunity: {
                            isMember: value,
                            name: value === 'No' ? '' : prev.learnerInfo?.indigenousCommunity?.name
                        }
                    }
                }));
                return;
            }
            if (path === 'fourPs' && name === 'isBeneficiary') {
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: {
                        ...prev.learnerInfo,
                        fourPs: {
                            isBeneficiary: value,
                            householdId: value === 'No' ? '' : prev.learnerInfo?.fourPs?.householdId
                        }
                    }
                }));
                return;
            }
            if (path === 'fourPs' && name === 'householdId') {
                const num = value.replace(/\D/g, '').slice(0, 12);
                setFourPsError(num.length > 0 && num.length < 12 ? '4Ps Household ID must be exactly 12 digits' : '');
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: { ...prev.learnerInfo, fourPs: { ...prev.learnerInfo.fourPs, householdId: num } }
                }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                learnerInfo: { ...prev.learnerInfo, [path]: { ...prev.learnerInfo[path], [name]: value } }
            }));

        } else if (name.startsWith('learnerInfo.')) {
            const fieldName = name.split('.')[1];

            if (fieldName === 'email') {
                const v2 = value.toLowerCase().trim();

                const dup = emailVerify.some(e => 
                    e.learnerInfo?.email.toLowerCase() === v2 
                );

                setEmailError(dup ? 'Email already exists' : '');
                setEmailValid(!dup && v2.length > 0);
                setFormData(prev => ({ ...prev, learnerInfo: { ...prev.learnerInfo, email: value } }));
                return;
            }
            if (fieldName === 'lrn') {
                const num = value.replace(/\D/g, '').slice(0, 12);
                setLrnError(num.length > 0 && num.length < 12 ? 'LRN must be exactly 12 digits' : '');
                setFormData(prev => ({ ...prev, learnerInfo: { ...prev.learnerInfo, lrn: num } }));
                return;
            }
            if (fieldName === 'birthDate' && value) {
                const [yr, mo, dy] = value.split('-').map(Number);
                if (yr > 2012) return;
                const bd = new Date(yr, mo - 1, dy);
                const today = new Date();
                let age = today.getFullYear() - bd.getFullYear();
                const md = today.getMonth() - bd.getMonth();
                if (md < 0 || (md === 0 && today.getDate() < bd.getDate())) age--;
                setFormData(prev => ({
                    ...prev,
                    learnerInfo: { ...prev.learnerInfo, birthDate: value, age: age >= 0 ? age.toString() : '0' }
                }));
                return;
            }
            const textOnly = ['lastName','firstName','middleName','placeOfBirth','motherTongue'];
            const final = textOnly.includes(fieldName) ? removeNumbersAndSpecialChars(value) : value;
            setFormData(prev => ({ ...prev, learnerInfo: { ...prev.learnerInfo, [fieldName]: final } }));

        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // ── Disability handlers — EXACT SAME AS enrollmentForm ────────────────────
    const handleDisabilityCheckbox = (e) => {
        const { value, checked, id } = e.target;
        setFormData(prev => {
            let cur = [...(prev.learnerInfo.learnerWithDisability.disabilityType || [])];

            if (id === 'visualImpairment') {
                cur = checked
                    ? (cur.some(d => d.startsWith('Visual Impairment')) ? cur : [...cur, 'Visual Impairment'])
                    : cur.filter(d => !d.startsWith('Visual Impairment'));

            } else if (id === 'blind' || id === 'lowVision') {
                const sp  = id === 'blind' ? 'blind' : 'low vision';
                const idx = cur.findIndex(d => d.startsWith('Visual Impairment'));
                if (checked) {
                    if (idx === -1) { cur.push(`Visual Impairment: ${sp}`); }
                    else {
                        const c = cur[idx];
                        if (c === 'Visual Impairment') { cur[idx] = `Visual Impairment: ${sp}`; }
                        else { const sps = c.split(': ')[1].split(', '); if (!sps.includes(sp)) { sps.push(sp); cur[idx] = `Visual Impairment: ${sps.join(', ')}`; } }
                    }
                } else if (idx !== -1) {
                    const c = cur[idx];
                    if (c.includes(':')) { const sps = c.split(': ')[1].split(', ').filter(s => s !== sp); cur[idx] = sps.length > 0 ? `Visual Impairment: ${sps.join(', ')}` : 'Visual Impairment'; }
                }

            } else if (id === 'specialHealth') {
                cur = checked
                    ? (cur.some(d => d.startsWith('Special Health Problem')) ? cur : [...cur, 'Special Health Problem/Chronic Disease'])
                    : cur.filter(d => !d.startsWith('Special Health Problem'));

            } else if (id === 'cancer') {
                const idx = cur.findIndex(d => d.startsWith('Special Health Problem'));
                if (checked) {
                    if (idx === -1) { cur.push('Special Health Problem/Chronic Disease: Cancer'); }
                    else {
                        const c = cur[idx];
                        if (c === 'Special Health Problem/Chronic Disease') { cur[idx] = 'Special Health Problem/Chronic Disease: Cancer'; }
                        else if (!c.includes('Cancer')) { const sps = c.split(': ')[1].split(', '); sps.push('Cancer'); cur[idx] = `Special Health Problem/Chronic Disease: ${sps.join(', ')}`; }
                    }
                } else if (idx !== -1) {
                    const c = cur[idx];
                    if (c.includes(':')) { const sps = c.split(': ')[1].split(', ').filter(s => s !== 'Cancer'); cur[idx] = sps.length > 0 ? `Special Health Problem/Chronic Disease: ${sps.join(', ')}` : 'Special Health Problem/Chronic Disease'; }
                }
            } else {
                cur = checked ? [...cur, value] : cur.filter(d => d !== value);
            }

            return { ...prev, learnerInfo: { ...prev.learnerInfo, learnerWithDisability: { ...prev.learnerInfo.learnerWithDisability, disabilityType: cur } } };
        });
    };

    const isDisabilityChecked = (id, specific = null) => {
        const d = formData.learnerInfo?.learnerWithDisability?.disabilityType || [];
        if (specific)                return d.some(x => x.includes(specific));
        if (id === 'visualImpairment') return d.some(x => x.startsWith('Visual Impairment'));
        if (id === 'specialHealth')    return d.some(x => x.startsWith('Special Health Problem'));
        return d.includes(id);
    };

    // ── Render helpers — EXACT SAME AS enrollmentForm Step1 ───────────────────
    const renderTextField = (field) => {
        if (field.name === 'lrn') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label} <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text" name="learnerInfo.lrn"
                        value={formData?.learnerInfo?.lrn || ''}
                        onChange={handleChange}
                        className={`form-control ${lrnError ? 'is-invalid' : ''}`}
                        maxLength="12" placeholder="Enter 12-digit LRN"
                    />
                    {lrnError && <div className="invalid-feedback d-block">{lrnError}</div>}
                </div>
            );
        }

        if (field.name === 'extensionName') {
            return (
                <div key={field.name} className="mb-3">
                    <label className="form-label small">
                        {field.label} {field.optional && <span className="text-muted ms-2">(Optional)</span>}
                    </label>
                    <input
                        type="text" name="learnerInfo.extensionName"
                        value={formData?.learnerInfo?.extensionName || ''}
                        onChange={handleChange} className="form-control"
                        placeholder="e.g. Jr., Sr., II, III" maxLength={10}
                    />
                </div>
            );
        }

        return (
            <div key={field.name} className="mb-3">
                <label className="form-label small">
                    {field.label}
                    {!field.optional && <span className="text-danger ms-1">*</span>}
                    {field.optional  && <span className="text-muted ms-2">(Optional)</span>}
                </label>
                <input
                    type={field.type}
                    name={`learnerInfo.${field.name}`}
                    placeholder={field.placeholder}
                    value={formData?.learnerInfo?.[field.name] || ''}
                    onChange={handleChange}
                    className={`form-control ${
                        field.name === 'email' && emailError ? 'is-invalid' :
                        field.name === 'email' && emailValid ? 'is-valid'   : ''
                    }`}
                />
                {field.name === 'email' && emailError && (
                    <div className="text-danger d-block mt-1" style={{ fontSize: '0.875rem' }}>
                        <i className="fa-solid fa-circle-xmark me-1"></i>{emailError}
                    </div>
                )}
                {field.name === 'email' && emailValid && (
                    <div className="text-success d-block mt-1" style={{ fontSize: '0.875rem' }}>
                        <i className="fa-solid fa-circle-check me-1"></i>Email is available
                    </div>
                )}
            </div>
        );
    };

    const renderRadioGroup = (group, path = null) => {
        const val = path ? formData?.learnerInfo?.[path]?.[group.name] : formData?.[group.name];
        return (
            <div className="mb-3" key={group.name}>
                <label className="fw-semibold d-block mb-2 w-100">
                    {group.label}
                    {group.name === 'isReturning' && <span className="text-danger ms-1">*</span>}
                </label>
                {group.options.map(opt => (
                    <div className="form-check form-check-inline" key={opt}>
                        <input
                            className="form-check-input" type="radio"
                            name={group.name} value={opt}
                            checked={val === opt}
                            onChange={(e) => path ? handleChange(e, path) : handleChange(e)}
                            id={`add_${group.name}_${opt}`}
                        />
                        <label className="form-check-label" htmlFor={`add_${group.name}_${opt}`}>{opt}</label>
                    </div>
                ))}
            </div>
        );
    };

    const renderConditionalSection = (section) => {
        const isMember = formData?.learnerInfo?.[section.path]?.[section.radioName];
        const isIP     = section.path === 'indigenousCommunity';
        const is4Ps    = section.path === 'fourPs';

        return (
            <div className="mb-3" key={section.path}>
                <label className="form-label small">
                    {section.label} <span className="text-danger">*</span>
                </label>
                <div className="mb-2">
                    {renderRadioGroup({ name: section.radioName, options: ['Yes', 'No'], label: '' }, section.path)}
                </div>
                <label className="form-label small">{section.inputLabel}</label>
                {isIP ? (
                    <select
                        name={section.inputName}
                        value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                        onChange={(e) => handleChange(e, section.path)}
                        className="form-select"
                        disabled={isMember !== 'Yes'}
                    >
                        <option value="">Select Indigenous Group</option>
                        {indigenousPeopleOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                ) : is4Ps ? (
                    <>
                        <input
                            type="text" name={section.inputName}
                            placeholder="Enter 12-digit Household ID"
                            value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                            onChange={(e) => handleChange(e, section.path)}
                            className={`form-control ${fourPsError ? 'is-invalid' : ''}`}
                            disabled={isMember !== 'Yes'} maxLength="12"
                        />
                        {fourPsError && <div className="invalid-feedback d-block">{fourPsError}</div>}
                    </>
                ) : (
                    <input
                        type="text" name={section.inputName}
                        placeholder={section.inputPlaceholder}
                        value={formData?.learnerInfo?.[section.path]?.[section.inputName] || ''}
                        onChange={(e) => handleChange(e, section.path)}
                        className="form-control" disabled={isMember !== 'Yes'}
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
                            className="form-check-input" type="checkbox"
                            value={item.value || item.label} id={`add_${item.id}`}
                            onChange={handleDisabilityCheckbox}
                            checked={isDisabilityChecked(item.id)}
                        />
                        <label className="form-check-label" htmlFor={`add_${item.id}`}>{item.label}</label>
                    </div>
                    <div className="ms-4">
                        {item.subOptions.map(sub => (
                            <div className="form-check" key={sub.id}>
                                <input
                                    className="form-check-input" type="checkbox"
                                    value={sub.value || sub.label} id={`add_${sub.id}`}
                                    onChange={handleDisabilityCheckbox}
                                    checked={isDisabilityChecked(null,
                                        sub.label.includes('blind')      ? 'blind'     :
                                        sub.label.includes('low vision') ? 'low vision': 'Cancer'
                                    )}
                                />
                                <label className="form-check-label" htmlFor={`add_${sub.id}`}>{sub.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="form-check mb-2" key={item.id}>
                <input
                    className="form-check-input" type="checkbox"
                    value={item.value} id={`add_${item.id}`}
                    onChange={handleDisabilityCheckbox}
                    checked={isDisabilityChecked(item.value)}
                />
                <label className="form-check-label" htmlFor={`add_${item.id}`}>{item.label}</label>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Student Information card (mirrors enrollmentForm left column) ── */}
            <div className="card border-0">
                <div className="card-body px-0">
                    <h2 className="h5 fw-bold mb-4">STUDENT INFORMATION</h2>
                    {learnerFields.map(field => renderTextField(field))}
                </div>
            </div>

            {/* ── Right-field group: Birthdate, Place, Age, Tongue + Sex + Conditionals ── */}
            <div className="card border-0">
                <div className="card-body px-0">
                    <div className="row mb-3">
                        {rightFields.map(field => (
                            <div key={field.name} className={field.colClass}>
                                <label className="form-label small">
                                    {field.label} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type={field.type}
                                    name={`learnerInfo.${field.name}`}
                                    value={formData?.learnerInfo?.[field.name] || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                    disabled={field.name === 'age'}
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
                            Sex <span className="text-danger">*</span>
                        </label>
                        {['Male', 'Female'].map(sex => (
                            <div className="form-check form-check-inline" key={sex}>
                                <input
                                    className="form-check-input" type="radio"
                                    name="learnerInfo.sex" value={sex}
                                    checked={formData?.learnerInfo?.sex === sex}
                                    onChange={handleChange} id={`add_sex_${sex}`}
                                />
                                <label className="form-check-label" htmlFor={`add_sex_${sex}`}>{sex}</label>
                            </div>
                        ))}
                    </div>

                    {/* Indigenous + 4Ps */}
                    {conditionalSections.map(section => renderConditionalSection(section))}
                </div>
            </div>

            {/* ── Returning Learner card ─────────────────────────────────────── */}
            <div className="card border-0">
                <div className="card-body px-0">
                    <p className="mb-3">Select the appropriate circle only</p>
                    {renderRadioGroup({ label: '2. Returning (Balik-Aral)', name: 'isReturning', options: ['Yes', 'No'] })}
                </div>
            </div>

            {/* ── Learner with Disability card ───────────────────────────────── */}
            <div className="card border-0">
                <div className="card-body px-0">
                    <label className="form-label small fw-semibold">
                        Is the child a Learner with Disability? <span className="text-danger">*</span>
                    </label>
                    {renderRadioGroup({ name: 'isDisabled', options: ['Yes', 'No'], label: '' }, 'learnerWithDisability')}
                    {formData?.learnerInfo?.learnerWithDisability?.isDisabled === 'Yes' && (
                        <>
                            <label className="form-label small fw-semibold mb-3">
                                If Yes, specify the type of disability:
                            </label>
                            <div className="row">
                                {disabilityTypes.map(col => (
                                    <div className="col-md-6" key={col.column}>
                                        {col.items.map(item => renderDisabilityCheckbox(item))}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};





const AddApplicantStep2 = ({
    formData,
    setFormData,
    programs,
    loadingPrograms,
    hasAutoFilled,     setHasAutoFilled,
    guardianSameAs,
    handleGuardianSameAs,
}) => {
 
    // ── Auto-fill permanent address (same logic as Step2) ─────────────────────
    useEffect(() => {
        if (!formData.address?.permanent?.sameAsCurrent || !formData.address?.current || hasAutoFilled) {
            if (!formData.address?.permanent?.sameAsCurrent) setHasAutoFilled(false);
            return;
        }
        setHasAutoFilled(true);
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                permanent: {
                    ...prev.address.permanent,
                    sameAsCurrent: true,
                    houseNo:      prev.address.current.houseNo      || '',
                    street:       prev.address.current.street       || '',
                    region:       prev.address.current.region       || '',
                    province:     prev.address.current.province     || '',
                    municipality: prev.address.current.municipality || '',
                    barangay:     prev.address.current.barangay     || '',
                    country:      prev.address.current.country      || 'Philippines',
                    zipCode:      prev.address.current.zipCode      || ''
                }
            }
        }));
    }, [formData.address?.permanent?.sameAsCurrent]);
 
    // ── handleAddressChange — same logic as Step2 ─────────────────────────────
    const handleAddressChange = useCallback((e, addressType) => {
        const { name, value, checked } = e.target;
 
        if (name === 'sameAsCurrent') {
            setHasAutoFilled(false);
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    permanent: { ...prev.address.permanent, sameAsCurrent: checked }
                }
            }));
            return;
        }
 
        if (name === 'contactNumber') {
            let cleaned = value.replace(/\D/g, '').substring(0, 11);
            let formatted = cleaned.length > 0 ? cleaned.substring(0, 4) : '';
            if (cleaned.length > 4) formatted += ' ' + cleaned.substring(4, 7);
            if (cleaned.length > 7) formatted += ' ' + cleaned.substring(7, 11);
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressType]: { ...prev.address[addressType], [name]: formatted } }
            }));
            return;
        }
 
        if (name === 'houseNo') {
            const cleaned = value.replace(/[^a-zA-Z0-9\s\-]/g, '').substring(0, 50);
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressType]: { ...prev.address[addressType], [name]: cleaned } }
            }));
            return;
        }
 
        if (name === 'zipCode') {
            const cleaned = value.replace(/\D/g, '').substring(0, 4);
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressType]: { ...prev.address[addressType], [name]: cleaned } }
            }));
            return;
        }

        if (name === 'zipAutoFilled') {
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressType]: { ...prev.address[addressType], zipAutoFilled: value === true || value === 'true' } }
            }));
            return;
        }

        
        if (name === 'municipality') {
            const zipCode = getZipCode(value);
            setFormData(prev => ({
                ...prev,
                address: { 
                    ...prev.address, 
                    [addressType]: { 
                        ...prev.address[addressType], 
                        [name]: value,
                        zipCode: zipCode || '',
                        zipAutoFilled: !!zipCode
                    } 
                }
            }));
            return;
        }
 
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [addressType]: { ...prev.address[addressType], [name]: value } }
        }));
    }, [setFormData]);
 
    // ── handleParentGuardianChange — same logic as Step2 ──────────────────────
    const handleParentGuardianChange = useCallback((e, parentType) => {
        const { name, value } = e.target;
 
        if (name === 'contactNumber') {
            let cleaned = value.replace(/\D/g, '').substring(0, 11);
            let formatted = cleaned.length > 0 ? cleaned.substring(0, 4) : '';
            if (cleaned.length > 4) formatted += ' ' + cleaned.substring(4, 7);
            if (cleaned.length > 7) formatted += ' ' + cleaned.substring(7, 11);
            setFormData(prev => ({
                ...prev,
                parentGuardianInfo: {
                    ...prev.parentGuardianInfo,
                    [parentType]: { ...prev.parentGuardianInfo[parentType], [name]: formatted }
                }
            }));
            return;
        }
 
        const textOnly = ['lastName', 'firstName', 'middleName'];
        const finalValue = textOnly.includes(name)
            ? value.replace(/[^a-zA-Z\s\-']/g, '')
            : value;
 
        setFormData(prev => ({
            ...prev,
            parentGuardianInfo: {
                ...prev.parentGuardianInfo,
                [parentType]: { ...prev.parentGuardianInfo[parentType], [name]: finalValue }
            }
        }));
    }, [setFormData]);
 
    // ── handleSchoolHistoryChange ─────────────────────────────────────────────
    const handleSchoolHistoryChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            schoolHistory: { ...prev.schoolHistory, [name]: type === 'checkbox' ? checked : value }
        }));
    }, [setFormData]);
 
    // ── handleAcademicStatusChange ────────────────────────────────────────────
    const handleAcademicStatusChange = useCallback((status) => {
        setFormData(prev => ({
            ...prev,
            studentType: prev.studentType === status ? '' : status
        }));
    }, [setFormData]);
 
    // ── handleSeniorHighChange ────────────────────────────────────────────────
    const handleSeniorHighChange = useCallback((e) => {
        const { name, value } = e.target;
        const finalValue = name === 'semester' && value ? parseInt(value, 10) : value;
        setFormData(prev => ({
            ...prev,
            seniorHigh: {
                ...prev.seniorHigh,
                [name]: finalValue,
                ...(name === 'track' && { strand: '' })
            }
        }));
    }, [setFormData]);
 

 console.log('current address:', formData.address?.current);
    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── PARENT/GUARDIAN INFORMATION ─────────────────────────────── */}
            <div className="card border-0 mb-4">
                <div className="card-body">
                    <h2 className="h5 fw-bold mb-4">PARENT/GUARDIAN INFORMATION</h2>
 
                    {/* Father */}
                    <FormSection
                        title="Father's Information (Optional)"
                        fields={FORM_FIELDS.parentInfo.map(f => ({ ...f, required: false }))}
                        values={formData.parentGuardianInfo?.father}
                        onChange={handleParentGuardianChange}
                        disabled={false}
                        parentType="father"
                    />
 
                    {/* Mother */}
                    <FormSection
                        title="Mother's Information (Optional)"
                        fields={FORM_FIELDS.parentInfo.map(f => ({ ...f, required: false }))}
                        values={formData.parentGuardianInfo?.mother}
                        onChange={handleParentGuardianChange}
                        disabled={false}
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
                                    id="add_sameAsMother"
                                />
                                <label className="form-check-label" htmlFor="add_sameAsMother">
                                    Mother
                                </label>
                            </div>
                            
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={guardianSameAs === 'father'}
                                    onChange={() => handleGuardianSameAs('father')}
                                    id="add_sameAsFather"
                                />
                                <label className="form-check-label" htmlFor="add_sameAsFather">
                                    Father
                                </label>
                            </div>
                        </div>
                    </div>

 
                    {/* Guardian */}
                    <FormSection
                        title="Guardian's Information"
                        fields={FORM_FIELDS.parentInfo.map(f => ({
                            ...f,
                            required: f.name === 'lastName' || f.name === 'firstName',
                            optional: f.name === 'middleName' || f.name === 'contactNumber'
                        }))}
                        values={formData.parentGuardianInfo?.guardian}
                        onChange={handleParentGuardianChange}
                        parentType="guardian"
                    />



                    {/* Guardian Relationship */}
                    <div className="mb-3">
                        <label className="form-label small">
                            Guardian Relationship <span className="text-danger">*</span>
                        </label>
                        <select
                            name="relationship"
                            value={formData.parentGuardianInfo?.guardian?.relationship || ''}
                            onChange={(e) => handleParentGuardianChange(e, 'guardian')}
                            className="form-select"
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
 
                    {/* Others specify */}
                    {!guardianSameAs && formData.parentGuardianInfo?.guardian?.relationship === 'others' && (
                        <div className="mb-3">
                            <label className="form-label small">
                                Please specify: <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="relationshipOther"
                                placeholder="e.g., Godmother, Aunt, Step-parent, etc."
                                value={formData.parentGuardianInfo?.guardian?.relationshipOther || ''}
                                onChange={(e) => handleParentGuardianChange(e, 'guardian')}
                                className="form-control"
                            />
                        </div>
                    )}
                </div>
            </div>
 
            {/* ── CURRENT ADDRESS ──────────────────────────────────────────── */}
            <div className="card border-0 mb-4">
                <div className="card-body">
                    <h2 className="h5 fw-bold mb-4">CURRENT ADDRESS</h2>
 
                    <FormField
                        label="House No." name="houseNo" type="text"
                        value={formData.address?.current?.houseNo}
                        onChange={(e) => handleAddressChange(e, 'current')}
                        required={true}
                    />
                    <FormField
                        label="Street" name="street" type="text"
                        value={formData.address?.current?.street}
                        onChange={(e) => handleAddressChange(e, 'current')}
                        required={true}
                    />
 
                    <AddressDropdowns
                        addressType="current"
                        values={formData.address?.current || {}}
                        onChange={handleAddressChange}
                        disabled={false}
                    />
 
                    <FormField
                        label="Zip Code" name="zipCode" type="text"
                        value={formData.address?.current?.zipCode}
                        onChange={(e) => handleAddressChange(e, 'current')}
                        required={true}
                        disabled={!formData.address?.current?.municipality || !!formData.address?.current?.zipAutoFilled}
                        zipAutoFilled={!!formData.address?.current?.zipAutoFilled}
                        hasMunicipality={!!formData.address?.current?.municipality}
                    />


                    <FormField
                        label="Contact Number" name="contactNumber" type="tel"
                        value={formData.address?.current?.contactNumber}
                        onChange={(e) => handleAddressChange(e, 'current')}
                        required={true}
                    />
                </div>
            </div>
 
            {/* ── PERMANENT ADDRESS ────────────────────────────────────────── */}
            <div className="card border-0 mb-4">
                <div className="card-body">
                    <h2 className="h5 fw-bold mb-3">PERMANENT ADDRESS</h2>
 
                    <div className="mb-4">
                        <div className="form-check">
                            <input
                                className="form-check-input" type="checkbox"
                                name="sameAsCurrent"
                                checked={formData.address?.permanent?.sameAsCurrent || false}
                                onChange={(e) => handleAddressChange(e, 'permanent')}
                                id="add_sameAsCurrent"
                            />
                            <label className="form-check-label" htmlFor="add_sameAsCurrent">
                                Same as Current Address
                            </label>
                        </div>
                    </div>
 
                    <FormField
                        label="House No." name="houseNo" type="text"
                        value={formData.address?.permanent?.houseNo}
                        onChange={(e) => handleAddressChange(e, 'permanent')}
                        disabled={formData.address?.permanent?.sameAsCurrent}
                        required={!formData.address?.permanent?.sameAsCurrent}
                    />
                    <FormField
                        label="Street" name="street" type="text"
                        value={formData.address?.permanent?.street}
                        onChange={(e) => handleAddressChange(e, 'permanent')}
                        disabled={formData.address?.permanent?.sameAsCurrent}
                        required={!formData.address?.permanent?.sameAsCurrent}
                    />
 
                    <AddressDropdowns
                        addressType="permanent"
                        values={formData.address?.permanent || {}}
                        onChange={handleAddressChange}
                        disabled={formData.address?.permanent?.sameAsCurrent}
                    />
 
                    <FormField
                        label="Zip Code" name="zipCode" type="text"
                        value={formData.address?.permanent?.zipCode}
                        onChange={(e) => handleAddressChange(e, 'permanent')}
                        disabled={formData.address?.permanent?.sameAsCurrent || !formData.address?.permanent?.municipality || !!formData.address?.permanent?.zipAutoFilled}
                        required={!formData.address?.permanent?.sameAsCurrent}
                        zipAutoFilled={!!formData.address?.permanent?.zipAutoFilled}
                        hasMunicipality={!!formData.address?.permanent?.municipality}
                    />


                </div>
            </div>
 
            {/* ── RETURNING LEARNER — only if isReturning === 'Yes' ─────────── */}
            {formData.isReturning === 'Yes' && (
                <div className="card border-0 mb-4">
                    <div className="card-body">
                        <h2 className="h5 fw-bold mb-3">
                            FOR RETURNING LEARNER (BALIK-ARAL) AND THOSE WHO WILL TRANSFER/MOVE IN
                        </h2>
 
                        <div className="mb-4">
                            <div className="form-check">
                                <input
                                    className="form-check-input" type="checkbox"
                                    name="returningLearner"
                                    checked={formData.schoolHistory?.returningLearner || false}
                                    onChange={handleSchoolHistoryChange}
                                    id="add_returningLearner"
                                />
                                <label className="form-check-label" htmlFor="add_returningLearner">
                                    I am a Returning Learner or Transferee
                                    <span className="text-danger ms-1">*</span>
                                </label>
                            </div>
                        </div>
 
                        <div className="d-flex gap-4 my-2">
                            {[
                                { id: 'transferee', label: 'Transferee' },
                                { id: 'returnee',   label: 'Returning Learner (Balik-Aral)' }
                            ].map(({ id, label }) => (
                                <div className="form-check" key={id}>
                                    <input
                                        className="form-check-input" type="checkbox"
                                        checked={formData.studentType === id}
                                        onChange={() => handleAcademicStatusChange(id)}
                                        disabled={!formData.schoolHistory?.returningLearner}
                                        id={`add_${id}`}
                                    />
                                    <label className="form-check-label" htmlFor={`add_${id}`}>
                                        {label} <span className="text-danger">*</span>
                                    </label>
                                </div>
                            ))}
                        </div>
 
                        <div className="row mt-3">
                            {FORM_FIELDS.schoolHistory.map(field => (
                                <div key={field.name} className="col-12 mb-3">
                                    <label className="form-label small">
                                        {field.label} <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={formData.schoolHistory?.[field.name] || ''}
                                        onChange={handleSchoolHistoryChange}
                                        className="form-control"
                                        disabled={!formData.schoolHistory?.returningLearner}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
 
            {/* ── FOR LEARNERS IN SENIOR HIGH SCHOOL ───────────────────────── */}
            <div className="card border-0 mb-4">
                <div className="card-body">
                    <h2 className="h5 fw-bold mb-4">FOR LEARNERS IN SENIOR HIGH SCHOOL</h2>
 
                    <div className="mb-3">
                        <label className="form-label small">
                            Grade Level to Enroll <span className="text-danger">*</span>
                        </label>
                        <select
                            name="gradeLevelToEnroll"
                            value={formData.gradeLevelToEnroll || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, gradeLevelToEnroll: e.target.value }))}
                            className="form-select"
                        >
                            <option value="">Select Grade Level</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                        </select>
                    </div>
 
                    <div className="mb-3">
                        <label className="form-label small">
                            Track <span className="text-danger">*</span>
                        </label>
                        <select
                            name="track"
                            value={formData.seniorHigh?.track || ''}
                            onChange={handleSeniorHighChange}
                            className="form-select"
                        >
                            <option value="">
                                {loadingPrograms ? 'Loading tracks...' : 'Select Track'}
                            </option>
                            {programs.map(p => (
                                <option key={p._id} value={p.trackName}>{p.trackName}</option>
                            ))}
                        </select>
                    </div>
 
                    <div className="mb-3">
                        <label className="form-label small">
                            Strand <span className="text-danger">*</span>
                        </label>
                        <select
                            name="strand"
                            value={formData.seniorHigh?.strand || ''}
                            onChange={handleSeniorHighChange}
                            className="form-select"
                            disabled={!formData.seniorHigh?.track}
                        >
                            <option value="">
                                {!formData.seniorHigh?.track ? 'Select Track First' : 'Select Strand'}
                            </option>
                            {programs
                                .find(p => p.trackName === formData.seniorHigh?.track)
                                ?.strands
                                .filter(s => s.isActive)
                                .map(s => (
                                    <option key={s._id} value={s.strandName}>{s.strandName}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>
        </>
    );
};






const AddApplicantStep3 = ({ 
    formData, 
    setFormData, 
    onNext, 
    onBack 
}) => {
    const fileRef = useRef({});
    const [psaError, setPsaError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // ✅ Check if all required files uploaded
    const checkAllFilesUploaded = () => {
        const c = formData.certification;
        const hasPsaBirthCert = (c.psaBirthCertFile instanceof File) || c.psaBirthCertPreview;
        const hasReportCard = (c.reportCardFile instanceof File) || c.reportCardPreview;
        const hasIdPicture = (c.idPictureFile instanceof File) || c.idPicturePreview;
        return hasPsaBirthCert && hasReportCard && hasIdPicture;
    };

    // ✅ PSA No. validation
    const handleCertificationChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'psaNo') {
            const cleanedValue = value.replace(/[^a-zA-Z0-9\-]/g, '');
            
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

    // ✅ File upload with compression
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

    // ✅ Remove file
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

    // ✅ View image in modal
    const handleViewImage = (preview) => {
        if (preview) {
            setPreviewImage(preview);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // ✅ File preview card component
    const FilePreviewCard = ({ fieldName, preview, fileName }) => {
        if (!preview) return null;
        return (
            <div
                className="d-flex align-items-center gap-2 mt-2 p-2 border rounded"
                style={{ maxWidth: '320px', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                onClick={() => handleViewImage(preview)}
            >
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
            </div>
        );
    };

    return (
        <div>
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
                                    />
                                </div>
                                <FilePreviewCard
                                    fieldName="reportCard"
                                    preview={formData.certification?.reportCardPreview}
                                    fileName={formData.certification?.reportCardFileName}
                                />
                            </div>

                            {/* Good Moral (Optional) */}
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
                                    <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="psaNo"
                                    value={formData.certification?.psaNo || ''}
                                    onChange={handleCertificationChange}
                                    className={`form-control ${psaError ? 'is-invalid' : ''}`}
                                    placeholder="e.g., A123456-789012"
                                    maxLength="13"
                                />
                                {psaError && <div className="invalid-feedback d-block">{psaError}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};









// ═══════════════════════════════════════════════════════════════
// WRAPPER — Add_Applicants (manages step, formData, enrollmentId)
// 

const Add_Applicants = ({ isOpen, onClose, onSuccess, applicant = null, mode = 'add' }) => {

    const { role } = useContext(globalContext);
    const fileRef  = useRef({});











    const initialFormData = {
        isReturning: '',
        gradeLevelToEnroll: '',
        studentType: 'regular',
        learnerInfo: {
            email: '', lrn: '', firstName: '', middleName: '', lastName: '',
            extensionName: '', birthDate: '', age: '', sex: '', placeOfBirth: '',
            motherTongue: '',
            learnerWithDisability: { isDisabled: '', disabilityType: [] },
            indigenousCommunity:   { isMember: '',  name: '' },
            fourPs:                { isBeneficiary: '', householdId: '' }
        },
        address: {
            current:   { houseNo: '', street: '', region: '', province: '', municipality: '', barangay: '', country: 'Philippines', zipCode: '', contactNumber: '' },
            permanent: { sameAsCurrent: false, houseNo: '', street: '', region: '', province: '', municipality: '', barangay: '', country: 'Philippines', zipCode: '' }
        },
        parentGuardianInfo: {
            father:   { lastName: '', firstName: '', middleName: '', contactNumber: '' },
            mother:   { lastName: '', firstName: '', middleName: '', contactNumber: '' },
            guardian: { lastName: '', firstName: '', middleName: '', contactNumber: '', relationship: '' }
        },
        schoolHistory: { returningLearner: false, lastGradeLevelCompleted: '', lastSchoolYearCompleted: '', lastSchoolAttended: '', schoolId: '' },
        seniorHigh:    { semester: '', track: '', strand: '' },
        certification: {
            psaBirthCertFile: null, psaBirthCertFileName: '', psaBirthCertPreview: null,
            reportCardFile:   null, reportCardFileName:   '', reportCardPreview:   null,
            goodMoralFile:    null, goodMoralFileName:    '', goodMoralPreview:    null,
            idPictureFile:    null, idPictureFileName:    '', idPicturePreview:    null,
            psaNo: ''
        }
    };



    
    const boolToYesNo = (val) => {
        if (val === true)  return 'Yes';
        if (val === false) return 'No';
        return '';
    };

    const buildInitialFormData = (applicant) => {
        if (!applicant) return { ...initialFormData };

        return {
            isReturning:        boolToYesNo(applicant.isReturning),
            gradeLevelToEnroll: applicant.gradeLevelToEnroll || '',
            studentType:        applicant.studentType || 'regular',
            learnerInfo: {
                email:         applicant.learnerInfo?.email         || '',
                lrn:           applicant.learnerInfo?.lrn           || '',
                firstName:     applicant.learnerInfo?.firstName     || '',
                middleName:    applicant.learnerInfo?.middleName    || '',
                lastName:      applicant.learnerInfo?.lastName      || '',
                extensionName: applicant.learnerInfo?.extensionName || '',
                birthDate:     applicant.learnerInfo?.birthDate
                                ? applicant.learnerInfo.birthDate.split('T')[0]  // "2006-08-09T..." → "2006-08-09"
                                : '',
                age:           applicant.learnerInfo?.age?.toString() || '',
                sex:           applicant.learnerInfo?.sex           || '',
                placeOfBirth:  applicant.learnerInfo?.placeOfBirth  || '',
                motherTongue:  applicant.learnerInfo?.motherTongue  || '',
                learnerWithDisability: {
                    isDisabled:     boolToYesNo(applicant.learnerInfo?.learnerWithDisability?.isDisabled),
                    disabilityType: applicant.learnerInfo?.learnerWithDisability?.disabilityType || [],
                },
                indigenousCommunity: {
                    isMember: boolToYesNo(applicant.learnerInfo?.indigenousCommunity?.isMember),
                    name:     applicant.learnerInfo?.indigenousCommunity?.name || '',
                },
                fourPs: {
                    isBeneficiary: boolToYesNo(applicant.learnerInfo?.fourPs?.isBeneficiary),
                    householdId:   applicant.learnerInfo?.fourPs?.householdId || '',
                },
            },
            address: {
                current:   applicant.address?.current   || { houseNo: '', street: '', region: '', province: '', municipality: '', barangay: '', country: 'Philippines', zipCode: '', contactNumber: '' },
                permanent: applicant.address?.permanent || { sameAsCurrent: false, houseNo: '', street: '', region: '', province: '', municipality: '', barangay: '', country: 'Philippines', zipCode: '' },
            },
            parentGuardianInfo: {
                father:   applicant.parentGuardianInfo?.father   || { lastName: '', firstName: '', middleName: '', contactNumber: '' },
                mother:   applicant.parentGuardianInfo?.mother   || { lastName: '', firstName: '', middleName: '', contactNumber: '' },
                guardian: applicant.parentGuardianInfo?.guardian || { lastName: '', firstName: '', middleName: '', contactNumber: '', relationship: '' },
            },
            schoolHistory: applicant.schoolHistory || { returningLearner: false, lastGradeLevelCompleted: '', lastSchoolYearCompleted: '', lastSchoolAttended: '', schoolId: '' },
            seniorHigh:    applicant.seniorHigh    || { semester: '', track: '', strand: '' },
            certification: {
                psaBirthCertFile:    null,
                psaBirthCertFileName: '',
                psaBirthCertPreview: applicant.requiredDocuments?.psaBirthCert?.filePath || null,  // ← dito ang fix
                reportCardFile:      null,
                reportCardFileName:  '',
                reportCardPreview:   applicant.requiredDocuments?.reportCard?.filePath   || null,
                goodMoralFile:       null,
                goodMoralFileName:   '',
                goodMoralPreview:    applicant.requiredDocuments?.goodMoral?.filePath    || null,
                idPictureFile:       null,
                idPictureFileName:   '',
                idPicturePreview:    applicant.requiredDocuments?.idPicture?.filePath    || null,
                psaNo:               applicant.psaNo || '',
            }
        };
    };






        


    // ── Wrapper state 
    const [formData, setFormData] = useState(() => buildInitialFormData(applicant));
    const [currentStep,    setCurrentStep]    = useState(1);
    const [enrollmentId,   setEnrollmentId]   = useState(null);
    const [isLoading,      setIsLoading]      = useState(false);
    const [errorMessage,   setErrorMessage]   = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [successModal, setSuccessModal]     = useState(false);
    const [programs,       setPrograms]       = useState([]);
    const [emailVerify,    setEmailVerify]    = useState([]);

    // ── Validation error states (owned by wrapper, passed down to Step1) ───────
    const [emailError,  setEmailError]  = useState('');
    const [emailValid,  setEmailValid]  = useState(false);
    const [lrnError,    setLrnError]    = useState('');
    const [psaError,    setPsaError]    = useState('');
    const [fourPsError, setFourPsError] = useState('');


    const [hasAutoFilled,    setHasAutoFilled]    = useState(false);
    const [guardianSameAs, setGuardianSameAs] = useState('');
    const [loadingPrograms,  setLoadingPrograms]  = useState(false);




    useEffect(() => {
        if (isOpen) {
            setFormData(buildInitialFormData(applicant));
            setCurrentStep(1);
            setEmailError('');
            setEmailValid(mode === 'edit'); // edit mode = existing email, valid na agad
            setLrnError('');
            setHasAutoFilled(false);
        }
    }, [isOpen, applicant]);


    // ── Fetch programs + emails on open ────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const fetchPrograms = async () => {
            try {
                setLoadingPrograms(true); 
                const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/getActivePrograms`, { method: "GET", credentials: "include" });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setPrograms(data);
            } catch (e) { 
                console.log("Error fetching programs:", e.message); 
            } finally {
                setLoadingPrograms(false);
            }
        };


        const fetchEmails = async () => {
            try {
                const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllEmails`, {
                     method: "GET", 
                     credentials: "include" 
                });
                const data = await res.json();
                if (data.success) {
                    setEmailVerify(data.emails);
                }
            } catch (e) { 
                console.log("Error fetching emails:", e.message); 
            }
        };
        fetchPrograms();
        fetchEmails();
    }, [isOpen]);

    // ── Step 1 validation ──────────────────────────────────────────────────────


    const isStep1Valid = () => {
        const li = formData.learnerInfo;
        const required = ['email','lastName','firstName','birthDate','age','sex','placeOfBirth','motherTongue','lrn'];

        const disabilityAnswered = li.learnerWithDisability?.isDisabled !== '';
        const disabilityValid = li.learnerWithDisability?.isDisabled === 'Yes'
            ? li.learnerWithDisability?.disabilityType?.length > 0
            : true;

        return (
            required.every(f => li[f] && li[f].toString().trim() !== '') &&
            formData.isReturning &&
            disabilityAnswered &&
            disabilityValid &&
            !lrnError && !emailError && emailValid
        );
    };




    const handleGuardianSameAs = useCallback((source) => {
        const newSource = guardianSameAs === source ? '' : source;
        setGuardianSameAs(newSource);

        if (newSource === 'mother') {
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
}, [guardianSameAs, formData.parentGuardianInfo, setFormData]);




    const handleNext = () => {
       if (currentStep === 1) {
           setCurrentStep(2);
       } else if (currentStep === 2) {
           setCurrentStep(3);
       }
    };


    const handleBack = () => {
        if (currentStep > 1) {
            const prev = currentStep - 1;
            setCurrentStep(prev);
        }
    };

    
    const handleClose = () => {
        setCurrentStep(1);
        setEnrollmentId(null);
        setEmailError('');
        setEmailValid(false);
        setLrnError('');
        setPsaError('');
        setFourPsError('');
        setHasAutoFilled(false);
        setFormData(buildInitialFormData(null)); // ← consistent, laging blank
        onClose();
    };
    


    const isStep3Valid = () => {
        const c = formData.certification;
        const hasPsaBirthCert = (c.psaBirthCertFile instanceof File) || c.psaBirthCertPreview;
        const hasReportCard = (c.reportCardFile instanceof File) || c.reportCardPreview;
        const hasIdPicture = (c.idPictureFile instanceof File) || c.idPicturePreview;
        return hasPsaBirthCert && hasReportCard && hasIdPicture;
    };





    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('isReturning', formData.isReturning);
            submitData.append('gradeLevelToEnroll', formData.gradeLevelToEnroll);
            submitData.append('studentType', formData.studentType || 'regular');
            submitData.append('learnerInfo', JSON.stringify(formData.learnerInfo));
            submitData.append('address', JSON.stringify(formData.address));
            submitData.append('parentGuardianInfo', JSON.stringify(formData.parentGuardianInfo));
            submitData.append('schoolHistory', JSON.stringify(formData.schoolHistory));
            submitData.append('seniorHigh', JSON.stringify(formData.seniorHigh));

            ['psaBirthCert', 'reportCard', 'idPicture', 'goodMoral'].forEach(fieldName => {
                const file = formData.certification?.[`${fieldName}File`];
                if (file instanceof File) {
                    submitData.append(`${fieldName}File`, file);
                }
            });

            if (formData.certification?.psaNo) {
                submitData.append('psaNo', formData.certification.psaNo.trim());
            }

            // ← DITO ang pagbabago
            const isEdit = mode === 'edit' && applicant?._id;
            const url    = isEdit
                ? `${import.meta.env.VITE_API_URL}/api/update-applicant/${applicant._id}`
                : `${import.meta.env.VITE_API_URL}/api/add-applicant`;
            const method = isEdit ? 'PUT' : 'POST';

            const res  = await fetch(url, { method, credentials: 'include', body: submitData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.success) {
                setFormData(buildInitialFormData(null));
                setCurrentStep(1);
                setSuccessModal(true);
            }
        } catch (error) {
            setErrorMessage(error.message);
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    };






    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>

            {/* Modal */}
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1056 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="modal-content">

                        {/* Header */}
                        <div className="modal-header bg-danger text-white">
                            <h5 className="modal-title fw-bold">
                                <i className={`fa ${mode === 'edit' ? 'fa-user-edit' : 'fa-user-plus'} me-2`}></i>
                                {mode === 'edit' ? 'Edit Applicant' : 'Add New Applicant'}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose} disabled={isLoading}></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body px-4">
                            <ProgressStepper currentStep={currentStep} />

                            <Reminder/>

                            {/* ── Step 1 ── */}
                            {currentStep === 1 && (
                                <AddApplicantStep1
                                    formData={formData}
                                    setFormData={setFormData}
                                    emailVerify={emailVerify}
                                    currentApplicantId={applicant?._id} 
                                    emailError={emailError}   setEmailError={setEmailError}
                                    emailValid={emailValid}   setEmailValid={setEmailValid}
                                    lrnError={lrnError}       setLrnError={setLrnError}
                                    fourPsError={fourPsError} setFourPsError={setFourPsError}
                                />
                            )}

                            {/* ── Step 2 placeholder ── */}
                            {currentStep === 2 && ( 
                                <AddApplicantStep2
                                    formData={formData}
                                    setFormData={setFormData}
                                    programs={programs}
                                    loadingPrograms={loadingPrograms}
                                    hasAutoFilled={hasAutoFilled}
                                    setHasAutoFilled={setHasAutoFilled}
                                    guardianSameAs={guardianSameAs}
                                    handleGuardianSameAs={handleGuardianSameAs}
                                />
                            )}


                            {/* ── Step 3 placeholder ── */}
                            {currentStep === 3 && (
                                <AddApplicantStep3
                                    formData={formData}
                                    setFormData={setFormData}
                                />
                            )}

                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            {currentStep === 1 && (
                                <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isLoading}>
                                    Close
                                </button>
                            )}

                            {currentStep > 1 && (
                                <button type="button" 
                                className="btn btn-outline-secondary px-4 text-capitalize d-flex gap-1 align-items-center" 
                                onClick={handleBack} disabled={isLoading}>
                                    <i className="fa-solid fa-arrow-left"></i>
                                    back
                                </button>
                            )}

                            <button
                                type="button"
                                className="btn btn-primary text-white text-capitalize px-5"
                                onClick={currentStep === 3 ? handleSubmit : handleNext}
                                disabled={isLoading || (currentStep === 1 && !isStep1Valid()) || (currentStep === 3 && !isStep3Valid())}
                            >
                                {isLoading
                                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</>

                                    : currentStep === 3 
                                        ? (mode === 'edit' ? 'Save Changes' : 'Submit') 
                                        : 'Next'
                                }
                            </button>

                        </div>
                    </div>
                </div>
            </div>
                                
            

            {/* Success Modal */}
            {successModal && (
                <div className="modal fade show d-block" tabIndex="-1" 
                style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center py-5">
                                <div className="mb-4">
                                    <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '5rem' }}></i>
                                </div>

                                <h4 className="fw-bold mb-3">
                                    {mode === 'edit' ? 'Changes Saved!' : 'Application Submitted!'}
                                </h4>
                                <p className="text-muted mb-4">
                                    {mode === 'edit'
                                        ? 'The applicant information has been successfully updated.'
                                        : 'Your enrollment application has been successfully submitted. Please wait for admin approval.'
                                    }
                                </p>

                                <button 
                                    type="button" 
                                    className="btn btn-success px-5"
                                    onClick={() => {
                                        setSuccessModal(false);
                                        onClose();
                                        if (onSuccess) onSuccess();
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
            {showErrorModal && (
                <>
                    <div className="modal-backdrop fade show" 
                    style={{ zIndex: 1060 }} 
                    onClick={() => setShowErrorModal(false)}></div>
                    <div className="modal fade show d-block" tabIndex="-1" 
                    style={{ zIndex: 1061 }}>
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
                                    <button type="button" className="btn btn-danger px-4" onClick={() => setShowErrorModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Add_Applicants;