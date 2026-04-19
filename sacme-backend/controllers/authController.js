const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sacme_super_secret_dev_key';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** Helper to generate tokens */
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * 1. Login Endpoint
 * Unified login endpoint supporting all roles.
 */
exports.login = async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier is required.' });

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { admin: { adminId: identifier } },
                    { facultyAdvisor: { facultyId: identifier } },
                    { professor: { instructorId: identifier } },
                    { student: { rollNo: identifier } }
                ]
            },
            include: { admin: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or user not found.' });
        }

        // Check Rate Limit
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return res.status(403).json({ error: 'Account temporarily locked due to multiple failed login attempts. Try again later.' });
        }

        // Check Status
        if (user.account_status === 'DISABLED') {
            return res.status(403).json({ error: 'Account has been disabled by the administrator.', action: 'ACCOUNT_DISABLED' });
        }

        if (user.account_status === 'NOT_REGISTERED') {
            return res.status(403).json({
                error: 'Account not activated. Please verify your First Time Account Verification.',
                action: 'REDIRECT_TO_ACTIVATION',
                role: user.role
            });
        }

        // Proceed with normal login (ACTIVE status)
        if (!password) {
            return res.status(401).json({ error: 'Password is required for active accounts.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
        if (!isValidPassword) {
            const failedAttempts = user.failedLoginAttempts + 1;
            const updateData = { failedLoginAttempts: failedAttempts };
            
            if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
                const lockoutTime = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
                updateData.lockoutUntil = lockoutTime;
            }
            
            await prisma.user.update({ where: { id: user.id }, data: updateData });
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Successful login
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null } // Reset attempts
        });

        const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        // Return HTTP Only cookie instruction or standard response depending on frontend choice. 
        // For standard setup in NextJS, often the API returns the token and NextJS API routes set the cookie.
        const responseUser = { id: user.id, role: user.role, email: user.email };
        if (user.role === 'MAIN_ADMIN') {
            const institute = await prisma.institute.findFirst();
            responseUser.setupCompleted = institute ? institute.setupCompleted : false;
        }

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: responseUser
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 2. Activate Account
 */
exports.activate = async (req, res) => {
    const { activationToken, newPassword } = req.body;
    if (!activationToken || !newPassword) {
        return res.status(400).json({ error: 'Activation token and new password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { activationToken } });

        if (!user || user.account_status !== 'NOT_REGISTERED') {
            return res.status(400).json({ error: 'Invalid activation token or account already active.' });
        }

        // Password policy check (8+ chars, 1 num, 1 special)
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                account_status: 'ACTIVE',
                activationToken: null,
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });

        res.status(200).json({ message: 'Account successfully activated. Please log in.' });
    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 3. Generate OTP
 */
exports.generateOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        // Do not reveal whether email exists or not to prevent user enumeration
        if (!user || user.account_status === 'NOT_REGISTERED') {
            return res.status(200).json({ message: 'If the email is registered and active, an OTP has been sent.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { otpHash, otpExpiresAt, otpAttempts: 0 }
        });

        // Add audit log
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET_REQUESTED',
                userId: user.id,
                email: user.email,
                ipAddress: req.ip || '0.0.0.0'
            }
        });

        // Setup Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"SACME Support" <no-reply@sacme.edu>',
            to: email,
            subject: 'Password Reset OTP - SACME',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; padding: 30px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1e293b; margin: 0;">Password Reset OTP</h2>
                    </div>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello,</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5;">You recently requested to reset your password for your SACME account. Please use the verification code below:</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <h1 style="color: #2563eb; font-size: 42px; margin: 0; padding: 20px; background: #eff6ff; border-radius: 12px; letter-spacing: 6px; border: 1px solid #bfdbfe;">${otp}</h1>
                    </div>
                    
                    <p style="color: #64748b; font-size: 15px; text-align: center; line-height: 1.5;">This code will expire in <strong>5 minutes</strong>.<br/>If you didn't request this, you can safely ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">SACME Administration System</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions).catch(err => {
            console.error("Email send error:", err.message);
        });

        // Simulating Email sending by Logging to Console
        console.log(`\n======================================`);
        console.log(`[DEVELOPMENT] OTP for ${email} = ${otp}`);
        console.log(`======================================\n`);

        res.status(200).json({ message: 'If the email is registered and active, an OTP has been sent.' });
    } catch (error) {
        console.error('Generate OTP Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 4. Verify OTP
 */
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        if (user.otpAttempts >= 5) {
            return res.status(403).json({ error: 'Maximum OTP attempts exceeded. Please request a new OTP.' });
        }

        const isValidOtp = await bcrypt.compare(otp.toString(), user.otpHash);
        if (!isValidOtp) {
            await prisma.user.update({
                where: { id: user.id },
                data: { otpAttempts: { increment: 1 } }
            });
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        const passwordResetToken = generateToken();
        const passwordResetExpires = new Date(Date.now() + 5 * 60000); // 5 mins for reset link

        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpHash: null,
                otpExpiresAt: null,
                otpAttempts: 0,
                passwordResetToken,
                passwordResetExpires
            }
        });

        res.status(200).json({ message: 'OTP verified successfully.', passwordResetToken });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 5. Reset Password
 */
