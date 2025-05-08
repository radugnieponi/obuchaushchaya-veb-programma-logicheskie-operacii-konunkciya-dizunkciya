const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/dbConfig');
const { secret } = require('../config/authConfig');

const login = async (req, res) => {
  const { login, password } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('login', sql.NVarChar, login)
      .query('SELECT * FROM Users WHERE Login = @login');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    const isPasswordValid = bcrypt.compareSync(password, user.Password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.ID, role: user.Role }, secret, {
      expiresIn: '8h'
    });
    
    res.status(200).json({
      id: user.ID,
      login: user.Login,
      role: user.Role,
      token: token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  login
};