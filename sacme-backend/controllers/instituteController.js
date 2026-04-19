const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.setupInstitute = async (req, res) => {
    try {
        const {
            collegeName, shortName, logoUrl, address, state, city, postalCode,
            adminName, officialEmail, phone, alternatePhone
        } = req.body;

        const userId = req.user.id;

        if (req.user.role !== 'MAIN_ADMIN') {
            return res.status(403).json({ error: 'Only Main Admin can perform setup.' });
        }

        const existingInstitute = await prisma.institute.findFirst();
        if (existingInstitute && existingInstitute.setupCompleted) {
            return res.status(400).json({ error: 'Setup is already completed.' });
        }

        // Create Institute Record
        const institute = await prisma.institute.create({
            data: {
                collegeName, shortName, logoUrl, address, state, city, postalCode,
                adminName, officialEmail, phone, alternatePhone, setupCompleted: true
            }
        });

        res.status(201).json({ message: 'Institute setup completed successfully.', institute });
    } catch (error) {
        console.error('Setup Institute Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
