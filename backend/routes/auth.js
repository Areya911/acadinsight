const express = require('express');
const router = express.Router();
const { register, login, getProfile, getAllUsers, deleteUser } = require('../controllers/authController');
const { auth, roleCheck } = require('../middleware/auth');
const pool = require('../config/db');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getProfile);

// Admin and Faculty routes
router.get('/users', auth, roleCheck('admin', 'faculty'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, department, roll_number, semester, year, batch, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', auth, roleCheck('admin'), deleteUser);

module.exports = router;
