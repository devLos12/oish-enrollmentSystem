import Student from "../model/student.js";
import EmailHistory from "../model/emailHistory.js";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template function
const createEmailTemplate = (studentName, title, description, date, time) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                    position: relative;
                }
                .logo-wrapper {
                    display: inline-block;
                    width: 100px;
                    height: 100px;
                    background-color: white;
                    border-radius: 50%;
                    padding: 15px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    margin-bottom: 20px;
                }
                .header-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    border-radius: 50%;
                }
                .header h2 {
                    margin: 0;
                    padding: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                .content {
                    background-color: #ffffff;
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 16px;
                    margin-bottom: 20px;
                }
                .title-box {
                    background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
                    padding: 20px;
                    margin: 25px 0;
                    border-radius: 8px;
                    border: 2px solid #dc3545;
                    text-align: center;
                }
                .title-box h3 {
                    color: #dc3545;
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    text-transform: capitalize;
                }
                .info-box {
                    background-color: #fff5f5;
                    padding: 20px;
                    margin: 15px 0;
                    border-left: 4px solid #dc3545;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(220,53,69,0.1);
                }
                .label {
                    font-weight: bold;
                    color: #dc3545;
                    text-transform: uppercase;
                    font-size: 12px;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                    display: block;
                }
                .value {
                    font-size: 15px;
                    color: #333;
                    line-height: 1.8;
                }
                .reminder-note {
                    background-color: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 5px;
                    padding: 20px;
                    margin: 25px 0;
                }
                .reminder-note p {
                    margin: 8px 0;
                    color: #856404;
                    line-height: 1.6;
                }
                .reminder-note strong {
                    color: #664d03;
                }
                .footer {
                    text-align: center;
                    padding: 25px 30px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #dee2e6;
                    font-size: 12px;
                    color: #6c757d;
                }
                .footer p {
                    margin: 5px 0;
                }
                
                /* Mobile Responsive */
                @media only screen and (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .header h2 {
                        font-size: 20px;
                    }
                    .title-box h3 {
                        font-size: 18px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo-wrapper">
                        <img src="${process.env.CLOUDINARY_STATIC_IMAGE}" 
                             alt="School Logo" 
                             class="header-image">
                    </div>
                    <h2>Francisco Osorio Integrated Senior High School</h2>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        <p>Dear <strong>${studentName}</strong>,</p>
                    </div>
                    
                    <p>This is a reminder regarding your requirements submission:</p>
                    
                    <div class="title-box">
                        <h3>${title}</h3>
                    </div>
                    
                    <div class="info-box">
                        <span class="label">📅 Scheduled Date</span>
                        <div class="value">${new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</div>
                    </div>
                    
                    <div class="info-box">
                        <span class="label">🕐 Time</span>
                        <div class="value">${time}</div>
                    </div>
                    
                    <div class="info-box">
                        <span class="label">📝 Details</span>
                        <div class="value">${description}</div>
                    </div>
                    
                    <div class="reminder-note">
                        <p><strong>⚠️ Important Reminder:</strong></p>
                        <p>• Please submit your requirements on or before the scheduled date and time</p>
                        <p>• Ensure all documents are complete and properly labeled</p>
                        <p>• Contact the school administration if you have any questions</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};



export const getAllEmails = async (req, res) => {
    try {
        const emails = await EmailHistory.find();

        if (!emails || emails.length === 0) {
            return res.status(404).json({ message: "No emails yet." });
        }
        return res.status(200).json(emails);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students available." });
        }

        return res.status(200).json(students);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const scheduleRequirements = async (req, res) => {
    try {
        const { studentIds, title, date, time, description } = req.body;

        // Validate input
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "Student IDs are required" });
        }

        if (!title || !date || !time || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const convertTo12Hour = (time24) => {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        };

        const formattedTime = convertTo12Hour(time);

        // Fetch students data
        const students = await Student.find({ 
            _id: { $in: studentIds } 
        }).select('firstName lastName email');

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found" });
        }

        // Save to email history
        const emailHistory = new EmailHistory({
            title,
            scheduledDate: date,
            scheduledTime: formattedTime,
            description,
            participantCount: students.length,
            studentIds
        });
        
        await emailHistory.save();

        // Send emails to all students using Resend
        const emailPromises = students.map(student => {
            const studentName = `${student.firstName} ${student.lastName}`;
            const htmlContent = createEmailTemplate(studentName, title, description, date, formattedTime);
            
            return resend.emails.send({
                from: `Francisco Osorio SHS <noreply${process.env.EMAIL_DOMAIN}>`,
                to: student.email,
                subject: `Requirements Reminder: ${title}`,
                html: htmlContent
            });
        });



        // Wait for all emails to be sent
        const results = await Promise.allSettled(emailPromises);
        
        // Count successful sends
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (failCount > 0) {
            console.error(`Failed to send ${failCount} emails`);
        }

        res.status(200).json({ 
            message: `Requirements scheduled successfully! ${successCount} email(s) sent${failCount > 0 ? `, ${failCount} failed` : ''}.`,
            emailHistory,
            emailsSent: successCount,
            emailsFailed: failCount
        });

    } catch (error) {
        console.error("Error scheduling requirements:", error);
        res.status(500).json({ 
            message: "Failed to schedule requirements",
            error: error.message 
        });
    }
};

export const deleteEmailHistory = async (req, res) => {
    try {
        const { emailIds } = req.body;

        const deletedHistory = await EmailHistory.deleteMany(
            { _id: { $in: emailIds } }
        );

        if (deletedHistory.deletedCount === 0) {
            return res.status(404).json({ message: "Email history not found" });
        }

        return res.status(200).json({ 
            message: "Email history deleted successfully",
            deletedCount: deletedHistory.deletedCount
        });

    } catch (error) {
        console.error("Error deleting email history:", error);
        return res.status(500).json({ 
            message: "Failed to delete email history",
            error: error.message 
        });
    }
};