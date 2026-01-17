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
            openMenu, setOpenmenu
        }}>
            {children}
        </globalContext.Provider>

    )
}
 
