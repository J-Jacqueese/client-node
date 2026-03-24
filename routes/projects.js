const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);

router.post('/submit', projectController.submitProject);

router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.patch('/:id/approval', projectController.approveProject);

router.post('/:id/like', projectController.likeProject);

module.exports = router;

