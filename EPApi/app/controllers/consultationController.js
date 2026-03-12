import Consultation from '../models/consultation.js'

const ConsultationController = {
   handleError(res, error) {
    let status = 500;
    let message = error.message || 'Hiba történt a művelet során!';

    if (error.message === 'Fail! Record not found!') {
        status = 404;
    } else if (error.name === 'SequelizeUniqueConstraintError') {
        status = 400;
        message = 'Ez a név már foglalt! Kérlek, válassz másikat.';
    } else if (error.name === 'SequelizeValidationError') {
        status = 400;
        message = error.errors.map(e => e.message).join(', ');
    }

    res.status(status).json({
        success: false,
        message: message,
        error: error.name
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
            const { id, ...updateData } = req.body;

            const [updatedRows] = await Consultation.update(updateData, {
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
