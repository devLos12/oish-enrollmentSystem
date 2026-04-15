import React, { useContext, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../../context/global";

const Registration = () => {
  const { profile, setTextHeader } = useContext(globalContext);
  const navigate = useNavigate();
  const location = useLocation();



  useLayoutEffect(() => {
    setTextHeader(location?.state?.title);
  },[location?.state?.title]);
  
  
  
  const handleDownload = (registration) => {


      const matchedHistory = profile?.registrationHistory?.find(h =>
          h.schoolYear === registration.schoolYear &&
          h.semester === registration.semester
      );

      // ✅ Flatten subjects — same structure sa getStudents derivedSubjects
      const derivedSubjects = matchedHistory?.subjects?.map(s => {
        const pop = s.subjectId;

        const matchedSection = pop.sections?.find(
          sec => sec.sectionName = registration.section
        )

        return {
          subjectId:         s.subjectId?._id    || s.subjectId,
          subjectCode:       s.subjectId?.subjectCode  || '',
          subjectName:       s.subjectId?.subjectName  || s.subjectName || '',
          subjectTeacher:    s.subjectTeacher    || '',
          semester:          s.subjectId?.semester || s.semester || null,
          scheduleStartTime: matchedSection?.scheduleStartTime || '',
          scheduleEndTime:   matchedSection?.scheduleEndTime   || '',
          room:              matchedSection?.room              || '',
        }
    
      }) || [];

      
      
      navigate('/student/download', { 

          state: { 
              ...profile,
              ...registration,
              currentSemSubjects:  derivedSubjects,
              subjects:            derivedSubjects,
              displayGradeLevel:   registration.gradeLevel,
              displaySection:      registration.section || 'No Section',
              displayStrand:       registration.strand,
              displaySemester:     registration.semester,
              displaySchoolYear:   registration.schoolYear,
              currentSemHistory:   matchedHistory 
                  ? { ...matchedHistory, subjects: derivedSubjects } 
                  : null,
              autoDownload: true
          } 
      });
  };


  const getSemesterLabel = (semester) => {
    return semester === 1 ? "FIRST" : semester === 2 ? "SECOND" : "SUMMER";
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header py-3 bg-white border-bottom">
              <h5 className="mb-0 fw-bold ">
                <i className="bi bi-clipboard-data me-2"></i>
                Registration Records
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-uppercase fw-semibold text-muted small">Academic Year</th>
                      <th className="text-uppercase fw-semibold text-muted small">Semester</th>
                      <th className="text-uppercase fw-semibold text-muted small">Year Level</th>
                      <th className="text-uppercase fw-semibold text-muted small">Section</th>
                      <th className="text-uppercase fw-semibold text-muted small text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile?.registrationHistory && profile.registrationHistory.length > 0 ? (
                      profile.registrationHistory.map((reg, index) => (
                        <tr key={`${reg.schoolYear}-${reg.semester}-${index}`}>
                          <td className="fw-semibold text-dark">{reg.schoolYear || 'N/A'}</td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase px-3 py-2 border border-primary border-opacity-25">
                              {getSemesterLabel(reg.semester)}
                            </span>
                          </td>
                          <td className="fw-bold text-dark">{reg.gradeLevel || 'N/A'}</td>
                          <td className="fw-semibold text-dark">{reg.section || 'N/A'}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-primary btn-sm rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"
                              onClick={() => handleDownload(reg)}
                              aria-label={`Download registration for ${reg.schoolYear}`}
                            >
                              <i className="fa-solid fa-download"></i>
                              Download
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-5">
                          <div className="text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                            <p className="mb-0">No registration records found.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;