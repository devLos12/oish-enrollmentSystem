import React from 'react';
import deped from "../assets/image/deped.png";
import logo from "../assets/image/logo.png";

const ApplicantFormPDF = ({ enrollmentData = {} }) => {

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const val = (v) => (!v || v === 'N/A') ? 'N/A' : v;

  const s = {
    page: {
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      fontSize: '14px',
      color: '#1a1a1a',
      background: '#fff',
      padding: '18px 20px',
      width: '794px',
      boxSizing: 'border-box',
      pageBreakAfter: 'always',
      breakAfter: 'page',
    },
    docPage: {
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      pageBreakBefore: 'always',
      breakBefore: 'page',
      pageBreakAfter: 'always',
      breakAfter: 'page',
      padding: '18px 20px',
      width: '794px',
      boxSizing: 'border-box',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '8px',
      paddingBottom: '8px',
      borderBottom: '2px solid #7f1d1d',
    },
    schoolName: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#7f1d1d',
      margin: 0,
    },
    schoolSub: {
      fontSize: '12px',
      color: '#555',
      margin: '2px 0 0',
    },
    formTitle: {
      textAlign: 'center',
      fontSize: '15px',
      fontWeight: 'bold',
      letterSpacing: '1.5px',
      color: '#7f1d1d',
      margin: '6px 0 3px',
      textTransform: 'uppercase',
    },
    syBadge: {
      textAlign: 'center',
      fontSize: '13px',
      color: '#444',
      marginBottom: '8px',
    },
    sectionHeader: {
      background: '#7f1d1d',
      color: '#fff',
      fontSize: '11px',
      fontWeight: 'bold',
      letterSpacing: '0.8px',
      padding: '4px 8px',
      textTransform: 'uppercase',
      pageBreakAfter: 'avoid',
      breakAfter: 'avoid',
    },
    sectionBody: {
      border: '1px solid #d1d5db',
      borderTop: 'none',
      padding: '6px 8px',
      marginBottom: '6px',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
    },
    row: {
      display: 'flex',
      gap: '8px',
      marginBottom: '5px',
    },
    field: { flex: 1 },
    fieldLabel: {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#7f1d1d',
      letterSpacing: '0.4px',
      textTransform: 'uppercase',
      marginBottom: '2px',
    },
    fieldValue: {
      fontSize: '14px',
      color: '#1a1a1a',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '2px',
      minHeight: '18px',
    },
    checkbox: {
      width: '12px',
      height: '12px',
      border: '1px solid #7f1d1d',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#7f1d1d',
      flexShrink: 0,
    },
    divider: {
      borderTop: '1px dashed #e5e7eb',
      margin: '5px 0',
    },
    subLabel: {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#7f1d1d',
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
    },
    statusBadge: (status) => ({
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '3px',
      fontSize: '12px',
      fontWeight: 'bold',
      background: status === 'approved' ? '#dcfce7' : status === 'rejected' ? '#fee2e2' : '#fef9c3',
      color: status === 'approved' ? '#166534' : status === 'rejected' ? '#991b1b' : '#854d0e',
      border: `1px solid ${status === 'approved' ? '#86efac' : status === 'rejected' ? '#fca5a5' : '#fde047'}`,
    }),
    sigSection: {
      marginTop: '14px',
      display: 'flex',
      justifyContent: 'center',
    },
    sigBox: { textAlign: 'center', width: '180px' },
    sigLine: { borderTop: '1px solid #1a1a1a', marginBottom: '3px' },
    sigLabel: { fontSize: '10px', color: '#555' },
    footerText: {
      textAlign: 'center',
      fontSize: '10px',
      color: '#9ca3af',
      marginTop: '8px',
      borderTop: '1px solid #f3f4f6',
      paddingTop: '4px',
    },
    docHeader: {
      background: '#7f1d1d',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 'bold',
      padding: '5px 10px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      marginBottom: '6px',
    },
    studentInfoStrip: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '3px',
      padding: '5px 10px',
      marginBottom: '8px',
      display: 'flex',
      gap: '16px',
      fontSize: '12px',
      flexWrap: 'wrap',
    },
    docImgWrapper: {
      border: '1px solid #e5e7eb',
      padding: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      overflow: 'hidden',
      maxHeight: '680px',
    },
    docImg: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'block',
    },
  };

  const CB = ({ checked }) => (
    <span style={s.checkbox}>{checked ? '✓' : ''}</span>
  );

  const Field = ({ label, value, flex }) => (
    <div style={{ ...s.field, flex: flex || 1 }}>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.fieldValue}>{val(value)}</div>
    </div>
  );

  const Row = ({ children, mb = true }) => (
    <div style={{ ...s.row, marginBottom: mb ? '5px' : 0 }}>{children}</div>
  );

  const documents = [
    { title: 'PSA Birth Certificate', path: enrollmentData.requiredDocuments?.psaBirthCert?.filePath },
    { title: 'Report Card (Form 138)', path: enrollmentData.requiredDocuments?.reportCard?.filePath },
    { title: 'Good Moral Certificate', path: enrollmentData.requiredDocuments?.goodMoral?.filePath },
    { title: '2x2 ID Picture', path: enrollmentData.requiredDocuments?.idPicture?.filePath },
  ].filter(d => d.path);

  const SchoolHeader = ({ small }) => (
    <div style={s.header}>
      <img
        src={deped}
        alt="DepEd"
        style={{ width: small ? '44px' : '52px', height: small ? '44px' : '52px' }}
        crossOrigin="anonymous"
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ ...s.schoolName, fontSize: small ? '14px' : '16px', margin: 0 }}>
          Francisco Osorio Integrated Senior High School
        </p>
        <p style={s.schoolSub}>Barangay Osorio, Trece Martires City, Cavite</p>
        {!small && <p style={s.schoolSub}>Department of Education — Region IV-A CALABARZON</p>}
      </div>
      <img
        src={logo}
        alt="Logo"
        style={{ width: small ? '44px' : '52px', height: small ? '44px' : '52px' }}
        crossOrigin="anonymous"
      />
    </div>
  );

  const StudentStrip = () => (
    <div style={s.studentInfoStrip}>
      <span>
        <strong>Name:</strong> {val(enrollmentData.learnerInfo?.lastName)}, {val(enrollmentData.learnerInfo?.firstName)} {val(enrollmentData.learnerInfo?.middleName)}
      </span>
      <span><strong>LRN:</strong> {val(enrollmentData.learnerInfo?.lrn)}</span>
      <span><strong>Grade:</strong> {val(enrollmentData.gradeLevelToEnroll)}</span>
      <span>
        <strong>Track / Strand:</strong> {val(enrollmentData.seniorHigh?.track)} – {val(enrollmentData.seniorHigh?.strand)}
      </span>
      <span><strong>S.Y.:</strong> {val(enrollmentData.schoolYear)}</span>
    </div>
  );



    const hasData = (person) => {
        if (!person) return false;
        const fields = [person.lastName, person.firstName, person.middleName, person.contactNumber];
        return fields.some(f => f && f !== 'N/A' && f.trim() !== '');
    };

    return (
        <div>

        {/* ═══════════════════════════════
            PAGE 1 — ENROLLMENT FORM DATA
        ═══════════════════════════════ */}
        <div style={s.page}>

            <SchoolHeader />

            <div style={s.formTitle}>Student Enrollment Form</div>
            <div style={s.syBadge}>
            School Year: <strong>{enrollmentData.schoolYear || '________'}</strong>
            &nbsp;|&nbsp; Grade Level: <strong>{enrollmentData.gradeLevelToEnroll || '________'}</strong>
            &nbsp;|&nbsp; Semester:{' '}
            <strong>
                {enrollmentData.seniorHigh?.semester === 1
                ? 'First'
                : enrollmentData.seniorHigh?.semester === 2
                ? 'Second'
                : '—'}
            </strong>
            </div>

            {/* I. LEARNER INFO */}
            <div style={s.sectionHeader}>I. Learner Information</div>
            <div style={s.sectionBody}>
            <Row>
                <Field label="Last Name" value={enrollmentData.learnerInfo?.lastName} />
                <Field label="First Name" value={enrollmentData.learnerInfo?.firstName} />
                <Field label="Middle Name" value={enrollmentData.learnerInfo?.middleName} />
                <Field label="Ext." value={enrollmentData.learnerInfo?.extensionName} flex={0.3} />
            </Row>
            <Row>
                <Field label="Date of Birth" value={formatDate(enrollmentData.learnerInfo?.birthDate)} />
                <Field label="Place of Birth" value={enrollmentData.learnerInfo?.placeOfBirth} />
                <Field label="Age" value={enrollmentData.learnerInfo?.age} flex={0.3} />
                <div style={{ flex: 0.7 }}>
                <div style={s.fieldLabel}>Sex</div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <CB checked={enrollmentData.learnerInfo?.sex === 'Male'} /> Male
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <CB checked={enrollmentData.learnerInfo?.sex === 'Female'} /> Female
                    </span>
                </div>
                </div>
            </Row>
            <Row>
                <Field label="Email Address" value={enrollmentData.learnerInfo?.email} />
                <Field label="Mother Tongue" value={enrollmentData.learnerInfo?.motherTongue} />
            </Row>
            <Row mb={false}>
                <Field label="Learner Reference No. (LRN)" value={enrollmentData.learnerInfo?.lrn} />
                <Field label="PSA Birth Certificate No." value={enrollmentData.psaNo} />
            </Row>

            <div style={s.divider} />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <CB checked={enrollmentData.isReturning} /> Returning Learner (Balik-Aral)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <CB checked={enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled} /> Learner with Disability
                {enrollmentData.learnerInfo?.learnerWithDisability?.isDisabled && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                    ({enrollmentData.learnerInfo?.learnerWithDisability?.disabilityType?.join(', ')})
                    </span>
                )}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <CB checked={enrollmentData.learnerInfo?.indigenousCommunity?.isMember} /> IP Community Member
                {enrollmentData.learnerInfo?.indigenousCommunity?.isMember && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                    ({enrollmentData.learnerInfo?.indigenousCommunity?.name})
                    </span>
                )}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <CB checked={enrollmentData.learnerInfo?.fourPs?.isBeneficiary} /> 4Ps Beneficiary
                {enrollmentData.learnerInfo?.fourPs?.isBeneficiary && (
                    <span style={{ color: '#7f1d1d', fontSize: '12px' }}>
                    (ID: {enrollmentData.learnerInfo?.fourPs?.householdId})
                    </span>
                )}
                </span>
            </div>
            </div>

            {/* II. ADDRESS */}
            <div style={s.sectionHeader}>II. Address</div>
            <div style={s.sectionBody}>
            <div style={s.subLabel}>Current Address</div>
            <Row>
                <Field
                label="House No. / Street"
                value={`${enrollmentData.address?.current?.houseNo || ''} ${enrollmentData.address?.current?.street || ''}`.trim()}
                />
                <Field label="Barangay" value={enrollmentData.address?.current?.barangay} />
            </Row>
            <Row mb={false}>
                <Field label="Municipality / City" value={enrollmentData.address?.current?.municipality} />
                <Field label="Province" value={enrollmentData.address?.current?.province} />
                <Field label="Region" value={enrollmentData.address?.current?.region} />
                <Field label="Zip" value={enrollmentData.address?.current?.zipCode} flex={0.4} />
                <Field label="Contact No." value={enrollmentData.address?.current?.contactNumber} />
            </Row>

            <div style={s.divider} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <CB checked={enrollmentData.address?.permanent?.sameAsCurrent} />
                <span style={s.subLabel}>
                Permanent Address
                {enrollmentData.address?.permanent?.sameAsCurrent && (
                    <span style={{ color: '#555', fontWeight: 'normal', marginLeft: '5px', fontSize: '11px' }}>(Same as current)</span>
                )}
                </span>
            </div>
            {!enrollmentData.address?.permanent?.sameAsCurrent && (
                <>
                <Row>
                    <Field
                    label="House No. / Street"
                    value={`${enrollmentData.address?.permanent?.houseNo || ''} ${enrollmentData.address?.permanent?.street || ''}`.trim()}
                    />
                    <Field label="Barangay" value={enrollmentData.address?.permanent?.barangay} />
                </Row>
                <Row mb={false}>
                    <Field label="Municipality / City" value={enrollmentData.address?.permanent?.municipality} />
                    <Field label="Province" value={enrollmentData.address?.permanent?.province} />
                    <Field label="Region" value={enrollmentData.address?.permanent?.region} />
                    <Field label="Zip" value={enrollmentData.address?.permanent?.zipCode} flex={0.4} />
                </Row>
                </>
            )}
            </div>

            {/* III. PARENTS */}
            <div style={s.sectionHeader}>III. Parent / Guardian Information</div>
            <div style={s.sectionBody}>
            {[
                { title: 'Father', data: enrollmentData.parentGuardianInfo?.father },
                { title: 'Mother', data: enrollmentData.parentGuardianInfo?.mother },
                {
                title: `Guardian (${enrollmentData.parentGuardianInfo?.guardian?.relationship || '—'})`,
                data: enrollmentData.parentGuardianInfo?.guardian,
                },
            ].filter(p => hasData(p.data)).map((p, i, arr) => (
                <div key={i}>
                <div style={s.subLabel}>{p.title}</div>
                <Row mb={i < 2}>
                    <Field label="Last Name" value={p.data?.lastName} />
                    <Field label="First Name" value={p.data?.firstName} />
                    <Field label="Middle Name" value={p.data?.middleName} />
                    <Field label="Contact No." value={p.data?.contactNumber} />
                </Row>
                {i < arr.length - 1 && <div style={s.divider} />}
                </div>
            ))}
            </div>

            {/* IV. SCHOOL HISTORY (conditional) */}
            {enrollmentData.schoolHistory?.returningLearner && (
            <>
                <div style={s.sectionHeader}>IV. School History (For Returning / Transferee)</div>
                <div style={s.sectionBody}>
                <Row>
                    <Field label="Last Grade Level Completed" value={enrollmentData.schoolHistory?.lastGradeLevelCompleted} />
                    <Field label="Last School Year Completed" value={enrollmentData.schoolHistory?.lastSchoolYearCompleted} />
                </Row>
                <Row mb={false}>
                    <Field label="Last School Attended" value={enrollmentData.schoolHistory?.lastSchoolAttended} />
                    <Field label="School ID" value={enrollmentData.schoolHistory?.schoolId} flex={0.5} />
                </Row>
                </div>
            </>
            )}

            {/* SHS PROGRAM */}
            <div style={s.sectionHeader}>
            {enrollmentData.schoolHistory?.returningLearner ? 'V.' : 'IV.'} Senior High School Program
            </div>
            <div style={s.sectionBody}>
            <Row mb={false}>
                <Field label="Grade Level" value={enrollmentData.gradeLevelToEnroll} />
                <Field
                label="Semester"
                value={
                    enrollmentData.seniorHigh?.semester === 1
                    ? 'First Semester'
                    : enrollmentData.seniorHigh?.semester === 2
                    ? 'Second Semester'
                    : '—'
                }
                />
                <Field label="Track" value={enrollmentData.seniorHigh?.track} />
                <Field label="Strand" value={enrollmentData.seniorHigh?.strand} />
                <Field label="Student Type" value={enrollmentData.studentType} flex={0.6} />
            </Row>
            </div>

            {/* REGISTRAR */}
            <div style={s.sectionHeader}>For Registrar's Use Only</div>
            <div style={{ ...s.sectionBody, marginBottom: 0 }}>
            <Row>
                <div style={{ flex: 1 }}>
                <div style={s.fieldLabel}>Application Status</div>
                <div style={{ marginTop: '4px' }}>
                    <span style={s.statusBadge(enrollmentData.status)}>
                    {enrollmentData.status?.toUpperCase() || '—'}
                    </span>
                </div>
                </div>
                <div style={{ flex: 1 }}>
                <div style={s.fieldLabel}>Date Submitted</div>
                <div style={s.fieldValue}>
                    {formatDate(enrollmentData.signature?.dateSigned || enrollmentData.createdAt)}
                </div>
                </div>
                <div style={{ flex: 1 }}>
                <div style={s.fieldLabel}>Date Printed</div>
                <div style={s.fieldValue}>
                    {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </div>
                </div>
            </Row>
            <div className='mt-5' style={s.sigSection}>
                <div style={s.sigBox}>
                <div style={s.sigLine} />
                <div style={s.sigLabel}>Signature of Registrar over Printed Name</div>
                </div>
            </div>
            </div>

            <div style={s.footerText}>
            Francisco Osorio Integrated Senior High School &nbsp;|&nbsp; Trece Martires City, Cavite &nbsp;|&nbsp;
            This document is system-generated.
            </div>
        </div>

        {/* ═══════════════════════════════════
            DOCUMENT PAGES — 1 doc per page
        ═══════════════════════════════════ */}
        {documents.map((doc, idx) => (
            <div key={idx} style={s.docPage}>

            <SchoolHeader small />

            <StudentStrip />

            <div style={s.docHeader}>
                Document {idx + 1} of {documents.length}: {doc.title}
            </div>

            <div style={s.docImgWrapper}>
                <img
                src={doc.path}
                alt={doc.title}
                style={s.docImg}
                crossOrigin="anonymous"
                />
            </div>

            <div style={s.footerText}>
                {doc.title} &nbsp;|&nbsp;
                {enrollmentData.learnerInfo?.lastName}, {enrollmentData.learnerInfo?.firstName} &nbsp;|&nbsp;
                S.Y. {enrollmentData.schoolYear} &nbsp;|&nbsp;
                Page {idx + 2}
            </div>
            </div>
        ))}
        </div>
    );
};

export default ApplicantFormPDF;