const axios = require('axios');

(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'anandhospital99@gmail.com',
      password: 'Hospital@123',
      role: 'hospital',
    });
    console.log('loginRes:', loginRes.data);
    const token = loginRes.data.token;

    const pendingRes = await axios.get('http://localhost:5000/api/emergency/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('pendingRes:', pendingRes.data);

    const emergencyId = pendingRes.data.emergencies?.[0]?._id;
    console.log('first emergencyId', emergencyId);
    if (!emergencyId) {
      return;
    }

    const acceptRes = await axios.put(`http://localhost:5000/api/emergency/accept/${emergencyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('acceptRes:', acceptRes.data);
  } catch (err) {
    if (err.response) {
      console.error('error response', err.response.status, err.response.data);
    } else {
      console.error('error', err.message);
    }
  }
})();