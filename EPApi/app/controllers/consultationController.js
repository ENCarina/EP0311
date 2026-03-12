import Consultation from '../models/consultation.js'

const ConsultationController = {
    handleError(res, error) {
        const status = error.message === 'Fail! Record not found!' ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Error! The query failed!',
            error: error.message
        });
    },

    async index(req, res) {
        try {
            const consultations = await Consultation.findAll();
            res.status(200).json({ success: true, data: consultations });
        } catch (error) {
            ConsultationController.handleError(res, error);
        }
    },

    async show(req, res) {
        try {
            const consultation = await Consultation.findByPk(req.params.id);
            if (!consultation) throw new Error('Fail! Record not found!');
            res.status(200).json({ success: true, data: consultation });
        } catch (error) {
            ConsultationController.handleError(res, error);
        }
    },

    async store(req, res) {
        try {
            const consultation = await Consultation.create(req.body);
            res.status(201).json({ success: true, data: consultation });
        } catch (error) {
            ConsultationController.handleError(res, error);
        }
    },

    async update(req, res) {
        try {
            const [updatedRows] = await Consultation.update(req.body, {
                where: { id: req.params.id }
            });

            if (updatedRows === 0) throw new Error('Fail! Record not found!');

            const updatedConsultation = await Consultation.findByPk(req.params.id);
            res.status(200).json({ success: true, data: updatedConsultation });
        } catch (error) {
            ConsultationController.handleError(res, error);
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Consultation.destroy({
                where: { id: req.params.id }
            });
            if (!deleted) throw new Error('Fail! Record not found!');
            res.status(200).json({ success: true, message: 'Törölve' });
        } catch (error) {
            ConsultationController.handleError(res, error);
        }
    }
};

export default ConsultationController;
