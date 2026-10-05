const pool = require('../config/db');

exports.getInterventions = async (req, res) => {
  try {
    const { student_id, status, intervention_type } = req.query;
    let query = `
      SELECT i.*, 
             s.name as student_name, s.roll_number,
             f.name as faculty_name,
             sp.overall_score as student_score,
             rs.risk_score, rs.risk_level
      FROM interventions i
      JOIN users s ON i.student_id = s.id
      LEFT JOIN users f ON i.faculty_id = f.id
      LEFT JOIN student_performance sp ON i.student_id = sp.student_id
      LEFT JOIN risk_scores rs ON i.student_id = rs.student_id
      WHERE 1=1
    `;
    const params = [];
    let count = 1;
    
    if (student_id) { query += ` AND i.student_id = $${count++}`; params.push(student_id); }
    if (status) { query += ` AND i.status = $${count++}`; params.push(status); }
    if (intervention_type) { query += ` AND i.intervention_type = $${count++}`; params.push(intervention_type); }
    
    query += ` ORDER BY i.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ interventions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createIntervention = async (req, res) => {
  try {
    const { student_id, faculty_id, intervention_type, notes, target_improvement, target_date } = req.body;
    
    const riskRes = await pool.query('SELECT risk_score FROM risk_scores WHERE student_id = $1', [student_id]);
    const before_risk_score = riskRes.rows.length > 0 ? riskRes.rows[0].risk_score : null;
    
    const insertRes = await pool.query(`
      INSERT INTO interventions (student_id, faculty_id, intervention_type, notes, target_improvement, target_date, before_risk_score, current_risk_score, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [student_id, faculty_id, intervention_type, notes, target_improvement, target_date, before_risk_score, before_risk_score]);
    
    await pool.query(`
      INSERT INTO performance_alerts (student_id, alert_type, message, severity, created_at)
      VALUES ($1, 'Intervention Created', 'A new intervention has been created for this student.', 'info', NOW())
    `, [student_id]);
    
    res.status(201).json({ intervention: insertRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateIntervention = async (req, res) => {
  try {
    const { status, notes, current_risk_score } = req.body;
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE interventions
      SET status = COALESCE($1, status),
          notes = COALESCE($2, notes),
          current_risk_score = COALESCE($3, current_risk_score),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, notes, current_risk_score, id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ intervention: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getInterventionUpdates = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM intervention_updates WHERE intervention_id = $1 ORDER BY created_at ASC', [id]);
    res.json({ updates: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addInterventionUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, performance_snapshot } = req.body;
    
    const result = await pool.query(`
      INSERT INTO intervention_updates (intervention_id, notes, performance_snapshot, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [id, notes, performance_snapshot]);
    
    await pool.query('UPDATE interventions SET updated_at = NOW() WHERE id = $1', [id]);
    
    res.status(201).json({ update: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getInterventionById = async (req, res) => {
  try {
    const { id } = req.params;
    const intRes = await pool.query(`
      SELECT i.*, 
             s.name as student_name, s.roll_number,
             f.name as faculty_name
      FROM interventions i
      JOIN users s ON i.student_id = s.id
      LEFT JOIN users f ON i.faculty_id = f.id
      WHERE i.id = $1
    `, [id]);
    
    if (intRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const intervention = intRes.rows[0];
    
    const updatesRes = await pool.query('SELECT * FROM intervention_updates WHERE intervention_id = $1 ORDER BY created_at ASC', [id]);
    
    let effectiveness = null;
    if (intervention.before_risk_score !== null && intervention.current_risk_score !== null) {
      const b = parseFloat(intervention.before_risk_score);
      const c = parseFloat(intervention.current_risk_score);
      effectiveness = {
        before_risk: b,
        current_risk: c,
        improvement: b - c,
        risk_direction: b > c ? 'Decreased' : (b < c ? 'Increased' : 'Unchanged')
      };
    }
    
    res.json({ intervention, updates: updatesRes.rows, effectiveness });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
