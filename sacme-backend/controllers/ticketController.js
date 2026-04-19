const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createTicket = async (req, res) => {
    try {
        const { title, issueType, priority, description } = req.body;
        
        const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
        if (!admin) return res.status(403).json({ error: 'Unauthorized' });

        const count = await prisma.ticket.count();
        const ticketId = `TCKT-${(count + 1).toString().padStart(3, '0')}`;

        const ticket = await prisma.ticket.create({
            data: {
                ticketId, title, issueType, priority, description, adminId: admin.id
            }
        });

        res.status(201).json({ message: 'Ticket Submitted Successfully', ticket });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getTickets = async (req, res) => {
    try {
        const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
        if (!admin) return res.status(403).json({ error: 'Unauthorized' });

        const tickets = await prisma.ticket.findMany({
            where: { adminId: admin.id },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ tickets });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};
