const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// 公共提交（会进入人工审核队列）
router.post('/submit', eventController.submitEvent);

// 后台：编辑/删除/审批
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.patch('/:id/approval', eventController.approveEvent);

// 互动
router.post('/:id/like', eventController.likeEvent);
router.post('/:id/register', eventController.registerEvent);

module.exports = router;

