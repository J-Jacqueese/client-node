/**
 * multer 在路由里挂载；此处仅处理响应
 */
exports.sendEventUploadResult = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '未选择文件或文件类型不支持' });
  }
  const url = `/model_api/uploads/events/${req.file.filename}`;
  res.json({ success: true, url });
};

exports.sendAppIconUploadResult = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '未选择文件或文件类型不支持' });
  }
  const url = `/model_api/uploads/apps/${req.file.filename}`;
  res.json({ success: true, url });
};
