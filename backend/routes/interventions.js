const express = require('express');
const router = express.Router();
const { auth, roleCheck } = require('../middleware/auth');
const ctrl = require('../controllers/interventionController');

router.get('/', auth, roleCheck('admin', 'faculty'), ctrl.getInterventions);
router.post('/', auth, roleCheck('admin', 'faculty'), ctrl.createIntervention);
router.get('/:id', auth, ctrl.getInterventionById);
router.put('/:id', auth, roleCheck('admin', 'faculty'), ctrl.updateIntervention);
router.get('/:id/updates', auth, ctrl.getInterventionUpdates);
router.post('/:id/updates', auth, roleCheck('admin', 'faculty'), ctrl.addInterventionUpdate);

module.exports = router;
