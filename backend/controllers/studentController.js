const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Create new student (faculty only)
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, roll_number, department, semester, year, batch } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create student
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, roll_number, department, semester, year, batch, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id, name, email, role, roll_number, department, semester, year, batch, created_at',
      [
        name,
        email,
        hashedPassword,
        'student',
        roll_number || null,
        department || null,
        semester ? parseInt(semester) : null,
        year ? parseInt(year) : null,
        batch || null
      ]
    );
    
    res.status(201).json({
      message: 'Student created successfully',
      student: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all students (faculty/admin only)
exports.getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, roll_number, department, semester, year, batch, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['student']
    );
    
    res.json({
      students: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student by ID (faculty/admin only)
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, email, role, year, semester, department, roll_number, batch, created_at FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({
      student: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student info (faculty/admin only)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, year, semester, department, roll_number, batch } = req.body;
    
    // Check if student exists
    const existingStudent = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }
    
    // Update student with all academic fields
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email),
        year = COALESCE($3, year),
        semester = COALESCE($4, semester),
        department = COALESCE($5, department),
        roll_number = COALESCE($6, roll_number),
        batch = COALESCE($7, batch)
       WHERE id = $8 AND role = $9 
       RETURNING id, name, email, role, year, semester, department, roll_number, batch, created_at`,
      [name, email, year, semester, department, roll_number, batch, id, 'student']
    );
    
    res.json({
      message: 'Student updated successfully',
      student: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete student (admin only)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const existingStudent = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Delete student's skill scores first
    await pool.query('DELETE FROM skill_scores WHERE user_id = $1', [id]);
    
    // Delete student
    await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'student']);
    
    res.json({
      message: 'Student deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add skill scores for student (faculty only)
exports.addStudentScores = async (req, res) => {
  try {
    const { studentId, scores } = req.body;
    
    // Validate input
    if (!studentId || !scores || !Array.isArray(scores)) {
      return res.status(400).json({ error: 'Student ID and scores array are required' });
    }
    
    // Check if student exists
    const student = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [studentId, 'student']
    );
    
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get all skills for validation
    const skills = await pool.query('SELECT name FROM skills ORDER BY id');
    const validSkills = skills.rows.map(s => s.name);
    
    // Validate scores and insert
    const insertedScores = [];
    for (const scoreData of scores) {
      const { skillName, score } = scoreData;
      
      if (!skillName || score === undefined) {
        return res.status(400).json({ error: 'Skill name and score are required for each score entry' });
      }
      
      if (!validSkills.includes(skillName)) {
        return res.status(400).json({ error: `Invalid skill: ${skillName}` });
      }
      
      if (score < 0 || score > 100) {
        return res.status(400).json({ error: `Score must be between 0 and 100 for ${skillName}` });
      }
      
      // Get skill category
      const skillInfo = await pool.query('SELECT category FROM skills WHERE name = $1', [skillName]);
      const category = skillInfo.rows[0]?.category;
      
      // Delete existing score for this skill and student
      await pool.query(
        'DELETE FROM skill_scores WHERE user_id = $1 AND skill_name = $2',
        [studentId, skillName]
      );
      
      // Insert new score
      const result = await pool.query(
        'INSERT INTO skill_scores (user_id, skill_name, category, score, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [studentId, skillName, category, score]
      );
      
      insertedScores.push(result.rows[0]);
    }
    
    res.status(201).json({
      message: 'Student scores added successfully',
      scores: insertedScores
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student's skill scores (faculty/admin only)
exports.getStudentScores = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const student = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get student's scores
    const scores = await pool.query(
      'SELECT id, skill_name, category, score, created_at FROM skill_scores WHERE user_id = $1 ORDER BY skill_name',
      [id]
    );
    
    // Transform scores to match frontend format
    const transformedScores = scores.rows.map(row => ({
      ...row,
      total_score: row.score
    }));
    
    res.json({
      student: student.rows[0],
      scores: transformedScores
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
