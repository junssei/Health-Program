module.exports = function notifier(req, res, next) {
  const { requestedBy, programName } = req.body;
  
  console.log(`📢 Notification: Health Program '${programName}' requested by '${requestedBy}' has been received.`);

  next();
};