import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const UpdateEnrollment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | error
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        // ✅ Wala token sa URL
        if (!token) {
            navigate("/404_forbidden", { replace: true });
            return;
        }

        
        const fetchEnrollmentByToken = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/getEnrollmentByToken/${token}`,
                    { method: "GET" }
                );

                const data = await res.json();

                if (!res.ok) {
                    // ✅ Expired or invalid token
                    setErrorMessage(data.message);
                    setStatus('error');
                    return;
                }

                // ✅ Token valid — i-navigate sa Step 1 na may prefill data
                navigate("/enrollment/step1", {
                    replace: true,
                    state: {
                        allowed: true,
                        isUpdate: true,
                        token: token,
                        enrollmentData: data.data
                    }
                });

            } catch (error) {
                setErrorMessage("Something went wrong. Please try again.");
                setStatus('error');
            }
        };

        fetchEnrollmentByToken();
    }, []);

    // ✅ Loading state
    if (status === 'loading') {
        return (
            <div className="d-flex justify-content-center align-items-center" 
                style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-danger mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Verifying your update link...</p>
                </div>
            </div>
        );
    }

    // ✅ Error state — expired or invalid
    if (status === 'error') {
        return (
            <div className="d-flex justify-content-center align-items-center"
                style={{ minHeight: '100vh' }}>
                <div className="text-center p-4">
                    <i className="fa-solid fa-circle-xmark text-danger mb-3" 
                        style={{ fontSize: '4rem' }}></i>
                    <h4 className="fw-bold mt-3">Link Invalid or Expired</h4>
                    <p className="text-muted mt-2">{errorMessage}</p>
                    <small className="text-muted">
                        Please contact the school registrar for a new update link.
                    </small>
                </div>
            </div>
        );
    }

    return null;
};

export default UpdateEnrollment;