const { auth } = require('../config/firebase');

const verifyAuth = async (req, res, next) => {
  try {
    // Demo bypass: allow x-demo-user header with JSON user data
    const demoHeader = req.headers['x-demo-user'];
    if (demoHeader) {
      try {
        req.user = JSON.parse(demoHeader);
        return next();
      } catch {
        return res.status(400).json({ error: 'Invalid x-demo-user JSON' });
      }
    }

    // Standard Firebase JWT auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
};

module.exports = { verifyAuth };
