const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock Database replicating the pre-registered state
const mockDB = {
    users: [
        {
            id: 'uuid-1',
            email: 'advisor1@college.edu',
            facultyId: 'FAC-2024-001',
            role: 'INSTITUTE_ADMIN',
            status: 'NOT_REGISTERED', // Pre-registered state waiting for activation
            passwordHash: null
        }
    ]
};

/**
 * @route POST /api/auth/signup/faculty-advisor
 * @desc  Verify pre-registered Faculty Advisor and activate account
 * @access Public
 */
exports.verifyAndActivateFaculty = async (req, res) => {
    try {
        const { facultyId, email, password } = req.body;

        // 1. Input Validation
        if (!facultyId || !email || !password) {
            return res.status(400).json({ error: 'Please provide Faculty ID, Email, and Password.' });
        }

        // 2. Pre-Registered Verification Model - Must match ID AND Email
        const userIndex = mockDB.users.findIndex(u => 
            u.facultyId === facultyId && 
            u.email === email && 
            u.role === 'INSTITUTE_ADMIN'
        );

        if (userIndex === -1) {
            return res.status(401).json({ 
                error: 'Verification failed. This account has not been authorized by the Main Admin.' 
            });
        }

        const user = mockDB.users[userIndex];

        // 3. Prevent Double Activation
        if (user.status === 'ACTIVE') {
            return res.status(400).json({ error: 'This account has already been activated. Please proceed to login.' });
        }

        // 4. Secure Password Hashing
        const saltRounds = 12; // Sufficient complexity for security
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 5. Update DB record to ACTIVE
        mockDB.users[userIndex] = {
            ...user,
            status: 'ACTIVE',
            passwordHash: hashedPassword
        };

        // 6. Generate JWT Session Token
        const token = jwt.sign(
            { id: user.id, role: user.role, facultyId: user.facultyId },
            process.env.JWT_SECRET || 'sacme-super-secret-key-fallback',
            { expiresIn: '8h' } // Typical academic shift duration
        );

        // 7. Successful Registration Response
        return res.status(200).json({
            message: 'Account successfully authenticated and activated.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: 'ACTIVE'
            }
        });

    } catch (error) {
        console.error('Faculty Activation Error:', error);
        return res.status(500).json({ error: 'Internal server error during DB activation routine.' });
    }
};
