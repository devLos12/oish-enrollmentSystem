import Student from "../model/student.js";
import EmailHistory from "../model/emailHistory.js";
import nodemailer from 'nodemailer';



const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD  // Your email password or app password
    }
});

// Email template function
const createEmailTemplate = (studentName, title, description, date, time) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #dc3545;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }
                .content {
                    background-color: #f8f9fa;
                    padding: 30px;
                    border: 1px solid #dee2e6;
                }
                .info-box {
                    background-color: white;
                    padding: 15px;
                    margin: 15px 0;
                    border-left: 4px solid #dc3545;
                    border-radius: 3px;
                }
                .label {
                    font-weight: bold;
                    color: #dc3545;
                    text-transform: uppercase;
                    font-size: 12px;
                    margin-bottom: 5px;
                }
                .value {
                    font-size: 16px;
                    color: #333;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    font-size: 12px;
                    color: #6c757d;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0;">Requirements Submission</h1>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>This is a reminder regarding your requirements submission:</p>
                
                <div class="info-box">
                    <div class="label">Title</div>
                    <div class="value">${title}</div>
                </div>
                
                <div class="info-box">
                    <div class="label">Scheduled Date</div>
                    <div class="value">📅 ${new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</div>
                </div>
                
                <div class="info-box">
                    <div class="label">Time</div>
                    <div class="value">🕐 ${time}</div>
                </div>
                
                <div class="info-box">
                    <div class="label">Details</div>
                    <div class="value">${description}</div>
                </div>
                
                <p style="margin-top: 20px;">Please make sure to submit your requirements on or before the scheduled date and time.</p>
                
                <p>If you have any questions or concerns, please contact the school administration.</p>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} School Management System</p>
                </div>
            </div>
        </body>
        </html>
    `;
};



export const getAllEmails = async (req, res) => {
    try {
        const emails = await EmailHistory.find();

        if(!emails || emails.length === 0) {
            return res.status(404).json({ message: "no emails yet."});
        }
        return res.status(200).json(emails);
    } catch (error) {
        return res.status(500).json({message: error.message });
    }
}


export const getAllStudents = async(req, res) => {
    try {
        const students = await Student.find();
        if(!students || students.length === 0) {
            return res.status(404).json({ message: "no students available."});
        }

        return res.status(200).json(students);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
} 


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

        // Fetch students data (assuming you have a Student model)
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

        // Send emails to all students
        const emailPromises = students.map(student => {
            const studentName = `${student.firstName} ${student.lastName}`;
            const htmlContent = createEmailTemplate(studentName, title, description, date, formattedTime);
            
            return transporter.sendMail({
                from: `"School Management System`,
                to: student.email,
                subject: title,
                html: htmlContent
            });
        });

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        res.status(200).json({ 
            message: `Requirements scheduled successfully! ${students.length} email(s) sent.`,
            emailHistory,
            emailsSent: students.length
        });

    } catch (error) {
        console.error("Error scheduling requirements:", error);
        res.status(500).json({ 
            message: "Failed to schedule requirements",
            error: error.message 
        });
    }
};




/**
 * DELETE /api/deleteEmailHistory/:id
 * Delete a specific email history record (optional)
 */
export const deleteEmailHistory = async (req, res) => {
    try {
        const { emailIds } = req.body;

        const deletedHistory = await EmailHistory.deleteMany(
            { _id: { $in: emailIds }}
        );

        if (!deletedHistory) {
            return res.status(404).json({ message: "Email history not found" });
        }

        return res.status(200).json({ 
            message: "Email history deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting email history:", error);
        return res.status(500).json({ 
            message: "Failed to delete email history",
            error: error.message 
        });
    }
};
