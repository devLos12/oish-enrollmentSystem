import React, { useRef, useEffect, useLayoutEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { globalContext } from '../context/global';
import ApplicantFormPDF from './applicant-Form-Pdf';
import depedLogo from "../assets/image/deped.png";
import schoolLogo from "../assets/image/logo.png";







const ApplicantForm = () => {
  const { role, setTextHeader } = useContext(globalContext);
  const pdfRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const enrollmentData = location?.state?.applicant || {};

  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  



  useEffect(() => {
    if (!location?.state) navigate(`/admin`, { replace: true });
  }, [location?.state, navigate]);

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };



  const handleDownloadPDF = async () => {
      setIsDownloading(true);
      try {
        const element = pdfRef.current;

        // Pre-convert all images to base64 so html2canvas can render them cross-origin
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img =>
          new Promise(resolve => {
            const convert = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              canvas.getContext('2d').drawImage(img, 0, 0);
              img.src = canvas.toDataURL('image/png');
              resolve();
            };
            img.complete ? convert() : (img.onload = convert);
          })
        );
        await Promise.all(imagePromises);

        const opt = {
          margin: 0,
          filename: `Enrollment-Form-${enrollmentData?.learnerInfo?.lastName || 'Unknown'}-${enrollmentData?.schoolYear || ''}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 5,           // ✅ scale: 1 lang — scale: 2 nagdodoble ng height kaya malaki ang page
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 794,         // A4 width sa 96dpi
            windowWidth: 794,   // ✅ kailangan din ito para consistent ang layout ng PDF template
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
      } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
      } finally {
        setIsDownloading(false);
      }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const val = (v) => (!v || v === 'N/A') ? 'N/A' : v;

  const WCB = ({ checked }) => (
    <span
      className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: '16px', height: '16px', border: '1.5px solid #7f1d1d',
        fontSize: '12px', color: '#7f1d1d',
      }}
    >
      {checked ? '✓' : ''}
    </span>
  );

  const WebField = ({ label, value, col = 'col-12 col-sm-6 col-md-3' }) => (
    <div className={`${col} mb-2`}>
      <div style={{ fontSize: '10px', letterSpacing: '0.6px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', minHeight: '22px', color: '#111827', fontWeight: '500', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>
        {val(value)}
      </div>
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div
      className="fw-bold text-white px-3 py-2 mb-0"
      style={{ background: '#7f1d1d', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}
    >
      {title}
    </div>
  );

  const SectionBody = ({ children, mb = true }) => (
    <div className={`border border-top-0 p-3 ${mb ? 'mb-3' : ''}`} style={{ borderColor: '#e5e7eb' }}>
      {children}
    </div>
  );

  const SubLabel = ({ children }) => (
    <div className="fw-semibold mb-2" style={{ color: '#7f1d1d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {children}
    </div>
  );

  const documents = [
    { title: 'PSA Birth Certificate', path: enrollmentData.requiredDocuments?.psaBirthCert?.filePath },
    { title: 'Report Card (Form 138)', path: enrollmentData.requiredDocuments?.reportCard?.filePath },
    { title: 'Good Moral Certificate', path: enrollmentData.requiredDocuments?.goodMoral?.filePath },
    { title: '2x2 ID Picture', path: enrollmentData.requiredDocuments?.idPicture?.filePath },
  ].filter(d => d.path);

  const statusClass = enrollmentData.status === 'approved'
    ? 'bg-success-subtle text-success border border-success-subtle'
    : enrollmentData.status === 'rejected'
    ? 'bg-danger-subtle text-danger border border-danger-subtle'
    : 'bg-warning-subtle text-warning border border-warning-subtle';

  return (
    <>
      {/* Hidden PDF Template — rendered offscreen for html2pdf */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div ref={pdfRef}>
          <ApplicantFormPDF enrollmentData={enrollmentData} />
        </div>
      </div>

      {/* ═══ WEB VIEW ═══ */}
      <div style={{ background: '#f3f4f6', minHeight: '100vh', padding: '20px 0' }}>

        {/* Action Bar */}
        <div className="container-fluid px-3 mb-3" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => navigate(-1)}
              disabled={isDownloading}
            >
              <i className="fa fa-arrow-left me-2" />Back
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading
                ? <><span className="spinner-border spinner-border-sm me-2" />Downloading...</>
                : <><i className="fa fa-download me-2" />Download PDF</>}
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={() => setOpenModal(true)}
              disabled={enrollmentData?.status === 'approved' || isDownloading || isApproving}
            >
              {enrollmentData?.status === 'approved'
                ? 'Approved'
                : isApproving
                ? <><span className="spinner-border spinner-border-sm me-2" />Approving...</>
                : 'Approve'}
            </button>
          </div>
        </div>

        <div className="container-fluid px-3" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="bg-white rounded shadow-sm p-3 p-md-4">

            {/* School Header */}
            <div className="d-flex align-items-center justify-content-center gap-3 pb-3 mb-3" style={{ borderBottom: '2px solid #7f1d1d' }}>
              <img src={`${depedLogo}`} alt="DepEd" style={{ width: '56px', height: '56px' }} />
              <div className="text-center">
                <p className="fw-bold mb-0" style={{ fontSize: '18px', color: '#7f1d1d' }}>
                  Francisco Osorio Integrated Senior High School
                </p>
                <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                  Barangay Osorio, Trece Martires City, Cavite
                </p>
                <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                  Department of Education — Region IV-A CALABARZON
                </p>
              </div>
              <img src={`${schoolLogo}`} alt="Logo" style={{ width: '56px', height: '56px' }} />
            </div>

            {/* Form Title */}
            <div className="text-center mb-3">
              <div className="fw-bold text-uppercase" style={{ color: '#7f1d1d', letterSpacing: '2px', fontSize: '16px' }}>
                Student Enrollment Form
              </div>
              <div className="text-muted mt-1" style={{ fontSize: '13px' }}>
                School Year: <strong>{enrollmentData.schoolYear || '________'}</strong>
                &nbsp;|&nbsp; Grade Level: <strong>{enrollmentData.gradeLevelToEnroll || '________'}</strong>
                &nbsp;|&nbsp; Semester: <strong>{enrollmentData.seniorHigh?.semester === 1 ? 'First' : enrollmentData.seniorHigh?.semester === 2 ? 'Second' : '—'}</strong>
              </div>
            </div>

            {/* I. LEARNER INFO */}
            <SectionHeader title="I. Learner Information" />
            <SectionBody>
              <div className="row g-2 mb-1">
                <WebField label="Last Name" value={enrollmentData.learnerInfo?.lastName} col="col-12 col-sm-6 col-md-3" />
                <WebField label="First Name" value={enrollmentData.learnerInfo?.firstName} col="col-12 col-sm-6 col-md-3" />
                <WebField label="Middle Name" value={enrollmentData.learnerInfo?.middleName} col="col-12 col-sm-6 col-md-3" />
                <WebField label="Ext." value={enrollmentData.learnerInfo?.extensionName} col="col-6 col-sm-3 col-md-1" />
              </div>
              <div className="row g-2 mb-1">
                <WebField label="Date of Birth" value={formatDate(enrollmentData.learnerInfo?.birthDate)} col="col-12 col-sm-6 col-md-3" />
                <WebField label="Place of Birth" value={enrollmentData.learnerInfo?.placeOfBirth} col="col-12 col-sm-6 col-md-4" />
                <WebField label="Age" value={enrollmentData.learnerInfo?.age} col="col-4 col-sm-2 col-md-1" />
                <div className="col-8 col-sm-4 col-md-2 mb-2">
                  <div style={{ fontSize: '10px', letterSpacing: '0.6px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>Sex</div>
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
              <hr className="my-2" style={{ borderStyle: 'dashed', borderColor: '#e5e7eb' }} />
              <div className="d-flex flex-wrap gap-3" style={{ fontSize: '13px' }}>
                <span className="d-flex align-items-center gap-2">
                  <WCB checked={enrollmentData.isReturning} /> Returning Learner (Balik-Aral)
                </span>
                <span className="d-flex align-items-center gap-2">
                  <WCB checked={enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> Learner with Disability
                  {enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                      ({enrollmentData.learnerInfo?.learnerWithDisability?.disabilityType?.join(', ')})
                    </span>
                  )}
                </span>
                <span className="d-flex align-items-center gap-2">
                  <WCB checked={enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> IP Community Member
                  {enrollmentData.learnerInfo?.indigenousCommunity?.isMember && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                      ({enrollmentData.learnerInfo?.indigenousCommunity?.name})
                    </span>
                  )}
                </span>
                <span className="d-flex align-items-center gap-2">
                  <WCB checked={enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> 4Ps Beneficiary
                  {enrollmentData.learnerInfo?.fourPs?.isBeneficiary && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                      (ID: {enrollmentData.learnerInfo?.fourPs?.householdId})
                    </span>
                  )}
                </span>
              </div>
            </SectionBody>

            {/* II. ADDRESS */}
            <SectionHeader title="II. Address" />
            <SectionBody>
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
              <hr className="my-2" style={{ borderStyle: 'dashed', borderColor: '#e5e7eb' }} />
              <div className="d-flex align-items-center gap-2 mb-2">
                <WCB checked={enrollmentData.address?.permanent?.sameAsCurrent} />
                <SubLabel>
                  Permanent Address
                  {enrollmentData.address?.permanent?.sameAsCurrent && (
                    <span className="text-muted fw-normal ms-2" style={{ fontSize: '12px' }}>(Same as current)</span>
                  )}
                </SubLabel>
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
            </SectionBody>

            {/* III. PARENTS */}
            <SectionHeader title="III. Parent / Guardian Information" />
            <SectionBody>
              {[
                { title: "Father's Information", data: enrollmentData.parentGuardianInfo?.father },
                { title: "Mother's Information", data: enrollmentData.parentGuardianInfo?.mother },
                { title: `Guardian's Information${enrollmentData.parentGuardianInfo?.guardian?.relationship ? ` — Relationship: ${enrollmentData.parentGuardianInfo?.guardian?.relationship}` : ''}`, data: enrollmentData.parentGuardianInfo?.guardian },
              ].filter(p => {
                const d = p.data;
                if (!d) return false;
                return [d.lastName, d.firstName, d.middleName, d.contactNumber]
                  .some(f => f && f !== 'N/A' && f.trim() !== '');
              })
              .map((p, i, arr) => (
                <div key={i}>
                  <SubLabel>{p.title}</SubLabel>
                  <div className="row g-2">
                    <WebField label="Last Name" value={p.data?.lastName} col="col-12 col-sm-6 col-md-3" />
                    <WebField label="First Name" value={p.data?.firstName} col="col-12 col-sm-6 col-md-3" />
                    <WebField label="Middle Name" value={p.data?.middleName} col="col-12 col-sm-6 col-md-3" />
                    <WebField label="Contact No." value={p.data?.contactNumber} col="col-12 col-sm-6 col-md-3" />
                  </div>
                  {i < arr.length - 1 && <hr className="my-2" style={{ borderStyle: 'dashed', borderColor: '#e5e7eb' }} />}
                </div>
              ))}
            </SectionBody>

            {/* IV. SCHOOL HISTORY */}
            {enrollmentData.schoolHistory?.returningLearner && (
              <>
                <SectionHeader title="IV. School History (For Returning / Transferee)" />
                <SectionBody>
                  <div className="row g-2">
                    <WebField label="Last Grade Level Completed" value={enrollmentData.schoolHistory?.lastGradeLevelCompleted} col="col-12 col-sm-6" />
                    <WebField label="Last School Year Completed" value={enrollmentData.schoolHistory?.lastSchoolYearCompleted} col="col-12 col-sm-6" />
                  </div>
                  <div className="row g-2">
                    <WebField label="Last School Attended" value={enrollmentData.schoolHistory?.lastSchoolAttended} col="col-12 col-sm-8" />
                    <WebField label="School ID" value={enrollmentData.schoolHistory?.schoolId} col="col-12 col-sm-4" />
                  </div>
                </SectionBody>
              </>
            )}

            {/* SHS PROGRAM */}
            <SectionHeader title={`${enrollmentData.schoolHistory?.returningLearner ? 'V.' : 'IV.'} Senior High School Program`} />
            <SectionBody>
              <div className="row g-2">
                <WebField label="Grade Level" value={enrollmentData.gradeLevelToEnroll} col="col-6 col-sm-4 col-md-2" />
                <WebField label="Semester" value={enrollmentData.seniorHigh?.semester === 1 ? 'First Semester' : enrollmentData.seniorHigh?.semester === 2 ? 'Second Semester' : '—'} col="col-6 col-sm-4 col-md-3" />
                <WebField label="Track" value={enrollmentData.seniorHigh?.track} col="col-12 col-sm-4 col-md-3" />
                <WebField label="Strand" value={enrollmentData.seniorHigh?.strand} col="col-12 col-sm-4 col-md-2" />
                <WebField label="Student Type" value={enrollmentData.studentType} col="col-12 col-sm-4 col-md-2" />
              </div>
            </SectionBody>

            {/* REGISTRAR */}
            <SectionHeader title="For Registrar's Use Only" />
            <SectionBody mb={false}>
              <div className="row g-2 align-items-start">
                <div className="col-12 col-sm-4 mb-2">
                  <div style={{ fontSize: '10px', letterSpacing: '0.6px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Application Status
                  </div>
                  <span className={`badge fs-6 px-3 py-1 ${statusClass}`}>
                    {enrollmentData.status?.toUpperCase() || '—'}
                  </span>
                </div>
                <WebField label="Date Submitted" value={formatDate(enrollmentData.signature?.dateSigned || enrollmentData.createdAt)} col="col-12 col-sm-4" />
                <WebField label="Date Printed" value={new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} col="col-12 col-sm-4" />
              </div>
              <div className="d-flex justify-content-center mt-5">
                <div className="text-center" >
                  <div className="border-top border-dark mb-1" />
                  <div className="text-muted" style={{ fontSize: '12px' }}>Signature of Registrar over Printed Name</div>
                </div>
              </div>
            </SectionBody>

            <div className="text-center text-muted border-top pt-2 mt-3" style={{ fontSize: '11px' }}>
              Francisco Osorio Integrated Senior High School &nbsp;|&nbsp; Trece Martires City, Cavite &nbsp;|&nbsp;
              This document is system-generated.
            </div>

            {/* DOCUMENTS */}
            {documents.length > 0 && (
              <div className="mt-4">
                <div className="fw-bold text-white px-3 py-2 mb-3" style={{ background: '#7f1d1d', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Required Documents
                </div>
                <div className="row g-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="col-12 col-sm-6">
                      <div className="border rounded overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                        <div className="px-3 py-2 fw-semibold" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#374151' }}>
                          {doc.title}
                        </div>
                        <div className="d-flex justify-content-center align-items-center p-2" style={{ minHeight: '200px', background: '#fff' }}>
                          <img
                            src={doc.path}
                            alt={doc.title}
                            style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', cursor: 'pointer' }}
                            onClick={() => window.open(doc.path, '_blank')}
                          />
                        </div>
                        <div className="px-3 py-1 text-center" style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280' }}>
                          Click image to view full size
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {openModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Approve Applicant</h5>
                <button type="button" className="btn-close" onClick={() => setOpenModal(false)} />
              </div>
              <div className="modal-body text-center">
                <i className="fa fa-check-circle fa-3x text-success mb-3" />
                <h5 className="mb-3">Approve Application?</h5>
                <p className="text-muted">
                  Do you want to approve the enrollment application of:<br />
                  <strong className="text-capitalize">{enrollmentData?.learnerInfo?.firstName} {enrollmentData?.learnerInfo?.lastName}</strong><br />
                  <span className="badge bg-secondary mt-2">{enrollmentData?.gradeLevelToEnroll} - S.Y. {enrollmentData?.schoolYear}</span>
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={isApproving}
                  onClick={async () => {
                    try {
                      setIsApproving(true);
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enrollmentId: enrollmentData._id }),
                        credentials: 'include',
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message);
                      setOpenModal(false);
                      showAlert(data.message, 'success');
                      setTimeout(() => navigate(`/${role}/applicants`, { replace: true }), 1500);
                    } catch (error) {
                      setOpenModal(false);
                      showAlert(error.message, 'error');
                    } finally {
                      setIsApproving(false);
                    }
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

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body text-center p-4">
                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                  <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`} />
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

export default ApplicantForm;