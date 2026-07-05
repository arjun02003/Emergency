const axios = require('axios');

async function run(email, password) {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password,
      role: 'hospital',
    });
    console.log('login success', loginRes.data.user.email, loginRes.data.user.role);
    const token = loginRes.data.token;

    const pendingRes = await axios.get('http://localhost:5000/api/emergency/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('pendingRes count', pendingRes.data.emergencies?.length);
    console.log(JSON.stringify(pendingRes.data, null, 2));

    const emergencyId = pendingRes.data.emergencies?.[0]?._id;
    if (!emergencyId) return;
    console.log('first emergency id', emergencyId);

    const acceptRes = await axios.put(`http://localhost:5000/api/emergency/accept/${emergencyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('acceptRes', acceptRes.data);
  } catch (err) {
    if (err.response) {
      console.error('status', err.response.status, err.response.data);
    } else {
      console.error('error', err.message);
    }
  }
}

(async () => {
  await run('debughospital@suraksha.com', 'Hospital@123');
  await run('anandhospital99@gmail.com', 'Hospital@123');
})();