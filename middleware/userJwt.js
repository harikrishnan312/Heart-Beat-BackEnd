const jwt = require('jsonwebtoken');

const User = require('../model/userModel')


require('dotenv').config();

function userAuth(req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');

    jwt.verify(token, req.query.refresh ? process.env.REFRESHSECRETKEY : process.env.SECRETKEY, async (err, decoded) => {

      if (err) {
        return res.json({ error: 'Unauthorized' });
      }

      const userId = decoded.id;

      req.user = await User.findById(userId);
      if (req.user) {
        next();
      }
    });

  } catch (error) {
    res.status(401).json("You are not authenticated !!");
  }
}

module.exports = userAuth;
