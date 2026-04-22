import db from '../models/modrels.js';
import log from '../utils/logger.js';

const ConsultationController = { 
  handleError(res, error) {
    console.error(`CONSULTATION ERROR: ${error.message}`);
    let status = 500;
    let message = 'COMMON.ERROR_GENERAL'; 

    if (error.message === 'Fail! Record not found!') {
      status = 404;
      message = 'SERVICES.MESSAGES.MISSING_ID'; 
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      status = 400;
      message = 'SERVICES.MESSAGES.DUPLICATE_NAME'; 
    } else if (error.name === 'SequelizeValidationError') {
      status = 400;
      message = 'USERS.MESSAGES.ALL_FIELDS_REQUIRED';
    }

    return res.status(status).json({
      success: false,
      message: message, 
      error: error.message,
      stack: error.stack
      //error: error.name || 'UnknownError',
    });
  },

  async index(req, res) {
    try {
      const { specialty } = req.query; 
      const whereClause = specialty ? { specialty } : {};
            
      const consultations = await db.Consultation.findAll({ where: whereClause });
      return res.status(200).json({ success: true, data: consultations });
    } catch (error) {
      return ConsultationController.handleError(res, error);
    }
  },

  async show(req, res) {
    try {
      const consultation = await db.Consultation.findByPk(req.params.id);
      if (!consultation) throw new Error('Fail! Record not found!');
      return res.status(200).json({ success: true, data: consultation });
    } catch (error) {
      return ConsultationController.handleError(res, error);
    }
  },

  async store(req, res) {
    try {
      const consultation = await db.Consultation.create(req.body);
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

      const [updatedRows] = await db.Consultation.update(updateData, {
        where: { id: req.params.id }
      });

      if (updatedRows === 0) throw new Error('Fail! Record not found!');

      const updatedConsultation = await db.Consultation.findByPk(req.params.id);
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
      const deleted = await db.Consultation.destroy({
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
