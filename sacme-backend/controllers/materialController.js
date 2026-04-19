const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.uploadMaterial = async (req, res) => {
    try {
        const { courseId, title, description, weekNumber, materialType, linkUrl } = req.body;
        const fileUrl = req.file ? `/public/uploads/materials/${req.file.filename}` : null;
        const fileName = req.file ? req.file.originalname : null;

        // Validation Rule
        if (!fileUrl && !linkUrl) {
            throw new Error("Material must include file or link");
        }

        if (fileUrl && linkUrl) {
            throw new Error("Material cannot include both file and link");
        }

        // Validate course existence and professor mapping
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const material = await prisma.courseMaterial.create({
            data: {
                courseId,
                title,
                description,
                weekNumber,
                materialType: materialType || (fileUrl ? 'FILE' : 'LINK'),
                fileUrl,
                fileName,
                linkUrl,
                uploadedBy: req.user.id
            }
        });

        // NOTIFY ENROLLED STUDENTS natively
        const courseWithStudents = await prisma.course.findUnique({
            where: { id: courseId },
            include: { semester: { include: { students: { where: { isDeleted: false } } } } }
        });

        if (courseWithStudents?.semester?.students) {
            const notifications = courseWithStudents.semester.students.map(student => ({
                userId: student.userId,
                title: 'New Course Material',
                message: `${courseWithStudents.code}: ${title} (${weekNumber}) has been uploaded.`,
                type: 'MATERIAL_UPLOAD',
                linkUrl: `/student/dashboard?courseId=${courseId}`
            }));

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications });
            }
        }

        res.status(201).json({ message: 'Material uploaded successfully', material });
    } catch (error) {
        console.error('Upload Material Error:', error);
        res.status(400).json({ error: error.message || 'Server Error' });
    }
};

exports.getCourseMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
        const take = parseInt(req.query.take) || 200;

        const materials = await prisma.courseMaterial.findMany({
            where: { courseId },
            take,
            orderBy: { createdAt: 'desc' }
        });

        // Resolve uploadedBy to actual professor/user names if needed, or frontend handles it
        // Since we stored req.user.id originally, we can lookup the user to attach the name.
        const populatedMaterials = await Promise.all(materials.map(async m => {
            const user = await prisma.user.findUnique({
                where: { id: m.uploadedBy },
                include: { professor: true, admin: true }
            });
            const uploaderName = user?.professor?.name || user?.admin?.name || "Faculty";
            return { ...m, uploaderName };
        }));

        res.status(200).json({ materials: populatedMaterials });
    } catch (error) {
        console.error('Fetch Materials Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { title, description, weekNumber, materialType, linkUrl } = req.body;

        const existing = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
        if (!existing) return res.status(404).json({ error: 'Material not found' });

        let fileUrl = existing.fileUrl;
        let fileName = existing.fileName;

        if (req.file) {
            fileUrl = `/public/uploads/materials/${req.file.filename}`;
            fileName = req.file.originalname;
            // Optionally delete old file
        }

        if (materialType === 'LINK' && linkUrl) {
            fileUrl = null;
            fileName = null;
        } else if (materialType === 'FILE' && req.file) {
            // we have fileUrl attached above
        } else if (materialType === 'FILE' && !req.file && !existing.fileUrl) {
            throw new Error("Material must include file or link");
        }

        const material = await prisma.courseMaterial.update({
            where: { id: materialId },
            data: {
                title,
                description,
                weekNumber,
                materialType: materialType || existing.materialType,
                fileUrl,
                fileName,
                linkUrl: materialType === 'FILE' ? null : linkUrl,
            }
        });

        res.status(200).json({ message: 'Material updated', material });
    } catch (error) {
        console.error('Update Material Error:', error);
        res.status(400).json({ error: error.message || 'Server Error' });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const existing = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
        if (!existing) return res.status(404).json({ error: 'Material not found' });

        if (existing.fileUrl) {
            const relativePath = existing.fileUrl.replace('/public/', 'public/');
            const fullPath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await prisma.courseMaterial.delete({ where: { id: materialId } });

        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Delete Material Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
