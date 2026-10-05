const pool = require('../config/db');
const { recalculateAll, getStudentFullProfile, calculateRiskScore, detectWeakAreas, generateAcademicRoadmap } = require('../services/performanceEngine');

exports.getOverview = async (req, res) => {
  try {
    await recalculateAll();
    
    const countRes = await pool.query("SELECT COUNT(*) FROM users WHERE role='student'");
    const totalStudents = parseInt(countRes.rows[0].count);
    
    const classCountRes = await pool.query("SELECT classification, COUNT(*) FROM student_performance GROUP BY classification");
    let good_count = 0, average_count = 0, bad_count = 0;
    classCountRes.rows.forEach(r => {
      if(r.classification === 'GOOD') good_count = parseInt(r.count);
      if(r.classification === 'AVERAGE') average_count = parseInt(r.count);
      if(r.classification === 'BAD') bad_count = parseInt(r.count);
    });
    
    const riskCountRes = await pool.query("SELECT risk_level, COUNT(*) FROM risk_scores GROUP BY risk_level");
    let low_risk = 0, medium_risk = 0, high_risk = 0;
    riskCountRes.rows.forEach(r => {
      if(r.risk_level === 'LOW') low_risk = parseInt(r.count);
      if(r.risk_level === 'MEDIUM') medium_risk = parseInt(r.count);
      if(r.risk_level === 'HIGH') high_risk = parseInt(r.count);
    });
    
    const avgPerfRes = await pool.query("SELECT AVG(overall_score) FROM student_performance");
    const avg_performance = parseFloat(avgPerfRes.rows[0].avg || 0);
    
    const highRiskStudentsRes = await pool.query(`
      SELECT u.id, u.name, u.roll_number, u.department, sp.overall_score, rs.risk_score, rs.risk_level 
      FROM risk_scores rs
      JOIN users u ON rs.student_id = u.id
      JOIN student_performance sp ON u.id = sp.student_id
      WHERE rs.risk_level = 'HIGH'
      ORDER BY rs.risk_score DESC LIMIT 10
    `);
    
    const alertsRes = await pool.query(`
      SELECT pa.*, u.name as student_name 
      FROM performance_alerts pa
      JOIN users u ON pa.student_id = u.id
      ORDER BY pa.created_at DESC LIMIT 20
    `);
    
    const deptRiskRes = await pool.query(`
      SELECT u.department, AVG(rs.risk_score) as avg_risk, COUNT(u.id) as student_count
      FROM users u
      JOIN risk_scores rs ON u.id = rs.student_id
      WHERE u.role = 'student'
      GROUP BY u.department
    `);
    
    const semRiskRes = await pool.query(`
      SELECT u.semester, AVG(rs.risk_score) as avg_risk, COUNT(u.id) as student_count
      FROM users u
      JOIN risk_scores rs ON u.id = rs.student_id
      WHERE u.role = 'student'
      GROUP BY u.semester
    `);

    res.json({
      totalStudents,
      good_count, average_count, bad_count,
      low_risk, medium_risk, high_risk,
      avg_performance,
      high_risk_students: highRiskStudentsRes.rows,
      recent_alerts: alertsRes.rows,
      department_risk: deptRiskRes.rows,
      semester_risk: semRiskRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllStudentsAnalytics = async (req, res) => {
  try {
    const { department, semester, risk_level, classification, search } = req.query;
    
    let query = `
      SELECT u.id, u.name, u.email, u.roll_number, u.department, u.semester, u.year,
             sp.overall_score, sp.classification, rs.risk_score, rs.risk_level,
             COALESCE(rf.weak_subject_count, 0) as weak_areas_count,
             COALESCE(rf.weak_subject_count, 0) as weak_subject_count
      FROM users u
      LEFT JOIN student_performance sp ON u.id = sp.student_id
      LEFT JOIN risk_scores rs ON u.id = rs.student_id
      LEFT JOIN risk_factors rf ON u.id = rf.student_id
      WHERE u.role = 'student'
    `;
    const params = [];
    let count = 1;

    if (department) { query += ` AND u.department = $${count++}`; params.push(department); }
    if (semester) { query += ` AND u.semester = $${count++}`; params.push(semester); }
    if (risk_level) { query += ` AND rs.risk_level = $${count++}`; params.push(risk_level); }
    if (classification) { query += ` AND sp.classification = $${count++}`; params.push(classification); }
    if (search) { 
      query += ` AND (u.name ILIKE $${count} OR u.roll_number ILIKE $${count})`; 
      params.push(`%${search}%`); 
      count++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me' || !targetId) {
      targetId = req.user.userId || req.user.id;
    }
    targetId = parseInt(targetId);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const profile = await getStudentFullProfile(targetId);
    res.json(profile);
  } catch (err) {
    console.error('getStudentProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudentRisk = async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me' || !targetId) {
      targetId = req.user.userId || req.user.id;
    }
    targetId = parseInt(targetId);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const risk = await calculateRiskScore(targetId);
    res.json(risk);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudentWeakAreas = async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me' || !targetId) {
      targetId = req.user.userId || req.user.id;
    }
    targetId = parseInt(targetId);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const weak_areas = await detectWeakAreas(targetId);
    res.json({ weak_areas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSubjectAnalytics = async (req, res) => {
  try {
    const query = `
      SELECT subject_name, 
             AVG(marks::numeric/max_marks * 100) as avg_score,
             MIN(marks::numeric/max_marks * 100) as min_score,
             MAX(marks::numeric/max_marks * 100) as max_score,
             COUNT(DISTINCT sm.student_id) as total_students,
             SUM(CASE WHEN (marks::numeric/max_marks * 100) >= 75 THEN 1 ELSE 0 END) as good_count,
             SUM(CASE WHEN (marks::numeric/max_marks * 100) >= 50 AND (marks::numeric/max_marks * 100) < 75 THEN 1 ELSE 0 END) as average_count,
             SUM(CASE WHEN (marks::numeric/max_marks * 100) < 50 THEN 1 ELSE 0 END) as bad_count,
             SUM(CASE WHEN rs.risk_level = 'HIGH' THEN 1 ELSE 0 END) as high_risk_count
      FROM semester_marks sm
      LEFT JOIN risk_scores rs ON sm.student_id = rs.student_id
      WHERE max_marks > 0
      GROUP BY subject_name
      ORDER BY avg_score ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAttritionAnalytics = async (req, res) => {
  try {
    const riskCountRes = await pool.query("SELECT risk_level, COUNT(*) AS count FROM risk_scores GROUP BY risk_level");
    let low = 0, medium = 0, high = 0;
    riskCountRes.rows.forEach(r => {
      if (r.risk_level === 'LOW') low = parseInt(r.count || 0);
      if (r.risk_level === 'MEDIUM') medium = parseInt(r.count || 0);
      if (r.risk_level === 'HIGH') high = parseInt(r.count || 0);
    });
    const total = low + medium + high;

    const deptRiskRes = await pool.query(`
      SELECT u.department, AVG(rs.risk_score) as avg_risk
      FROM users u JOIN risk_scores rs ON u.id = rs.student_id
      WHERE u.role = 'student' GROUP BY u.department
    `);

    const semRiskRes = await pool.query(`
      SELECT u.semester, AVG(rs.risk_score) as avg_risk
      FROM users u JOIN risk_scores rs ON u.id = rs.student_id
      WHERE u.role = 'student' GROUP BY u.semester
    `);

    const incRiskRes = await pool.query(`
      SELECT u.id, u.name, rs.risk_score, rs.previous_risk_score
      FROM risk_scores rs JOIN users u ON rs.student_id = u.id
      WHERE rs.risk_score > rs.previous_risk_score
      ORDER BY (rs.risk_score - rs.previous_risk_score) DESC
    `);

    const factorsRes = await pool.query(`
      SELECT 
        AVG(academic_score) as avg_academic_risk,
        AVG(trend_score) as avg_trend_risk,
        AVG(attendance_score) as avg_attendance_risk,
        AVG(assignment_score) as avg_assignment_risk,
        AVG(engagement_score) as avg_engagement_risk
      FROM risk_factors
    `);
    const fRow = factorsRes.rows[0] || {};
    const top_risk_factors = [
      { factor: 'Academic Score', count: Math.round(parseFloat(fRow.avg_academic_risk || 0)) },
      { factor: 'Attendance', count: Math.round(parseFloat(fRow.avg_attendance_risk || 0)) },
      { factor: 'Assignment', count: Math.round(parseFloat(fRow.avg_assignment_risk || 0)) },
      { factor: 'Engagement', count: Math.round(parseFloat(fRow.avg_engagement_risk || 0)) },
      { factor: 'Recent Trend', count: Math.round(parseFloat(fRow.avg_trend_risk || 0)) }
    ];

    res.json({
      distribution: { low, medium, high, total },
      department_risk: deptRiskRes.rows,
      semester_risk: semRiskRes.rows,
      increasing_risk_students: incRiskRes.rows,
      top_risk_factors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllAlerts = async (req, res) => {
  try {
    const { is_read } = req.query;
    let query = `
      SELECT pa.*, u.name as student_name 
      FROM performance_alerts pa
      JOIN users u ON pa.student_id = u.id
    `;
    const params = [];
    if (is_read !== undefined) {
      query += ` WHERE pa.is_read = $1`;
      params.push(is_read === 'true');
    }
    query += ` ORDER BY pa.created_at DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.markAlertRead = async (req, res) => {
  try {
    await pool.query('UPDATE performance_alerts SET is_read=TRUE WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.recalculate = async (req, res) => {
  try {
    const result = await recalculateAll();
    res.json({ message: 'Recalculation complete', updated_count: result.updated_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudentRoadmap = async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me' || !targetId) {
      targetId = req.user.userId || req.user.id;
    }
    targetId = parseInt(targetId);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const roadmap = await generateAcademicRoadmap(targetId);
    res.json(roadmap);
  } catch (err) {
    console.error('getStudentRoadmap error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
