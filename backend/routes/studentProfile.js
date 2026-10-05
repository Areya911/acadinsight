const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, roleCheck } = require('../middleware/auth');

// Get student's semester marks (for the logged-in student)
router.get('/semester-marks', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    const result = await pool.query(
      `SELECT semester, subject_name, marks, max_marks, grade, created_at
       FROM semester_marks 
       WHERE student_id = $1 
       ORDER BY semester DESC, subject_name`,
      [studentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching semester marks:', error);
    res.status(500).json({ error: 'Failed to fetch semester marks' });
  }
});

// Get any student's semester marks (for faculty)
router.get('/:studentId/semester-marks', auth, roleCheck('faculty', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await pool.query(
      `SELECT semester, subject_name, marks, max_marks, grade, created_at
       FROM semester_marks 
       WHERE student_id = $1 
       ORDER BY semester DESC, subject_name`,
      [studentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching semester marks:', error);
    res.status(500).json({ error: 'Failed to fetch semester marks' });
  }
});

// Add/update semester marks (for faculty)
router.post('/semester-marks', auth, roleCheck('faculty', 'admin'), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Request body:', req.body);
    console.log('🔍 DEBUG: User ID:', req.user.userId);
    
    const { student_id, semester, subject_name, marks, max_marks, grade } = req.body;
    
    console.log('🔍 DEBUG: Parsed data:', {
      student_id,
      semester,
      subject_name,
      marks,
      max_marks,
      grade
    });
    
    // Insert or update semester marks
    const result = await pool.query(
      `INSERT INTO semester_marks (student_id, semester, subject_name, marks, max_marks, grade)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [student_id, semester, subject_name, marks, max_marks, grade]
    );
    
    console.log('🔍 DEBUG: Insert result:', result.rows[0]);
    
    const { recalculateStudent } = require('../services/performanceEngine');
    recalculateStudent(student_id).catch(err => console.error('Recalc error:', err));
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('🔍 DEBUG: Error adding semester marks:', error);
    console.error('🔍 DEBUG: Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to add semester marks' });
  }
});

// Delete semester marks (for faculty)
router.delete('/semester-marks/:id', auth, async (req, res) => {
  try {
    const markId = req.params.id;
    
    // Check if user is faculty or admin
    const User = require('../models/User');
    const userDetails = await User.findById(req.user.userId);
    
    if (!userDetails || (userDetails.role !== 'faculty' && userDetails.role !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized to delete semester marks' });
    }
    
    await pool.query('DELETE FROM semester_marks WHERE id = $1', [markId]);
    
    res.json({ message: 'Semester marks deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester marks:', error);
    res.status(500).json({ error: 'Failed to delete semester marks' });
  }
});

module.exports = router;
