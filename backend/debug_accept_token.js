require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hospitalUsers = await User.find({ role: 'hospital' }).lean();
    for (const user of hospitalUsers) {
      const token = jwt.sign({ id: user._id.toString(), role: 'hospital' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      console.log('USER', user.email, user._id.toString(), 'TOKEN', token.slice(0, 30) + '...');
      try {
        const pendingRes = await axios.get('http://localhost:5000/api/emergency/pending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('PENDING for', user.email, pendingRes.data.emergencies?.length);
        if (pendingRes.data.emergencies?.length) {
          console.log(JSON.stringify(pendingRes.data.emergencies, null, 2));
          const id = pendingRes.data.emergencies[0]._id;
          const acceptRes = await axios.put(`http://localhost:5000/api/emergency/accept/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('ACCEPT', acceptRes.data);
        }
      } catch (err) {
        console.error('ERR', user.email, err.response?.status, err.response?.data, err.message);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();