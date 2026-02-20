import { Children, createContext, useEffect, useState } from "react";


export const globalContext = createContext();

export const MyGlobalContext = ( { children }) => {
    const [role , setRole ] = useState('');
    const [isAdminAuth, setAdminAuth] = useState(false);
    const [isStaffAuth, setStaffAuth] = useState(false);
    const [isStudentAuth, setStudentAuth] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [profile, setProfile] = useState({});
    const [textHeader, setTextHeader] = useState('');
    const [modal, setModal] = useState({
        isShow: false,
        text: ''
    });
    const [ trigger, setTrigger] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [formData, setFormData] = useState({
            schoolYear: '',
            gradeLevelToEnroll: '',
            withLRN: '',
            isReturning: '',
            learnerInfo: {
                email: "",
                psaNo: '',
                lrn: '',
                lastName: '',
                firstName: '',
                middleName: '',
                extensionName: '',
                birthDate: '',
                age: '',
                sex: '',
                placeOfBirth: '',
                motherTongue: '',

                learnerWithDisability: {
                    isDisabled: '',
                    disabilityType: [] // ARRAY na instead of string
                },

                indigenousCommunity: {
                    isMember: '',
                    name: ''
                },
                fourPs: {
                    isBeneficiary: '',
                    householdId: ''
                }
            }
        });
        const [studentList, setStudentList] = useState([]);
        const [openMenu, setOpenmenu] = useState(false);
        
        const [pendingApplicantsCount, setPendingApplicantsCount] = useState(0);
        const [pendingStudentsCount, setPendingStudentsCount] = useState(0);

        

        


        const fetchPendingApplicantsCount = async () => {

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getApplicants`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json();
                if(!res.ok) return;

                // Count pending only
                const pendingCount = data.filter(app => app.status === 'pending').length;
                setPendingApplicantsCount(pendingCount);
                
            } catch (error) {
                console.error("Error fetching pending count:", error.message);
                setPendingApplicantsCount(0);
            }
        };


        const fetchPendingStudentsCount = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getStudents`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json();
                if(!res.ok) return;

                // Count pending only
                const pendingCount = data.filter(student => student.status === 'pending').length;
                setPendingStudentsCount(pendingCount);
            } catch (error) {
                console.error("Error fetching pending students count:", error.message);
                setPendingStudentsCount(0);
            }
        };

    return (
                
        <globalContext.Provider value={{
            role , setRole,
            isAdminAuth, setAdminAuth,
            isStaffAuth, setStaffAuth,
            isStudentAuth, setStudentAuth,
            authLoading, setAuthLoading,
            profile, setProfile,
            textHeader, setTextHeader,
            modal, setModal,
            isLoggingOut, setIsLoggingOut,
            formData, setFormData,
            trigger, setTrigger,
            studentList, setStudentList,
            openMenu, setOpenmenu,
            pendingApplicantsCount, setPendingApplicantsCount,
            pendingStudentsCount, setPendingStudentsCount,
            fetchPendingApplicantsCount,
            fetchPendingStudentsCount
        }}>
            {children}
        </globalContext.Provider>

    )
}
 
