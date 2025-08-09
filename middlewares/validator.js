module.exports = function validateRequest(req, res, next) {
  const { programName, requestedBy } = req.body;

  if (!programName || !requestedBy) {
    return res.status(400).json({ error: 'Missing programName or requestedBy' });
  }

  next();
};