exports.resetPassword = async (req, res) => {
    const { email, passwordResetToken, newPassword } = req.body;
    if (!email || !passwordResetToken || !newPassword) {
        return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.passwordResetToken !== passwordResetToken || user.passwordResetExpires < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });

        // Add audit log
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET_COMPLETED',
                userId: user.id,
                email: user.email,
                ipAddress: req.ip || '0.0.0.0'
            }
        });

        res.status(200).json({ message: 'Password has been successfully reset.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 6. Logout
 * Instructs frontend to clear token via HTTP instructions.
 */
exports.logout = (req, res) => {
    // In a stateless JWT system with cookies, we clear the cookie.
    res.status(200).json({ message: 'Logged out successfully', action: 'CLEAR_TOKEN' });
};

/**
 * Change Password (Authenticated)
 */
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || '');
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash: hashedPassword }
        });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change Password Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 7. Me (Get Current User)
 * This expects a middleware to have set req.user via JWT verification.
 */
exports.me = async (req, res) => {
    try {
        // Assume authMiddleware extracts `req.user.userId` from token.
        // For demonstration, just returning a placeholder if middleware isn't here yet.
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { 
                student: true,
                professor: true,
                facultyAdvisor: true,
                admin: true
            }
        });
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Strip out the passwordHash if somehow included (though User has it, include includes it)
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        delete safeUser.activationToken;
        delete safeUser.otpHash;
        delete safeUser.passwordResetToken;

        res.status(200).json({ user: safeUser });
    } catch (error) {
        console.error('Me Endpoint Error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * 8. Claim Student Account
 */
exports.activateStudent = async (req, res) => {
    const { rollNo, email, newPassword } = req.body;
    if (!rollNo || !email || !newPassword) {
        return res.status(400).json({ error: 'Roll number, email, and new password are required.' });
    }
    try {
        const student = await prisma.student.findFirst({
            where: { rollNo },
            include: { user: true }
        });

        if (!student || student.user.email !== email) {
            return res.status(401).json({ error: 'Credentials do not match. Please check your roll number and college email.' });
        }

        if (student.user.account_status === 'DISABLED') {
            return res.status(403).json({ error: 'Account has been disabled. Contact your administrator.' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters with 1 number and 1 special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await prisma.user.update({
            where: { id: student.user.id },
            data: { passwordHash: hashedPassword, account_status: 'ACTIVE', activationToken: null }
        });

        const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Student account activated successfully.',
            token,
            user: { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email, name: student.name }
        });
    } catch (error) {
        console.error('Student Activation Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 9. Claim Faculty Advisor Account (Pre-Registered Identity Verification)
 */
exports.activateFacultyAdvisor = async (req, res) => {
    const { facultyId, email, newPassword } = req.body;
    
    if (!facultyId || !email || !newPassword) {
        return res.status(400).json({ error: 'Faculty ID, email, and new password are required.' });
    }

    try {
        // Find the pre-registered Faculty Advisor by facultyId and include their associated User record
        const advisor = await prisma.facultyAdvisor.findUnique({
            where: { facultyId },
            include: { user: true }
        });

        // Verify if record exists and email matches
        if (!advisor || advisor.user.email !== email) {
            return res.status(401).json({ error: 'Unauthorized registration. Credentials do not match our records.' });
        }

        // Ensure the account is indeed in NOT_REGISTERED status
        if (advisor.user.account_status !== 'NOT_REGISTERED') {
            return res.status(400).json({ error: 'Account has already been activated or is suspended.' });
        }

        // Validate password policy
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        // Hash the new password and update the User record to ACTIVE
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await prisma.user.update({
            where: { id: advisor.user.id },
            data: {
                passwordHash: hashedPassword,
                account_status: 'ACTIVE',
                activationToken: null
            }
        });

        // Issue JWT for immediate login upon claim
        const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Account successfully confirmed and activated.',
            token,
            user: { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email, name: advisor.name }
        });
    } catch (error) {
        console.error('Faculty Advisor Claim Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 9. Claim Professor Account (Pre-Registered Identity Verification)
 */
exports.activateProfessor = async (req, res) => {
    const { instructorId, email, newPassword } = req.body;
    
    if (!instructorId || !email || !newPassword) {
        return res.status(400).json({ error: 'Instructor ID, email, and new password are required.' });
    }

    try {
        // Find the pre-registered Professor by instructorId and include their associated User record
        const professor = await prisma.professor.findUnique({
            where: { instructorId },
            include: { user: true }
        });

        // Verify if record exists and email matches
        if (!professor || professor.user.email !== email) {
            return res.status(401).json({ error: 'Unauthorized registration. Credentials do not match our records or instructor ID not found.' });
        }

        // Ensure the account is indeed in NOT_REGISTERED status
        if (professor.user.account_status !== 'NOT_REGISTERED') {
            return res.status(400).json({ error: 'Account has already been activated or is suspended.' });
        }

        // Validate password policy
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        // Hash the new password and update the User record to ACTIVE
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await prisma.user.update({
            where: { id: professor.user.id },
            data: {
                passwordHash: hashedPassword,
                account_status: 'ACTIVE',
                activationToken: null
            }
        });

        // Issue JWT for immediate login upon claim
        const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Account successfully confirmed and activated.',
            token,
            user: { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email, name: professor.name }
        });
    } catch (error) {
        console.error('Professor Claim Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 10. Claim Main Admin Account (Pre-Registered Identity Verification)
 */
exports.activateMainAdmin = async (req, res) => {
    const { adminId, email, newPassword } = req.body;
    
    if (!adminId || !email || !newPassword) {
        return res.status(400).json({ error: 'Admin ID, email, and new password are required.' });
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { adminId },
            include: { user: true }
        });

        if (!admin || admin.user.email !== email) {
            return res.status(401).json({ error: 'Unauthorized registration. Credentials do not match our records.' });
        }

        if (admin.user.account_status !== 'NOT_REGISTERED') {
            return res.status(400).json({ error: 'Account has already been activated or is suspended.' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await prisma.user.update({
            where: { id: admin.user.id },
            data: {
                passwordHash: hashedPassword,
                account_status: 'ACTIVE',
                activationToken: null
            }
        });

        const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role, email: updatedUser.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Account successfully confirmed and activated.',
            token,
            user: { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email, name: admin.name }
        });
    } catch (error) {
        console.error('Main Admin Claim Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
