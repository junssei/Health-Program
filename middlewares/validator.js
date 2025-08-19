module.exports = function validateRequest(req, res, next) {
  const { programName, requestedBy, programDescription } = req.body;

  if (!programName || !requestedBy) {
    return res.status(400).json({ error: 'Missing programName or requestedBy' });
  }

  // normalise empty description to empty string
  req.body.programDescription = programDescription || '';

  next();
};
