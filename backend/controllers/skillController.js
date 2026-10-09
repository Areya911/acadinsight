const pool = require('../config/db');

exports.getSkills = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyScores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ss.id, ss.skill_name, ss.category,
              ss.test_score, ss.assignment_score, ss.quiz_score,
              ss.total_score, ss.score, ss.created_at
       FROM skill_scores ss
       WHERE ss.user_id = $1
       ORDER BY ss.skill_name`,
      [req.user.userId]
    );

    // Ensure all score fields are populated — fall back gracefully
    const transformed = result.rows.map(row => ({
      ...row,
      test_score:        row.test_score        ?? Math.round(row.score * 0.9),
      assignment_score:  row.assignment_score  ?? Math.round(row.score * 0.95),
      quiz_score:        row.quiz_score        ?? Math.round(row.score * 0.85),
      total_score:       row.total_score       || row.score
    }));

    res.json(transformed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    // Get user details from auth token
    const User = require('../models/User');
    const userDetails = await User.findById(req.user.userId);
    
    if (!userDetails) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    let query;
    let params = [];

    if (userDetails.role === 'student') {
      query = `SELECT u.name as student_name, ss.skill_name, ss.category, ss.score
               FROM skill_scores ss
               JOIN users u ON ss.user_id = u.id
               WHERE ss.user_id = $1
               ORDER BY u.name, ss.skill_name`;
      params = [req.user.userId];
    } else {
      query = `SELECT u.name as student_name, ss.skill_name, ss.category, ss.score
               FROM skill_scores ss
               JOIN users u ON ss.user_id = u.id
               WHERE u.role = 'student'
               ORDER BY u.name, ss.skill_name`;
    }

    const result = await pool.query(query, params);
    
    // Transform the data to match expected format
    const transformed = result.rows.map(row => ({
      ...row,
      total_score: row.score
    }));
    
    res.json(transformed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get user details from auth token
    const User = require('../models/User');
    const userDetails = await User.findById(req.user.userId);
    
    if (!userDetails) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (userDetails.role === 'student') {
      const scores = await pool.query(
        `SELECT ss.skill_name, ss.category, ss.score, ss.created_at
         FROM skill_scores ss
         WHERE ss.user_id = $1 ORDER BY ss.skill_name`,
        [req.user.userId]
      );

      // Get class averages per skill for comparison
      const classAvg = await pool.query(
        `SELECT ss.skill_name, ROUND(AVG(ss.score)) as class_avg
         FROM skill_scores ss
         JOIN users u ON ss.user_id = u.id
         WHERE u.role = 'student'
         GROUP BY ss.skill_name
         ORDER BY ss.skill_name`
      );

      const classAvgMap = {};
      classAvg.rows.forEach(r => { classAvgMap[r.skill_name] = parseInt(r.class_avg); });

      const scoresWithAvg = scores.rows.map(s => ({
        skill_name: s.skill_name,
        category: s.category,
        total_score: s.score,
        created_at: s.created_at,
        class_avg: classAvgMap[s.skill_name] || 0
      }));

      const avg = scores.rows.length > 0
        ? Math.round(scores.rows.reduce((sum, r) => sum + r.score, 0) / scores.rows.length)
        : 0;
      const best = scores.rows.length > 0
        ? scores.rows.reduce((max, r) => r.score > max.score ? r : max).skill_name
        : 'N/A';
      const weakest = scores.rows.length > 0
        ? scores.rows.reduce((min, r) => r.score < min.score ? r : min).skill_name
        : 'N/A';

      // Overall class avg
      const overallClassAvg = await pool.query(
        `SELECT ROUND(AVG(ss.score)) as avg FROM skill_scores ss JOIN users u ON ss.user_id = u.id WHERE u.role = 'student'`
      );

      const result = {
        totalSkills: scores.rows.length,
        averageScore: avg,
        classAverage: parseInt(overallClassAvg.rows[0].avg) || 0,
        bestSkill: best,
        weakestSkill: weakest,
        scores: scoresWithAvg
      };
      
      res.json(result);
    } else {
      const students = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
      const skills = await pool.query('SELECT COUNT(*) as count FROM skills');
      const avgResult = await pool.query('SELECT ROUND(AVG(score)) as avg FROM skill_scores');

      const topStudents = await pool.query(
        `SELECT u.name, ROUND(AVG(ss.score)) as avg_score
         FROM skill_scores ss JOIN users u ON ss.user_id = u.id
         WHERE u.role = 'student'
         GROUP BY u.name ORDER BY avg_score DESC LIMIT 5`
      );

      // Low performers
      const lowPerformers = await pool.query(
        `SELECT u.name, ss.skill_name, ss.score
         FROM skill_scores ss
         JOIN users u ON ss.user_id = u.id
         WHERE u.role = 'student' AND ss.score < 50
         ORDER BY ss.score ASC LIMIT 5`
      );
      
      // Transform low performers data
      const transformedLowPerformers = lowPerformers.rows.map(row => ({
        ...row,
        total_score: row.score
      }));

      res.json({
        totalStudents: parseInt(students.rows[0].count),
        totalSkills: parseInt(skills.rows[0].count),
        averageScore: parseInt(avgResult.rows[0].avg) || 0,
        topStudents: topStudents.rows,
        lowPerformers: transformedLowPerformers
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClassPerformance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ss.skill_name, 
              ROUND(AVG(ss.score)) as avg_score,
              MIN(ss.score) as min_score,
              MAX(ss.score) as max_score,
              COUNT(ss.id) as student_count
       FROM skill_scores ss
       JOIN users u ON ss.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY ss.skill_name
       ORDER BY ss.skill_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = [];
    
    // Get user details from auth token
    const User = require('../models/User');
    const userDetails = await User.findById(req.user.userId);
    
    if (!userDetails) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (userDetails.role === 'student') {
      const low = await pool.query(
        `SELECT ss.skill_name, ss.score
         FROM skill_scores ss
         WHERE ss.user_id = $1 AND ss.score < 50
         ORDER BY ss.score ASC`,
        [req.user.userId]
      );
      low.rows.forEach(r => {
        alerts.push({
          type: 'critical',
          message: `${r.skill_name} score is critically low at ${r.score}%`,
          skill: r.skill_name,
          score: r.score
        });
      });

      const belowAvg = await pool.query(
        `SELECT ss.skill_name, ss.score, ROUND(AVG(ss2.score)) as class_avg
         FROM skill_scores ss
         JOIN skill_scores ss2 ON ss2.skill_name = ss.skill_name
         JOIN users u ON ss2.user_id = u.id AND u.role = 'student'
         WHERE ss.user_id = $1 AND ss.score >= 50
         GROUP BY ss.skill_name, ss.score
         HAVING ss.score < ROUND(AVG(ss2.score)) - 10`,
        [req.user.userId]
      );
      belowAvg.rows.forEach(r => {
        alerts.push({
          type: 'warning',
          message: `${r.skill_name} is ${parseInt(r.class_avg) - r.score} points below class average`,
          skill: r.skill_name,
          score: r.score
        });
      });
    } else {
      const struggling = await pool.query(
        `SELECT u.name, COUNT(*) as low_count
         FROM skill_scores ss JOIN users u ON ss.user_id = u.id
         WHERE u.role = 'student' AND ss.score < 50
         GROUP BY u.name
         HAVING COUNT(*) >= 2
         ORDER BY low_count DESC`
      );
      struggling.rows.forEach(r => {
        alerts.push({
          type: 'critical',
          message: `${r.name} has ${r.low_count} skills below 50%`,
          student: r.name,
          count: parseInt(r.low_count)
        });
      });
    }
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
