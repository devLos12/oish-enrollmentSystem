import React, { useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Step1, Step2, Step3 } from '../pages/enrollmentForm';
import { useLocation } from 'react-router-dom';



export const CodePrintView = () => {
    const printRef = useRef();
    const location = useLocation();




    const handleDownloadPDF = async () => {
        const element = printRef.current;
        
        const opt = {
            margin: [5,5,5,5],
            filename: 'Enrollment-Form-Components.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollY: -window.scrollY,
                scrollX: -window.scrollX,
                windowHeight: element.scrollHeight
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break' // Para sa manual page breaks
            }
        };
        
        await html2pdf().set(opt).from(element).save();
    };

    return (
        <div>
            <button onClick={handleDownloadPDF}>
                Download All Components as PDF
            </button>

            {/* Eto yung idi-download */}
            <div ref={printRef}>
                
                {/* Step 1 */}
                <div className="page-break">
                    <Step1/>
                </div>

                {/* Step 2 */}
                <div className="page-break">
                    <Step2/>
                </div>

                {/* Step 3 */}
                <div className="page-break">
                    <Step3/>
                </div>
            </div>
        </div>
    );
};