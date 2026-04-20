import React, { useRef, useEffect, useLayoutEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { globalContext } from '../context/global';
import deped from "../assets/image/deped.png";
import logo from "../assets/image/logo.png";




const EnrollmentFormPDF = () => {
  const { role, setTextHeader } = useContext(globalContext);
  const formRef = useRef();
  const [openModal, setOpenModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const enrollmentData = location?.state?.applicant || {};
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const isPDF = !!location?.state?.autoDownload;
  

  useLayoutEffect(() => { setTextHeader(location?.state?.title); }, [location?.state?.title]);


  useEffect(() => {
    if (!location?.state) navigate(`/admin`, { replace: true });
  }, [location?.state, navigate]);



  useLayoutEffect(() => {
    if (location?.state?.autoDownload) handleDownloadPDF();
  }, [location?.state?.autoDownload]);


  const showAlert = (message, type = 'success') => {
    setAlertMessage(message); setAlertType(type); setShowAlertModal(true);
  };



  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = formRef.current;
      const images = element.getElementsByTagName('img');
      const imagePromises = Array.from(images).map(img =>
        new Promise(resolve => {
          const convert = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            img.src = canvas.toDataURL('image/png'); resolve();
          };
          img.complete ? convert() : (img.onload = convert);
        })
      );
      await Promise.all(imagePromises);
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Enrollment-Form-${enrollmentData?.learnerInfo?.lastName || 'Unknown'}-${enrollmentData?.schoolYear || ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      if (location?.state?.autoDownload) navigate(`/${role}/applicants`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally { setIsDownloading(false); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };



  const hiddenStyle = isPDF
    ? { position: "absolute", opacity: 0, pointerEvents: "none", left: "-9999px", top: "-9999px" }
    : {};
  

  const val = (v) => v || '—';

  // ═══════════════════════════════════════════════════════════
  // PDF STYLES — ultra compact, fits full form in 1 A4 page
  // ═══════════════════════════════════════════════════════════
  const s = {
    page: {
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      fontSize: '7.5px',
      color: '#1a1a1a',
      background: '#fff',
      padding: '8px 10px',
      width: '794px',
      boxSizing: 'border-box',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', marginBottom: '4px', paddingBottom: '4px',
      borderBottom: '1.5px solid #7f1d1d',
    },
    schoolName: { fontSize: '10px', fontWeight: 'bold', color: '#7f1d1d', margin: 0 },
    schoolSub: { fontSize: '7.5px', color: '#555', margin: '1px 0 0' },
    formTitle: {
      textAlign: 'center', fontSize: '9.5px', fontWeight: 'bold',
      letterSpacing: '1.5px', color: '#7f1d1d', margin: '4px 0 1px', textTransform: 'uppercase',
    },
    syBadge: { textAlign: 'center', fontSize: '7.5px', color: '#444', marginBottom: '5px' },
    sectionHeader: {
      background: '#7f1d1d', color: '#fff', fontSize: '7px', fontWeight: 'bold',
      letterSpacing: '0.6px', padding: '2px 6px', textTransform: 'uppercase',
      pageBreakAfter: 'avoid', breakAfter: 'avoid',
    },
    sectionBody: {
      border: '1px solid #e5e7eb', borderTop: 'none',
      padding: '4px 6px', marginBottom: '4px',
      pageBreakInside: 'avoid', breakInside: 'avoid',
    },
    pdfRow: { display: 'flex', gap: '5px', marginBottom: '3px' },
    field: { flex: 1 }, 
    fieldLabel: {
      fontSize: '6px', fontWeight: 'bold', color: '#7f1d1d',
      letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: '1px',
    },
    fieldValue: {
      fontSize: '7.5px', color: '#1a1a1a',
      borderBottom: '0.5px solid #d1d5db', paddingBottom: '1px', minHeight: '11px',
    },
    checkbox: {
      width: '8px', height: '8px', border: '0.8px solid #7f1d1d',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '7px', color: '#7f1d1d', flexShrink: 0,
    },
    divider: { borderTop: '0.5px dashed #e5e7eb', margin: '3px 0' },
    docPage: {
      pageBreakBefore: 'always', breakBefore: 'page',
      padding: '8px 10px', width: '794px',
      boxSizing: 'border-box', background: '#fff',
    },
    docHeader: {
      background: '#7f1d1d', color: '#fff', fontSize: '7.5px', fontWeight: 'bold',
      padding: '3px 6px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px',
    },
    docImg: {
      width: '100%', maxHeight: '218mm',
      objectFit: 'contain', border: '1px solid #e5e7eb',
      display: 'block', margin: '0 auto',
    },
    statusBadge: (status) => ({
      display: 'inline-block', padding: '1px 6px', borderRadius: '2px',
      fontSize: '7px', fontWeight: 'bold',
      background: status === 'approved' ? '#dcfce7' : status === 'rejected' ? '#fee2e2' : '#fef9c3',
      color: status === 'approved' ? '#166534' : status === 'rejected' ? '#991b1b' : '#854d0e',
      border: `0.5px solid ${status === 'approved' ? '#86efac' : status === 'rejected' ? '#fca5a5' : '#fde047'}`,
    }),
    sigSection: { marginTop: '10px', display: 'flex', justifyContent: 'flex-end' },
    sigBox: { textAlign: 'center', width: '160px' },
    sigLine: { borderTop: '0.8px solid #1a1a1a', marginBottom: '2px' },
    sigLabel: { fontSize: '6.5px', color: '#555' },
    subSectionLabel: {
      fontSize: '6.5px', fontWeight: 'bold', color: '#7f1d1d',
      marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px',
    },
    footerText: {
      textAlign: 'center', fontSize: '6.5px', color: '#9ca3af',
      marginTop: '4px', borderTop: '0.5px solid #f3f4f6', paddingTop: '3px',
    },
    studentInfoStrip: {
      background: '#fef2f2', border: '0.8px solid #fecaca', borderRadius: '2px',
      padding: '3px 6px', marginBottom: '5px',
      display: 'flex', gap: '10px', fontSize: '7px', flexWrap: 'wrap',
    },
  };

  // ─── PDF Field ─────────────────────────────────────────────
  const PdfField = ({ label, value, flex }) => (
    <div style={{ ...s.field, flex: flex || 1 }}>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.fieldValue}>{val(value)}</div>
    </div>
  );

  // ─── Web Field — labels small/muted, values 14px medium ───
  const WebField = ({ label, value, col = 'col-12 col-sm-6 col-md-3' }) => (
    <div className={`${col} mb-2`}>
      <div className="text-uppercase fw-semibold text-muted" style={{ fontSize: '10px', letterSpacing: '0.6px', marginBottom: '3px' }}>
        {label}
      </div>
      <div className="border-bottom pb-1" style={{ fontSize: '14px', minHeight: '22px', color: '#1a1a1a', fontWeight: '500' }}>
        {val(value)}
      </div>
    </div>
  );

  const CB = ({ checked }) => <span style={s.checkbox}>{checked ? '✓' : ''}</span>;

  const WCB = ({ checked }) => (
    <span className="d-inline-flex align-items-center justify-content-center border border-danger flex-shrink-0"
      style={{ width: '16px', height: '16px', fontSize: '12px', color: '#7f1d1d' }}>
      {checked ? '✓' : ''}
    </span>
  );

  const SectionHeader = ({ title }) => isPDF
    ? <div style={s.sectionHeader}>{title}</div>
    : <div className="fw-bold text-white px-3 py-2 mb-0 text-uppercase"
        style={{ background: '#7f1d1d', fontSize: '13px', letterSpacing: '1px' }}>{title}</div>;

  const SubLabel = ({ children }) => isPDF
    ? <div style={s.subSectionLabel}>{children}</div>
    : <div className="fw-semibold text-uppercase mb-2" style={{ color: '#7f1d1d', fontSize: '11px', letterSpacing: '0.5px' }}>{children}</div>;

  const documents = [
    { title: 'PSA Birth Certificate', path: enrollmentData.requiredDocuments?.psaBirthCert?.filePath },
    { title: 'Report Card (Form 138)', path: enrollmentData.requiredDocuments?.reportCard?.filePath },
    { title: 'Good Moral Certificate', path: enrollmentData.requiredDocuments?.goodMoral?.filePath },
    { title: '2x2 ID Picture', path: enrollmentData.requiredDocuments?.idPicture?.filePath },
  ].filter(d => d.path);

  const PageWrap = ({ children, pdfStyle }) => isPDF
    ? <div style={{ ...pdfStyle, background: '#fff' }}>{children}</div>
    : <div className="container-fluid px-3 mb-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="bg-white rounded shadow-sm p-3 p-md-4">{children}</div>
      </div>;

  const SectionBody = ({ children, mb = true }) => isPDF
    ? <div style={{ ...s.sectionBody, marginBottom: mb ? '4px' : 0 }}>{children}</div>
    : <div className={`border border-top-0 p-3 ${mb ? 'mb-3' : ''}`}>{children}</div>;

  return (
    <>
      <div style={hiddenStyle}>
        <div style={isPDF ? {} : { background: '#f3f4f6', minHeight: '100vh', padding: '20px 0' }}>

          {/* ── Action Buttons (web only) ── */}
          {!isPDF && (
            <div className="container-fluid px-3 mb-3" style={{ maxWidth: '900px' }}>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <h4 className="fw-bold mb-0 me-auto fs-4" style={{ color: '#7f1d1d' }}>
                  Enrollment Form
                </h4>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)} disabled={isDownloading}>
                  <i className="fa fa-arrow-left me-2" />Back
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleDownloadPDF} disabled={isDownloading}>
                  {isDownloading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Downloading...</>
                    : <><i className="fa fa-download me-2" />Download PDF</>}
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => setOpenModal(true)}
                  disabled={enrollmentData?.status === "approved" || isDownloading || isApproving}
                >
                  {enrollmentData?.status === "approved" ? "Approved"
                    : isApproving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Approving...</>
                      : "Approve"}
                </button>
              </div>
            </div>
          )}

          <div ref={formRef}>
            {/* ══════════════════════════════════════════════
                PAGE 1 — ENROLLMENT FORM
            ══════════════════════════════════════════════ */}
            <PageWrap pdfStyle={s.page}>

              {/* ── School Header ── */}
              {isPDF ? (
                <div style={s.header}>
                  <img src={deped} alt="DepEd" style={{ width: '38px', height: '38px' }} crossOrigin="anonymous" />
                  <div style={{ textAlign: 'center' }}>
                    <p style={s.schoolName}>Francisco Osorio Integrated Senior High School</p>
                    <p style={s.schoolSub}>Barangay Osorio, Trece Martires City, Cavite</p>
                    <p style={s.schoolSub}>Department of Education — Region IV-A CALABARZON</p>
                  </div>
                  <img src={logo} alt="Logo" style={{ width: '38px', height: '38px' }} crossOrigin="anonymous" />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-3 pb-3 mb-3" style={{ borderBottom: '2px solid #7f1d1d' }}>
                  <img src={deped} alt="DepEd" style={{ width: '56px', height: '56px' }} />
                  <div className="text-center">
                    <p className="fw-bold mb-0 fs-5" style={{ color: '#7f1d1d' }}>Francisco Osorio Integrated Senior High School</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>Barangay Osorio, Trece Martires City, Cavite</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>Department of Education — Region IV-A CALABARZON</p>
                  </div>
                  <img src={logo} alt="Logo" style={{ width: '56px', height: '56px' }} />
                </div>
              )}

              {/* ── Form Title ── */}
              {isPDF ? (
                <>
                  <div style={s.formTitle}>Student Enrollment Form</div>
                  <div style={s.syBadge}>
                    School Year: <strong>{enrollmentData.schoolYear || '________'}</strong>&nbsp;|&nbsp;
                    Grade Level: <strong>{enrollmentData.gradeLevelToEnroll || '________'}</strong>&nbsp;|&nbsp;
                    Semester: <strong>{enrollmentData.seniorHigh?.semester === 1 ? 'First' : enrollmentData.seniorHigh?.semester === 2 ? 'Second' : '—'}</strong>
                  </div>
                </>
              ) : (
                <div className="text-center mb-3">
                  <div className="fw-bold text-uppercase fs-5" style={{ color: '#7f1d1d', letterSpacing: '2px' }}>Student Enrollment Form</div>
                  <div className="text-muted mt-1" style={{ fontSize: '13px' }}>
                    School Year: <strong>{enrollmentData.schoolYear || '________'}</strong>&nbsp;|&nbsp;
                    Grade Level: <strong>{enrollmentData.gradeLevelToEnroll || '________'}</strong>&nbsp;|&nbsp;
                    Semester: <strong>{enrollmentData.seniorHigh?.semester === 1 ? 'First' : enrollmentData.seniorHigh?.semester === 2 ? 'Second' : '—'}</strong>
                  </div>
                </div>
              )}

              {/* ══ I. LEARNER INFO ══ */}
              <SectionHeader title="I. Learner Information" />
              <SectionBody>
                {isPDF ? (
                  <>
                    <div style={s.pdfRow}>
                      <PdfField label="Last Name" value={enrollmentData.learnerInfo?.lastName} />
                      <PdfField label="First Name" value={enrollmentData.learnerInfo?.firstName} />
                      <PdfField label="Middle Name" value={enrollmentData.learnerInfo?.middleName} />
                      <PdfField label="Ext." value={enrollmentData.learnerInfo?.extensionName} flex={0.3} />
                    </div>
                    <div style={s.pdfRow}>
                      <PdfField label="Date of Birth" value={formatDate(enrollmentData.learnerInfo?.birthDate)} />
                      <PdfField label="Place of Birth" value={enrollmentData.learnerInfo?.placeOfBirth} />
                      <PdfField label="Age" value={enrollmentData.learnerInfo?.age} flex={0.35} />
                      <div style={{ flex: 0.6 }}>
                        <div style={s.fieldLabel}>Sex</div>
                        <div style={{ display: 'flex', gap: '5px', paddingTop: '1px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '7.5px' }}><CB checked={enrollmentData.learnerInfo?.sex === 'Male'} /> Male</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '7.5px' }}><CB checked={enrollmentData.learnerInfo?.sex === 'Female'} /> Female</span>
                        </div>
                      </div>
                    </div>
                    <div style={s.pdfRow}>
                      <PdfField label="Email Address" value={enrollmentData.learnerInfo?.email} />
                      <PdfField label="Mother Tongue" value={enrollmentData.learnerInfo?.motherTongue} />
                    </div>
                    <div style={s.pdfRow}>
                      <PdfField label="Learner Reference No. (LRN)" value={enrollmentData.learnerInfo?.lrn} />
                      <PdfField label="PSA Birth Certificate No." value={enrollmentData.psaNo} />
                    </div>
                    <div style={s.divider} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7px' }}><CB checked={enrollmentData.isReturning} /> Returning Learner (Balik-Aral)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7px' }}>
                        <CB checked={enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> Learner with Disability
                        {enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled && <span style={{ color: '#7f1d1d' }}>({enrollmentData.learnerInfo?.learnerWithDisability?.disabilityType?.join(', ')})</span>}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7px' }}>
                        <CB checked={enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> IP Community Member
                        {enrollmentData.learnerInfo?.indigenousCommunity?.isMember && <span style={{ color: '#7f1d1d' }}>({enrollmentData.learnerInfo?.indigenousCommunity?.name})</span>}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7px' }}>
                        <CB checked={enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> 4Ps Beneficiary
                        {enrollmentData.learnerInfo?.fourPs?.isBeneficiary && <span style={{ color: '#7f1d1d' }}>(ID: {enrollmentData.learnerInfo?.fourPs?.householdId})</span>}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row g-2 mb-1">
                      <WebField label="Last Name" value={enrollmentData.learnerInfo?.lastName} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="First Name" value={enrollmentData.learnerInfo?.firstName} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Middle Name" value={enrollmentData.learnerInfo?.middleName} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Ext." value={enrollmentData.learnerInfo?.extensionName} col="col-6 col-sm-3 col-md-1" />
                    </div>
                    <div className="row g-2 mb-1">
                      <WebField label="Date of Birth" value={formatDate(enrollmentData.learnerInfo?.birthDate)} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Place of Birth" value={enrollmentData.learnerInfo?.placeOfBirth} col="col-12 col-sm-6 col-md-4" />
                      <WebField label="Age" value={enrollmentData.learnerInfo?.age} col="col-6 col-sm-3 col-md-1" />
                      <div className="col-6 col-sm-3 col-md-2 mb-2">
                        <div className="text-uppercase fw-semibold text-muted" style={{ fontSize: '10px', letterSpacing: '0.6px', marginBottom: '3px' }}>Sex</div>
                        <div className="d-flex gap-3" style={{ fontSize: '14px', fontWeight: '500' }}>
                          <span className="d-flex align-items-center gap-1"><WCB checked={enrollmentData.learnerInfo?.sex === 'Male'} /> Male</span>
                          <span className="d-flex align-items-center gap-1"><WCB checked={enrollmentData.learnerInfo?.sex === 'Female'} /> Female</span>
                        </div>
                      </div>
                    </div>
                    <div className="row g-2 mb-1">
                      <WebField label="Email Address" value={enrollmentData.learnerInfo?.email} col="col-12 col-sm-6" />
                      <WebField label="Mother Tongue" value={enrollmentData.learnerInfo?.motherTongue} col="col-12 col-sm-6" />
                    </div>
                    <div className="row g-2 mb-1">
                      <WebField label="Learner Reference No. (LRN)" value={enrollmentData.learnerInfo?.lrn} col="col-12 col-sm-6" />
                      <WebField label="PSA Birth Certificate No." value={enrollmentData.psaNo} col="col-12 col-sm-6" />
                    </div>
                    <hr className="my-2" style={{ borderStyle: 'dashed' }} />
                    <div className="d-flex flex-wrap gap-3" style={{ fontSize: '13px' }}>
                      <span className="d-flex align-items-center gap-2"><WCB checked={enrollmentData.isReturning} /> Returning Learner (Balik-Aral)</span>
                      <span className="d-flex align-items-center gap-2">
                        <WCB checked={enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> Learner with Disability
                        {enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled && <span className="text-danger" style={{ fontSize: '12px' }}>({enrollmentData.learnerInfo?.learnerWithDisability?.disabilityType?.join(', ')})</span>}
                      </span>
                      <span className="d-flex align-items-center gap-2">
                        <WCB checked={enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> IP Community Member
                        {enrollmentData.learnerInfo?.indigenousCommunity?.isMember && <span className="text-danger" style={{ fontSize: '12px' }}>({enrollmentData.learnerInfo?.indigenousCommunity?.name})</span>}
                      </span>
                      <span className="d-flex align-items-center gap-2">
                        <WCB checked={enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> 4Ps Beneficiary
                        {enrollmentData.learnerInfo?.fourPs?.isBeneficiary && <span className="text-danger" style={{ fontSize: '12px' }}>(ID: {enrollmentData.learnerInfo?.fourPs?.householdId})</span>}
                      </span>
                    </div>
                  </>
                )}
              </SectionBody>

              {/* ══ II. ADDRESS ══ */}
              <SectionHeader title="II. Address" />
              <SectionBody>
                {isPDF ? (
                  <>
                    <div style={s.subSectionLabel}>Current Address</div>
                    <div style={s.pdfRow}>
                      <PdfField label="House No. / Street" value={`${enrollmentData.address?.current?.houseNo || ''} ${enrollmentData.address?.current?.street || ''}`.trim()} />
                      <PdfField label="Barangay" value={enrollmentData.address?.current?.barangay} />
                    </div>
                    {/* Condensed: municipality/province/region/zip/contact all in one row */}
                    <div style={s.pdfRow}>
                      <PdfField label="Municipality / City" value={enrollmentData.address?.current?.municipality} />
                      <PdfField label="Province" value={enrollmentData.address?.current?.province} />
                      <PdfField label="Region" value={enrollmentData.address?.current?.region} />
                      <PdfField label="Zip" value={enrollmentData.address?.current?.zipCode} flex={0.4} />
                      <PdfField label="Contact No." value={enrollmentData.address?.current?.contactNumber} />
                    </div>
                    <div style={s.divider} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                      <CB checked={enrollmentData.address?.permanent?.sameAsCurrent} />
                      <span style={s.subSectionLabel}>Permanent Address</span>
                      {enrollmentData.address?.permanent?.sameAsCurrent && <span style={{ color: '#555', fontSize: '6.5px' }}>(Same as current)</span>}
                    </div>
                    {!enrollmentData.address?.permanent?.sameAsCurrent && (
                      <>
                        <div style={s.pdfRow}>
                          <PdfField label="House No. / Street" value={`${enrollmentData.address?.permanent?.houseNo || ''} ${enrollmentData.address?.permanent?.street || ''}`.trim()} />
                          <PdfField label="Barangay" value={enrollmentData.address?.permanent?.barangay} />
                        </div>
                        <div style={{ ...s.pdfRow, marginBottom: 0 }}>
                          <PdfField label="Municipality / City" value={enrollmentData.address?.permanent?.municipality} />
                          <PdfField label="Province" value={enrollmentData.address?.permanent?.province} />
                          <PdfField label="Zip Code" value={enrollmentData.address?.permanent?.zipCode} flex={0.4} />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <SubLabel>Current Address</SubLabel>
                    <div className="row g-2">
                      <WebField label="House No. / Street" value={`${enrollmentData.address?.current?.houseNo || ''} ${enrollmentData.address?.current?.street || ''}`.trim()} col="col-12 col-sm-6" />
                      <WebField label="Barangay" value={enrollmentData.address?.current?.barangay} col="col-12 col-sm-6" />
                    </div>
                    <div className="row g-2">
                      <WebField label="Municipality / City" value={enrollmentData.address?.current?.municipality} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Province" value={enrollmentData.address?.current?.province} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Region" value={enrollmentData.address?.current?.region} col="col-12 col-sm-6 col-md-3" />
                      <WebField label="Zip Code" value={enrollmentData.address?.current?.zipCode} col="col-6 col-sm-3 col-md-2" />
                    </div>
                    <div className="row g-2">
                      <WebField label="Contact Number" value={enrollmentData.address?.current?.contactNumber} col="col-12 col-sm-6" />
                    </div>
                    <hr className="my-2" style={{ borderStyle: 'dashed' }} />
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <WCB checked={enrollmentData.address?.permanent?.sameAsCurrent} />
                      <span className="fw-semibold text-uppercase" style={{ color: '#7f1d1d', fontSize: '11px' }}>Permanent Address</span>
                      {enrollmentData.address?.permanent?.sameAsCurrent && <span className="text-muted" style={{ fontSize: '12px' }}>(Same as current)</span>}
                    </div>
                    {!enrollmentData.address?.permanent?.sameAsCurrent && (
                      <>
                        <div className="row g-2">
                          <WebField label="House No. / Street" value={`${enrollmentData.address?.permanent?.houseNo || ''} ${enrollmentData.address?.permanent?.street || ''}`.trim()} col="col-12 col-sm-6" />
                          <WebField label="Barangay" value={enrollmentData.address?.permanent?.barangay} col="col-12 col-sm-6" />
                        </div>
                        <div className="row g-2">
                          <WebField label="Municipality / City" value={enrollmentData.address?.permanent?.municipality} col="col-12 col-sm-6 col-md-4" />
                          <WebField label="Province" value={enrollmentData.address?.permanent?.province} col="col-12 col-sm-6 col-md-4" />
                          <WebField label="Zip Code" value={enrollmentData.address?.permanent?.zipCode} col="col-6 col-sm-3 col-md-2" />
                        </div>
                      </>
                    )}
                  </>
                )}
              </SectionBody>

              {/* ══ III. PARENT / GUARDIAN ══ */}
              <SectionHeader title="III. Parent / Guardian Information" />
              <SectionBody>
                {[
                  { title: "Father's Information", data: enrollmentData.parentGuardianInfo?.father },
                  { title: "Mother's Information", data: enrollmentData.parentGuardianInfo?.mother },
                  { title: "Guardian's Information", data: enrollmentData.parentGuardianInfo?.guardian, extra: enrollmentData.parentGuardianInfo?.guardian?.relationship },
                ].map((p, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? (isPDF ? '3px' : '10px') : 0 }}>
                    <SubLabel>{p.title}{p.extra ? ` — Relationship: ${p.extra}` : ''}</SubLabel>
                    {isPDF ? (
                      <div style={{ ...s.pdfRow, marginBottom: 0 }}>
                        <PdfField label="Last Name" value={p.data?.lastName} />
                        <PdfField label="First Name" value={p.data?.firstName} />
                        <PdfField label="Middle Name" value={p.data?.middleName} />
                        <PdfField label="Contact No." value={p.data?.contactNumber} />
                      </div>
                    ) : (
                      <div className="row g-2">
                        <WebField label="Last Name" value={p.data?.lastName} col="col-12 col-sm-6 col-md-3" />
                        <WebField label="First Name" value={p.data?.firstName} col="col-12 col-sm-6 col-md-3" />
                        <WebField label="Middle Name" value={p.data?.middleName} col="col-12 col-sm-6 col-md-3" />
                        <WebField label="Contact No." value={p.data?.contactNumber} col="col-12 col-sm-6 col-md-3" />
                      </div>
                    )}
                    {i < 2 && (isPDF ? <div style={s.divider} /> : <hr className="my-2" style={{ borderStyle: 'dashed' }} />)}
                  </div>
                ))}
              </SectionBody>

              {/* ══ IV. SCHOOL HISTORY (conditional) ══ */}
              {enrollmentData.schoolHistory?.returningLearner && (
                <>
                  <SectionHeader title="IV. School History (For Returning / Transferee)" />
                  <SectionBody>
                    {isPDF ? (
                      <>
                        <div style={s.pdfRow}>
                          <PdfField label="Last Grade Level Completed" value={enrollmentData.schoolHistory?.lastGradeLevelCompleted} />
                          <PdfField label="Last School Year Completed" value={enrollmentData.schoolHistory?.lastSchoolYearCompleted} />
                        </div>
                        <div style={{ ...s.pdfRow, marginBottom: 0 }}>
                          <PdfField label="Last School Attended" value={enrollmentData.schoolHistory?.lastSchoolAttended} />
                          <PdfField label="School ID" value={enrollmentData.schoolHistory?.schoolId} flex={0.5} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="row g-2">
                          <WebField label="Last Grade Level Completed" value={enrollmentData.schoolHistory?.lastGradeLevelCompleted} col="col-12 col-sm-6" />
                          <WebField label="Last School Year Completed" value={enrollmentData.schoolHistory?.lastSchoolYearCompleted} col="col-12 col-sm-6" />
                        </div>
                        <div className="row g-2">
                          <WebField label="Last School Attended" value={enrollmentData.schoolHistory?.lastSchoolAttended} col="col-12 col-sm-8" />
                          <WebField label="School ID" value={enrollmentData.schoolHistory?.schoolId} col="col-12 col-sm-4" />
                        </div>
                      </>
                    )}
                  </SectionBody>
                </>
              )}

              {/* ══ SHS PROGRAM ══ */}
              <SectionHeader title={`${enrollmentData.schoolHistory?.returningLearner ? 'V.' : 'IV.'} Senior High School Program`} />
              <SectionBody>
                {isPDF ? (
                  <div style={{ ...s.pdfRow, marginBottom: 0 }}>
                    <PdfField label="Grade Level" value={enrollmentData.gradeLevelToEnroll} />
                    <PdfField label="Semester" value={enrollmentData.seniorHigh?.semester === 1 ? 'First Semester' : enrollmentData.seniorHigh?.semester === 2 ? 'Second Semester' : '—'} />
                    <PdfField label="Track" value={enrollmentData.seniorHigh?.track} />
                    <PdfField label="Strand" value={enrollmentData.seniorHigh?.strand} />
                    <PdfField label="Student Type" value={enrollmentData.studentType} flex={0.6} />
                  </div>
                ) : (
                  <div className="row g-2">
                    <WebField label="Grade Level" value={enrollmentData.gradeLevelToEnroll} col="col-6 col-sm-4 col-md-2" />
                    <WebField label="Semester" value={enrollmentData.seniorHigh?.semester === 1 ? 'First Semester' : enrollmentData.seniorHigh?.semester === 2 ? 'Second Semester' : '—'} col="col-6 col-sm-4 col-md-3" />
                    <WebField label="Track" value={enrollmentData.seniorHigh?.track} col="col-12 col-sm-4 col-md-3" />
                    <WebField label="Strand" value={enrollmentData.seniorHigh?.strand} col="col-12 col-sm-4 col-md-2" />
                    <WebField label="Student Type" value={enrollmentData.studentType} col="col-12 col-sm-4 col-md-2" />
                  </div>
                )}
              </SectionBody>

              {/* ══ REGISTRAR'S USE ══ */}
              <SectionHeader title="For Registrar's Use Only" />
              <SectionBody mb={false}>
                {isPDF ? (
                  <>
                    <div style={s.pdfRow}>
                      <div style={{ flex: 1 }}>
                        <div style={s.fieldLabel}>Application Status</div>
                        <div style={{ marginTop: '2px' }}>
                          <span style={s.statusBadge(enrollmentData.status)}>{enrollmentData.status?.toUpperCase() || '—'}</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={s.fieldLabel}>Date Submitted</div>
                        <div style={s.fieldValue}>{formatDate(enrollmentData.signature?.dateSigned || enrollmentData.createdAt)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={s.fieldLabel}>Date Printed</div>
                        <div style={s.fieldValue}>{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div style={s.sigSection}>
                      <div style={s.sigBox}>
                        <div style={s.sigLine}></div>
                        <div style={s.sigLabel}>Signature of Registrar over Printed Name</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row g-2 align-items-start">
                      <div className="col-12 col-sm-4 mb-2">
                        <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '0.6px' }}>Application Status</div>
                        {(() => {
                          const st = enrollmentData.status;
                          const cls = st === 'approved' ? 'bg-success-subtle text-success border border-success-subtle'
                            : st === 'rejected' ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : 'bg-warning-subtle text-warning border border-warning-subtle';
                          return <span className={`badge fs-6 px-3 py-1 ${cls}`}>{st?.toUpperCase() || '—'}</span>;
                        })()}
                      </div>
                      <WebField label="Date Submitted" value={formatDate(enrollmentData.signature?.dateSigned || enrollmentData.createdAt)} col="col-12 col-sm-4" />
                      <WebField label="Date Printed" value={new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} col="col-12 col-sm-4" />
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <div className="text-center" style={{ width: '220px' }}>
                        <div className="border-top border-dark mb-1"></div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>Signature of Registrar over Printed Name</div>
                      </div>
                    </div>
                  </>
                )}
              </SectionBody>

              {/* Footer */}
              {isPDF ? (
                <div style={s.footerText}>
                  Francisco Osorio Integrated Senior High School &nbsp;|&nbsp; Trece Martires City, Cavite &nbsp;|&nbsp; This document is system-generated and valid without signature unless otherwise specified.
                </div>
              ) : (
                <div className="text-center text-muted border-top pt-2 mt-3" style={{ fontSize: '11px' }}>
                  Francisco Osorio Integrated Senior High School &nbsp;|&nbsp; Trece Martires City, Cavite &nbsp;|&nbsp; This document is system-generated and valid without signature unless otherwise specified.
                </div>
              )}

            </PageWrap>

            {/* ══════════════════════════════════════════════
                DOCUMENT PAGES — forced page break, zero gap
            ══════════════════════════════════════════════ */}
            {documents.map((doc, idx) => (
              <PageWrap key={idx} pdfStyle={s.docPage}>

                {isPDF ? (
                  <div style={{ ...s.header, marginBottom: '5px' }}>
                    <img src={deped} alt="DepEd" style={{ width: '32px', height: '32px' }} crossOrigin="anonymous" />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ ...s.schoolName, fontSize: '9.5px', margin: 0 }}>Francisco Osorio Integrated Senior High School</p>
                      <p style={{ ...s.schoolSub, margin: '1px 0 0' }}>Enrollment Supporting Document — S.Y. {enrollmentData.schoolYear}</p>
                    </div>
                    <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center gap-3 pb-3 mb-3 border-bottom">
                    <img src={deped} alt="DepEd" style={{ width: '44px', height: '44px' }} />
                    <div className="text-center">
                      <p className="fw-bold mb-0 fs-5" style={{ color: '#7f1d1d' }}>Francisco Osorio Integrated Senior High School</p>
                      <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>Enrollment Supporting Document — S.Y. {enrollmentData.schoolYear}</p>
                    </div>
                    <img src={logo} alt="Logo" style={{ width: '44px', height: '44px' }} />
                  </div>
                )}

                {isPDF ? (
                  <div style={s.studentInfoStrip}>
                    <span><strong>Name:</strong> {val(enrollmentData.learnerInfo?.lastName)}, {val(enrollmentData.learnerInfo?.firstName)} {val(enrollmentData.learnerInfo?.middleName)}</span>
                    <span><strong>LRN:</strong> {val(enrollmentData.learnerInfo?.lrn)}</span>
                    <span><strong>Grade:</strong> {val(enrollmentData.gradeLevelToEnroll)}</span>
                    <span><strong>Track/Strand:</strong> {val(enrollmentData.seniorHigh?.track)} - {val(enrollmentData.seniorHigh?.strand)}</span>
                  </div>
                ) : (
                  <div className="rounded px-3 py-2 mb-3 d-flex flex-wrap gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px' }}>
                    <span><strong>Name:</strong> {val(enrollmentData.learnerInfo?.lastName)}, {val(enrollmentData.learnerInfo?.firstName)} {val(enrollmentData.learnerInfo?.middleName)}</span>
                    <span><strong>LRN:</strong> {val(enrollmentData.learnerInfo?.lrn)}</span>
                    <span><strong>Grade:</strong> {val(enrollmentData.gradeLevelToEnroll)}</span>
                    <span><strong>Track/Strand:</strong> {val(enrollmentData.seniorHigh?.track)} - {val(enrollmentData.seniorHigh?.strand)}</span>
                  </div>
                )}

                {isPDF ? (
                  <div style={s.docHeader}>{`Document ${idx + 1} of ${documents.length}: ${doc.title}`}</div>
                ) : (
                  <div className="fw-bold text-white px-3 py-2 mb-3 text-uppercase"
                    style={{ background: '#7f1d1d', fontSize: '13px', letterSpacing: '1px' }}>
                    {`Document ${idx + 1} of ${documents.length}: ${doc.title}`}
                  </div>
                )}

                <div className="d-flex justify-content-center align-items-center border"
                  style={isPDF ? { padding: '4px', overflow: 'hidden' } : { minHeight: '400px', padding: '12px' }}>
                  <img src={doc.path} alt={doc.title} style={s.docImg} crossOrigin="anonymous" />
                </div>

                {isPDF ? (
                  <div style={s.footerText}>
                    {doc.title} &nbsp;|&nbsp; {enrollmentData.learnerInfo?.lastName}, {enrollmentData.learnerInfo?.firstName} &nbsp;|&nbsp; S.Y. {enrollmentData.schoolYear} &nbsp;|&nbsp; Page {idx + 2}
                  </div>
                ) : (
                  <div className="text-center text-muted border-top pt-2 mt-2" style={{ fontSize: '11px' }}>
                    {doc.title} &nbsp;|&nbsp; {enrollmentData.learnerInfo?.lastName}, {enrollmentData.learnerInfo?.firstName} &nbsp;|&nbsp; S.Y. {enrollmentData.schoolYear} &nbsp;|&nbsp; Page {idx + 2}
                  </div>
                )}

              </PageWrap>
            ))}

          </div>
        </div>
      </div>

      {/* ── Approve Modal ── */}
      {openModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Approve Applicant</h5>
                <button type="button" className="btn-close" onClick={() => setOpenModal(false)}></button>
              </div>
              <div className="modal-body text-center">
                <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
                <h5 className="mb-3">Approve Application?</h5>
                <p className="text-muted">
                  Do you want to approve the enrollment application of:<br />
                  <strong className="text-capitalize">{enrollmentData?.learnerInfo?.firstName} {enrollmentData?.learnerInfo?.lastName}</strong><br />
                  <span className="badge bg-secondary mt-2">{enrollmentData?.gradeLevelToEnroll} - S.Y. {enrollmentData?.schoolYear}</span>
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                <button type="button" className="btn btn-success" disabled={isApproving}
                  onClick={async () => {
                    try {
                      setIsApproving(true);
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enrollmentId: enrollmentData._id }),
                        credentials: "include",
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message);
                      setOpenModal(false);
                      showAlert(data.message, 'success');
                      setTimeout(() => navigate(`/${role}/applicants`, { replace: true }), 1500);
                    } catch (error) {
                      setOpenModal(false);
                      showAlert(error.message, 'error');
                    } finally { setIsApproving(false); }
                  }}
                >
                  {isApproving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Approving...</>
                    : <><i className="fa fa-check me-2" />Yes, Approve</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Modal ── */}
      {showAlertModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body text-center p-4">
                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                  <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                </div>
                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
                <p className="text-muted mb-4">{alertMessage}</p>
                <button type="button"
                  className={`btn ${alertType === 'success' ? 'btn-success' : 'btn-danger'} px-4`}
                  onClick={() => setShowAlertModal(false)}>
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

export default EnrollmentFormPDF;