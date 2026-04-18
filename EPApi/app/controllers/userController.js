import db from '../models/modrels.js';
const { User, Staff, Role, Consultation, Booking, Slot } = db;
import bcrypt from 'bcryptjs';
import log from '../utils/logger.js';

const UserController = {
  // --- LISTÁZÁS ---
  async index(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          { model: Role, as: 'role', attributes: ['id', 'name'], required: false },
          { model: Staff, as: 'staffProfile', required: false, attributes: ['isActive', 'specialty'] }
        ],
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      log(`ERROR - USER INDEX: ${error.message}`);
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.LOAD_ERROR' });
    }
  },

  // --- EGY FELHASZNÁLÓ RÉSZLETEI ---
  async show(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: Role, as: 'role', required: false },
          {
            model: Staff, as: 'staffProfile',
            include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
          }
        ]
      });
      if (!user) return res.status(404).json({ success: false, message: 'COMMON.NOT_FOUND' });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      log(`ERROR - USER SHOW: ${error.message}`);
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.FETCH_ERROR' });
    }
  },

  // --- LÉTREHOZÁS ---
  async create(req, res) {
    try {
      const { name, email, password, roleId, role, specialty } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);

      let finalRoleId = roleId;
      if (role === 'STAFF') finalRoleId = 1;
      else if (role === 'ADMIN') finalRoleId = 2;
      else if (role === 'USER') finalRoleId = 0;

      const newUser = await User.create({ name, email, password: hashedPassword, roleId: roleId || 0 });
      if (finalRoleId === 1 || role === 'STAFF') {
        await Staff.create({
          userId: newUser.id,
          specialty: specialty || '', 
          isActive: true
        });
      }
            
      const result = newUser.toJSON();
      delete result.password;
            
      res.status(201).json({ success: true, message: 'REGISTER.SWAL.SUCCESS_TITLE', data: result });
    } catch (error) {
      log(`ERROR - USER CREATE: ${error.message}`);
      res.status(500).json({ success: false, message: 'REGISTER.SWAL.ERROR_DEFAULT' });
    }
  },

  // --- SAJÁT PROFIL FRISSÍTÉSE (Ezt kereste az api.js!) ---
  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: 'COMMON.NOT_FOUND' });
      await user.update({ name: name || user.name, email: email || user.email });
      res.status(200).json({ success: true, message: 'USERS.MESSAGES.UPDATE_SUCCESS', data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.FETCH_ERROR'});
    }
  },

  // --- JELSZÓ MÓDOSÍTÁS (Ezt is kereste!) ---
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'COMMON.NOT_FOUND' });
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ password: hashedPassword });
      res.status(200).json({ success: true, message: 'USERS.MESSAGES.PASSWORD_UPDATE_SUCCESS' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.FETCH_ERROR' });
    }
  },

  // --- STÁTUSZ VÁLTÁS ---
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const staffProfile = await Staff.findOne({ where: { userId: id } });

      if (staffProfile) {
        staffProfile.isActive = isActive;
        await staffProfile.save();
      }
      res.status(200).json({ 
        success: true, 
        message: 'USERS.MESSAGES.STATUS_UPDATED_SUCCESS',
        data: { id, isActive } 
      });
        
    } catch (error) {
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.UPDATE_ERROR' });
    }
  },

  // --- ADATOK FRISSÍTÉSE (Admin) ---
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, roleId, role, specialty } = req.body;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message:'COMMON.NOT_FOUND' });
            
      let finalRoleId = roleId;
      if (role === 'STAFF') finalRoleId = 1;
      else if (role === 'ADMIN') finalRoleId = 2;
      else if (role === 'USER') finalRoleId = 0;
            
      await user.update({ 
        name: name || user.name, 
        email: email || user.email, 
        roleId: roleId !== undefined ? roleId : user.roleId 
      });
      if (specialty !== undefined) {
        let staffProfile = await Staff.findOne({ where: { userId: id } });
                
        if (staffProfile) {
          await staffProfile.update({ specialty: specialty });
        } else {
          await Staff.create({ userId: id, specialty: specialty, isActive: true });
        }
      }
      const updatedUser = await User.findByPk(id, {
        include: [{ model: Staff, as: 'staffProfile', required: false }]
      });

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- TÖRLÉS ---
  async destroy(req, res) {
    try {
      const userId = req.params.id;
      const staffProfile = await Staff.findOne({ where: { userId } });
      if (staffProfile) {
        staffProfile.isActive = false;
        await staffProfile.save();
      }
      res.status(200).json({ success: true, message: 'USERS.MESSAGES.DELETE_SUCCESS' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'COMMON.GENERIC_ERROR' });
    }
  },

  // --- SAJÁT PROFIL LEKÉRÉSE --- 
  async getMyProfile(req, res) {
    try {
      const userId = req.user.id; 
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password', 'verificationToken'] },
        include: [
          { model: Role, as: 'role', attributes: ['name'] },
          {
            model: Booking, as: 'bookings',
            include: [
              { model: Staff, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['name'] }] },
              { model: Slot, as: 'timeSlot' },
              { model: Consultation, as: 'treatment' }
            ]
          },
          { model: Staff, as: 'staffProfile', required: false }
        ]
      });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'USERS.MESSAGES.FETCH_ERROR' });
    }
  }
};

export default UserController;
