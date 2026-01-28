import React, { useRef, useEffect, useLayoutEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { globalContext } from '../context/global';
import deped from "../assets/image/deped.png";
import logo from "../assets/image/logo.png";



const EnrollmentFormPDF = () => {
  const { role} = useContext(globalContext);
  const formRef = useRef();
  const [openModal, setOpenModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const enrollmentData = location?.state?.applicant || {};
  const [isDownloading, setIsDownloading] = useState(false);
  

  useEffect(() => {
    if (!location?.state) {
      navigate(`/admin`, { replace: true });
      return;
    }
  }, [location?.state, navigate]);

  useLayoutEffect(() => {
    if (location?.state?.autoDownload) {
      handleDownloadPDF();
    }
  }, [location?.state?.autoDownload]);


  const handleDownloadPDF = async () => {
      setIsDownloading(true); // ✅ Start loading
      
      try {
          const element = formRef.current;
          
          const images = element.getElementsByTagName('img');
          const imagePromises = Array.from(images).map(img => {
              return new Promise((resolve) => {
                  if (img.complete) {
                      const canvas = document.createElement('canvas');
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(img, 0, 0);
                      img.src = canvas.toDataURL('image/png');
                      resolve();
                  } else {
                      img.onload = () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = img.naturalWidth;
                          canvas.height = img.naturalHeight;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0);
                          img.src = canvas.toDataURL('image/png');
                          resolve();
                      };
                  }
              });
          });

          await Promise.all(imagePromises);

          const opt = {
              margin: [10, 10, 10, 10],
              filename: `Enrollment-Form-${enrollmentData?.learnerInfo?.lastName || 'Unknown'}-${enrollmentData?.schoolYear || ''}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { 
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  logging: false
              },
              jsPDF: { 
                  unit: 'mm', 
                  format: 'a4', 
                  orientation: 'portrait' 
              }
          };
          
          await html2pdf().set(opt).from(element).save();
          
          // ✅ Only navigate if auto-download
          if(location?.state?.autoDownload){
              navigate(`/${role}/applicants`);
          }
      } catch (error) {
          console.error('Error downloading PDF:', error);
          alert('Failed to download PDF. Please try again.');
      } finally {
          setIsDownloading(false); // ✅ Stop loading
      }
  };


  const CheckBox = ({ checked }) => (
    <span className="d-inline-block border border-dark text-center me-1" style={{ width: '16px', height: '16px', lineHeight: '16px', fontSize: '11px' }}>
      {checked && '✓'}
    </span>
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const hiddenStyle = location?.state?.autoDownload
    ? { position: "absolute", opacity: 0, pointerEvents: "none", left: "-9999px", top: "-9999px" }
    : {};


    
  const FieldRow = ({ fields }) => (
    <div className="row mb-2 mb-md-3 g-2">
      {fields.map((field, idx) => (
        <div key={idx} className={`col-${field.col || 12} col-sm-${field.colSm || field.col || 12}`}>
          <div className="small fw-bold mb-1 text-uppercase">{field.label}</div>
          <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px' }}>
            {field.value || ''}
          </div>
        </div>
      ))}
    </div>
  );

  const SectionHeader = ({ title, bgClass = 'bg-danger' }) => (
    <div className={`${bgClass} text-white p-2 fw-bold small`}>
      {title}
    </div>
  );

  const sections = {
    learnerInfo: [
      { label: 'LAST NAME', value: enrollmentData.learnerInfo?.lastName, col: 12, colSm: 3 },
      { label: 'FIRST NAME', value: enrollmentData.learnerInfo?.firstName, col: 12, colSm: 3 },
      { label: 'MIDDLE NAME', value: enrollmentData.learnerInfo?.middleName, col: 12, colSm: 3 },
      { label: 'EXT.', value: enrollmentData.learnerInfo?.extensionName, col: 12, colSm: 3 }
    ],
    currentAddress: [
      { label: 'HOUSE NO./STREET', value: `${enrollmentData.address?.current?.houseNo || ''} ${enrollmentData.address?.current?.street || ''}`, col: 12, colSm: 4 },
      { label: 'BARANGAY', value: enrollmentData.address?.current?.barangay, col: 12, colSm: 8 },
      { label: 'MUNICIPALITY/CITY', value: enrollmentData.address?.current?.municipality, col: 12, colSm: 6 },
      { label: 'PROVINCE', value: enrollmentData.address?.current?.province, col: 12, colSm: 4 },
      { label: 'ZIP CODE', value: enrollmentData.address?.current?.zipCode, col: 12, colSm: 2 }
    ],
    permanentAddress: [
      { label: 'HOUSE NO./STREET', value: `${enrollmentData.address?.permanent?.houseNo || ''} ${enrollmentData.address?.permanent?.street || ''}`, col: 12, colSm: 4 },
      { label: 'BARANGAY', value: enrollmentData.address?.permanent?.barangay, col: 12, colSm: 8 },
      { label: 'MUNICIPALITY/CITY', value: enrollmentData.address?.permanent?.municipality, col: 12, colSm: 6 },
      { label: 'PROVINCE', value: enrollmentData.address?.permanent?.province, col: 12, colSm: 4 },
      { label: 'ZIP CODE', value: enrollmentData.address?.permanent?.zipCode, col: 12, colSm: 2 }
    ],
    parents: [
      {
        title: "FATHER'S NAME",
        fields: [
          { label: 'Last Name', value: enrollmentData.parentGuardianInfo?.father?.lastName },
          { label: 'First Name', value: enrollmentData.parentGuardianInfo?.father?.firstName },
          { label: 'Middle Name', value: enrollmentData.parentGuardianInfo?.father?.middleName },
          { label: 'Contact Number', value: enrollmentData.parentGuardianInfo?.father?.contactNumber, fullWidth: true }
        ]
      },
      {
        title: "MOTHER'S NAME",
        fields: [
          { label: 'Last Name', value: enrollmentData.parentGuardianInfo?.mother?.lastName },
          { label: 'First Name', value: enrollmentData.parentGuardianInfo?.mother?.firstName },
          { label: 'Middle Name', value: enrollmentData.parentGuardianInfo?.mother?.middleName },
          { label: 'Contact Number', value: enrollmentData.parentGuardianInfo?.mother?.contactNumber, fullWidth: true }
        ]
      },
      {
        title: "GUARDIAN'S NAME",
        fields: [
          { label: 'Last Name', value: enrollmentData.parentGuardianInfo?.guardian?.lastName },
          { label: 'First Name', value: enrollmentData.parentGuardianInfo?.guardian?.firstName },
          { label: 'Middle Name', value: enrollmentData.parentGuardianInfo?.guardian?.middleName },
          { label: 'Contact Number', value: enrollmentData.parentGuardianInfo?.guardian?.contactNumber, fullWidth: true }
        ]
      }
    ],
    seniorHigh: [
      { label: 'SEMESTER', value: enrollmentData.seniorHigh?.semester === "1st" ? "First" : "Second", col: 12, colSm: 4 },
      { label: 'TRACK', value: enrollmentData.seniorHigh?.track, col: 12, colSm: 4 },
      { label: 'STRAND', value: enrollmentData.seniorHigh?.strand, col: 12, colSm: 4 }
    ],
    documents: [
      { title: 'PSA Birth Certificate', path: enrollmentData.requiredDocuments?.psaBirthCert?.filePath },
      { title: 'ID Picture', path: enrollmentData.requiredDocuments?.idPicture?.filePath },
      { title: 'Report Card', path: enrollmentData.requiredDocuments?.reportCard?.filePath },
      { title: 'Certificate of Good Moral', path: enrollmentData.requiredDocuments?.goodMoral?.filePath }
    ]
  };

  return (
    <div style={hiddenStyle}>
      <div className="container-fluid min-vh-100 bg-light">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-11 bg-white p-2 p-md-4">
            <div ref={formRef}>
              
              {/* Header */}
              <div className="text-center mb-3 mb-md-4 ">
                <img src={deped} alt="DepEd Logo" style={{ width: '120px', height: '120px' }} crossOrigin="anonymous" className="mb-2 mb-md-3 me-4" />
                <img src={logo} alt="DepEd Logo" style={{ width: '120px', height: '120px' }} crossOrigin="anonymous" className="mb-2 mb-md-3" />
                <p className="fw-bold mb-1 small fs-5">FRANCISCO OSORIO INTEGRATED SENIOR HIGH SCHOOL</p>
                <p className='m-0 my-2 fw-semibold'>Barangay Osorio Trece Martires City, Cavite</p>

                <div className="d-inline-block border border-2 border-dark p-2 fw-bold small mt-2">
                  School Year: {enrollmentData.schoolYear || '________'}
                </div>
              </div>

              {/* LRN and PSA Section */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                {/* Learner Information */}
                <SectionHeader title="LEARNER INFORMATION " />
                <div className="p-2 p-md-3">
                  <FieldRow fields={sections.learnerInfo} />
                  
                  <div className="row mb-2 mb-md-3 g-1">
                    <div className="col-12 col-sm-6">
                      <div className="small fw-bold mb-1">DATE OF BIRTH (MM/DD/YYYY)</div>
                      <div className="border-bottom border-dark pb-1 small" 
                      style={{ minHeight: '20px' }}>
                        {formatDate(enrollmentData.learnerInfo?.birthDate?.$date || enrollmentData.learnerInfo?.birthDate)}
                      </div>
                    </div>
                    <div className="col-6 col-sm-2">
                      <div className="small fw-bold mb-1">SEX</div>
                      <div className="d-flex gap-1 align-items-center small flex-wrap" style={{ minHeight: '20px' }}>
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={enrollmentData.learnerInfo?.sex === 'Male'} /> <span>M</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={enrollmentData.learnerInfo?.sex === 'Female'} /> <span>F</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-2">
                      <div className="small fw-bold mb-1">AGE</div>
                      <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                        {enrollmentData.learnerInfo?.age || ''}
                      </div>
                    </div>
                    <div className="col-12 col-sm-2">
                      <div className="small fw-bold mb-1">MOTHER TONGUE</div>
                      <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                        {enrollmentData.learnerInfo?.motherTongue || ''}
                      </div>
                    </div>
                  </div>

                  <div className="row mb-2 mb-md-3 g-2">
                    <div className="col-12 col-sm-6">
                      <div className="small fw-bold mb-1">EMAIL ADDRESS</div>
                      <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px' }}>
                        {enrollmentData.learnerInfo?.email || ''}
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="small fw-bold mb-1">CONTACT NUMBER</div>
                      <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                        {enrollmentData.address?.current?.contactNumber || ''}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 mb-md-3">
                    <div className="small fw-bold mb-1">PLACE OF BIRTH (Municipality/City)</div>
                    <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px' }}>
                      {enrollmentData.learnerInfo?.placeOfBirth || ''}
                    </div>
                  </div>

                  <div className="row mb-md-4 ">
                    <div className="col-12 my-3">
                      <span className='fw-bold'>Grade level:</span>
                      <span className='ms-2 border-bottom border-dark px-2 '>{enrollmentData.gradeLevelToEnroll}</span>
                    </div>
                    <div className="col-12 col-md-6  mt-md-0 ">
                      <div className="col-auto">
                        <span className="fw-bold">LRN: </span>
                        <span className="border-bottom border-dark px-2" 
                        >{enrollmentData.learnerInfo?.lrn || ''}</span>
                      </div>
                      <div className="col-auto">
                        <span className="fw-bold">PSA Birth Cert No.: </span>
                        <span className="border-bottom border-dark px-2 d-inline-block my-2">{enrollmentData.learnerInfo?.psaNo || ''}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 my-3 my-md-0 mt-md-0">
                      <div className="col-auto d-flex align-items-center gap-2 ">
                          <CheckBox checked={enrollmentData.withLRN} />
                          <span className="small">With LRN</span>
                          <CheckBox checked={!enrollmentData.withLRN} />
                          <span className="small">No LRN</span>
                      </div>
                      <div className="col-auto d-flex align-items-center gap-2 my-2">
                          <span className="fw-bold">Returning (Balik-Aral)?</span>
                          <CheckBox checked={enrollmentData.schoolHistory?.returningLearner} />
                          <span>Yes</span>
                          <CheckBox checked={!enrollmentData.schoolHistory?.returningLearner} />
                          <span>No</span>
                      </div>
                    </div>
                  </div>



                  {/* Disability */}
                  <div className="mb-2 mb-md-3 small">
                    <div className="d-flex gap-2 align-items-start mb-2 flex-wrap">
                      <span className="fw-bold">Is this child a learner with disability?</span>
                      <div className="d-flex gap-2">
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> Yes
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={!enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> No
                        </div>
                      </div>
                    </div>
                    {enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled && (
                      <div className="ps-2 ps-md-3 mb-2">
                        <div className="row align-items-start">
                          <div className="col-auto pe-1" style={{ minWidth: '220px' }}>
                            <span className="fw-bold">If Yes, specify the type of disability:</span>
                          </div>
                          <div className="col ps-1">
                            <span className="text-break">{enrollmentData.learnerInfo?.learnerWithDisability?.disabilityType?.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Indigenous */}
                  <div className="mb-2 mb-md-3 small">
                    <div className="d-flex gap-2 align-items-start mb-2 flex-wrap">
                      <span className="fw-bold">Is this child a member of Indigenous People (IP) Community?</span>
                      <div className="d-flex gap-2">
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> Yes
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={!enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> No
                        </div>
                      </div>
                    </div>
                    {enrollmentData.learnerInfo?.indigenousCommunity?.isMember && (
                      <div className="ps-2 ps-md-3 mb-2">
                        <div className="row align-items-start">
                          <div className="col-auto pe-1" style={{ minWidth: '150px' }}>
                            <span className="fw-bold">If Yes, please specify:</span>
                          </div>
                          <div className="col ps-1">
                            <span className="text-break">{enrollmentData.learnerInfo?.indigenousCommunity?.name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4Ps */}
                  <div className="small">
                    <div className="d-flex gap-2 align-items-start mb-2 flex-wrap">
                      <span className="fw-bold">Is this child a 4Ps beneficiary?</span>
                      <div className="d-flex gap-2">
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> Yes
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <CheckBox checked={!enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> No
                        </div>
                      </div>
                    </div>
                    {enrollmentData.learnerInfo?.fourPs?.isBeneficiary && (
                      <div className="ps-2 ps-md-3">
                        <div className="row align-items-start">
                          <div className="col-auto pe-1" style={{ minWidth: '310px' }}>
                            <span className="fw-bold">If Yes, write the 4Ps Household ID Number below:</span>
                          </div>
                          <div className="col ps-1">
                            <span className="text-break">{enrollmentData.learnerInfo?.fourPs?.householdId}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>



              

              {/* Current Address */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                <SectionHeader title="CURRENT ADDRESS" />
                <div className="p-2 p-md-3">
                  <FieldRow fields={sections.currentAddress} />
                </div>
              </div>

              {/* Permanent Address */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                <SectionHeader title="PERMANENT ADDRESS" />
                <div className="p-2 p-md-3">
                  <div className="mb-2 mb-md-3 small">
                    <CheckBox checked={enrollmentData.address?.permanent?.sameAsCurrent} />
                    <span>Same as Current Address</span>
                  </div>
                  <FieldRow fields={sections.permanentAddress} />
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                <SectionHeader title="PARENT/GUARDIAN INFORMATION" />
                <div className="p-2 p-md-3">
                  {sections.parents.map((parent, idx) => (
                    <div key={idx} className="mb-3 mb-md-4">
                      <h6 className="fw-bold small mb-2">{parent.title}</h6>
                      <div className="row mb-2 g-2">
                        {parent.fields.slice(0, 3).map((field, fidx) => (
                          <div key={fidx} className="col-12 col-sm-4">
                            <div className="small mb-1">{field.label}</div>
                            <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px' }}>
                              {field.value || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      {parent.fields[3] && (
                        <div className="col-12">
                          <div className="small mb-1">{parent.fields[3].label}</div>
                          <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px', maxWidth: '100%' }}>
                            {parent.fields[3].value || ''}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Returning Learner */}
              {enrollmentData.schoolHistory?.returningLearner && (
                <div className="border border-2 border-dark mb-2 mb-md-3">
                  <SectionHeader title="FOR RETURNING LEARNER (BALIK-ARAL) AND THOSE WHO WILL TRANSFER" />
                  <div className="p-2 p-md-3">
                    <div className="row mb-2 mb-md-3 g-2">
                      <div className="col-12 col-sm-6">
                        <div className="small fw-bold mb-1">LAST GRADE LEVEL COMPLETED</div>
                        <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                          {enrollmentData.schoolHistory?.lastGradeLevelCompleted || ''}
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="small fw-bold mb-1">LAST SCHOOL YEAR COMPLETED</div>
                        <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                          {enrollmentData.schoolHistory?.lastSchoolYearCompleted || ''}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 mb-md-3">
                      <div className="small fw-bold mb-1">LAST SCHOOL ATTENDED</div>
                      <div className="border-bottom border-dark pb-1 small text-break" style={{ minHeight: '20px' }}>
                        {enrollmentData.schoolHistory?.lastSchoolAttended || ''}
                      </div>
                    </div>
                    <div>
                      <div className="small fw-bold mb-1">SCHOOL ID</div>
                      <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                        {enrollmentData.schoolHistory?.schoolId || ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Senior High */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                <SectionHeader title="FOR SENIOR HIGH SCHOOL LEARNER" />
                <div className="p-2 p-md-3">
                  <FieldRow fields={sections.seniorHigh} />
                </div>
              </div>

              {/* Required Documents */}
              <div className="mb-2 mb-md-3">
                <SectionHeader title="REQUIRED DOCUMENTS" bgClass="bg-danger" />
                {sections.documents.map((doc, idx) => doc.path && (
                  <div key={idx} className="border border-2 border-dark mb-3 mb-md-4" style={{ pageBreakInside: 'avoid' }}>
                    <div className="bg-secondary bg-opacity-25 p-2 fw-bold small border-bottom border-dark">
                      {doc.title}
                    </div>
                    <div className="p-2 p-md-4 d-flex justify-content-center align-items-center" style={{ minHeight: '250px' }}>
                      <img 
                        src={doc.path}
                        alt={doc.title}
                        className="img-fluid"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Registrar Section */}
              <div className="border border-2 border-dark mb-2 mb-md-3">
                <SectionHeader title="TO BE FILLED OUT BY THE REGISTRAR" bgClass="bg-dark" />
                <div className="p-2 p-md-3">
                  <div className="row mb-2 mb-md-3 g-2 align-items-end">
                    <div className="col-12 col-sm-4">
                      <div className="small fw-bold mb-1">STATUS</div>
                      <div className="border-bottom border-dark pb-1 small text-capitalize" style={{ minHeight: '20px' }}>
                        {enrollmentData.status || ''}
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div className="small fw-bold mb-1">STUDENT TYPE</div>
                      <div className="border-bottom border-dark pb-1 small text-capitalize" style={{ minHeight: '20px' }}>
                        {enrollmentData.studentType || ''}
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div className="small fw-bold mb-1">DATE & TIME</div>
                      <div className="border-bottom border-dark pb-1 small" style={{ minHeight: '20px' }}>
                        {new Date().toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-center d-flex gap-2 flex-column " 
                  style={{marginTop:"100px"}}
                  >
                    <div className="border-top border-2 border-dark mx-auto" 
                    style={{ width: '250px',}}
                    
                    ></div>
                    <div className="small fw-bold ">Signature of Registrar</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-muted mt-3 mt-md-4 small">
                <p className="mb-1">FRANCISCO OSORIO INTEGRATED SENIOR HIGH SCHOOL</p>
                <p className="mb-1">Trece Martires City</p>
              </div>

            </div>

            
            {/* Download Button */}
            {!location?.state?.autoDownload && (
                <div className='d-flex align-items-center gap-3 my-4 justify-content-start'> 
                    <button 
                        className='btn btn-secondary px-4 text-capitalize'
                        onClick={() => navigate(-1)}
                        disabled={isDownloading} // ✅ Disable while downloading
                    >
                        <i className="fa fa-arrow-left me-2"></i>
                        Back
                    </button>
                    <button 
                        className='btn btn-danger text-capitalize px-4'
                        onClick={handleDownloadPDF}
                        disabled={isDownloading} // ✅ Disable while downloading
                    >
                        {isDownloading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </span>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <i className="fa fa-download me-2"></i>
                                Download PDF
                            </>
                        )}
                    </button>
                    <button 
                        className='btn btn-success text-capitalize'
                        onClick={() => setOpenModal(true)}
                        disabled={enrollmentData?.status === "approved" || isDownloading} // ✅ Also disable while downloading
                    >
                        {enrollmentData?.status === "approved" 
                            ? "Approved"
                            : "Approve"
                        }
                    </button>
                </div>              
            )}

            {openModal &&  (
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
                                    onClick={() => setOpenModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body text-center">
                                <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
                                <h5 className="mb-3">Approve Application?</h5>
                                <p className="text-muted">
                                    Do you want to approve the enrollment application of:
                                    <br/>
                                    <strong className="text-capitalize">
                                        {enrollmentData?.learnerInfo?.firstName} {enrollmentData?.learnerInfo?.lastName}
                                    </strong>
                                    <br/>
                                    <span className="badge bg-secondary mt-2">
                                        {enrollmentData?.gradeLevelToEnroll} - S.Y. {enrollmentData?.schoolYear}
                                    </span>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={()=>setOpenModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={async()=>{

                                        try {
                                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/approveApplicant`, {
                                                method: "PATCH",
                                                headers: {"Content-Type": "application/json"},
                                                body: JSON.stringify({ enrollmentId: enrollmentData._id }),
                                                credentials: "include",
                                            })
                                            const data = await res.json();
                                            if(!res.ok) throw new Error(data.message);
                                            
                                            alert(data.message);
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentFormPDF;