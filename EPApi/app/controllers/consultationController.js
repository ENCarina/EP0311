import Consultation from '../models/consultation.js';

const ConsultationController = {
    // Központi hibakezelő metódus 
    handleError(res, error) {
        let status = 500;
        let message = 'COMMON.ERROR_GENERAL'; 

        if (error.message === 'Fail! Record not found!') {
            status = 404;
            message = 'SERVICES.MESSAGES.MISSING_ID'; 
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            status = 400;
            message = 'MESSAGES.AUTH.EMAIL_ALREADY_TAKEN'; 
        } else if (error.name === 'SequelizeValidationError') {
            status = 400;
            // Validációs hibáknál visszaadjuk a konkrét mező hibáját, vagy egy általános kulcsot
            message = 'USERS.MESSAGES.ALL_FIELDS_REQUIRED';
        }

        return res.status(status).json({
            success: false,
            message: message, // Ez egy kulcs (pl. SERVICES.MESSAGES.MISSING_ID)
            error: error.name || 'UnknownError',
            originalError: error.message // Debug célból
        });
    },


    async index(req, res) {
        try {
            const { specialty } = req.query; 
            const whereClause = specialty ? { specialty } : {};
            
            const consultations = await Consultation.findAll({ where: whereClause });
            return res.status(200).json({ success: true, data: consultations });
        } catch (error) {
            return ConsultationController.handleError(res, error);
        }
    },

    async show(req, res) {
        try {
            const consultation = await Consultation.findByPk(req.params.id);
            if (!consultation) throw new Error('Fail! Record not found!');
            return res.status(200).json({ success: true, data: consultation });
        } catch (error) {
            return ConsultationController.handleError(res, error);
        }
    },

    async store(req, res) {
        try {
            const consultation = await Consultation.create(req.body);
            return res.status(201).json({ 
                success: true, 
                message: 'SERVICES.MESSAGES.ADD_SUCCESS',
                data: consultation 
            });
        } catch (error) {
            return ConsultationController.handleError(res, error);
        }
    },

    async update(req, res) {
        try {
            const { id, ...updateData } = req.body;

            const [updatedRows] = await Consultation.update(updateData, {
                where: { id: req.params.id }
            });

            if (updatedRows === 0) throw new Error('Fail! Record not found!');

            const updatedConsultation = await Consultation.findByPk(req.params.id);
            return res.status(200).json({ 
                success: true, 
                message: 'SERVICES.MESSAGES.UPDATE_SUCCESS',
                data: updatedConsultation 
            });
        } catch (error) {
            return ConsultationController.handleError(res, error);
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Consultation.destroy({
                where: { id: req.params.id }
            });
            if (!deleted) throw new Error('Fail! Record not found!');
            
            return res.status(200).json({ 
                success: true, 
                message: 'SERVICES.MESSAGES.DELETE_SUCCESS' 
            });
        } catch (error) {
            return ConsultationController.handleError(res, error);
        }
    }
};

export default ConsultationController;
