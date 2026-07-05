require('dotenv').config();
const mongoose = require('mongoose');
const Emergency = require('./models/Emergency');
const Hospital = require('./models/Hospital');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hospitals = await Hospital.find().lean();
    const hospitalIds = hospitals.map(h => h._id.toString());
    console.log('Existing hospital ids', hospitalIds);
    const emergencies = await Emergency.find().lean();
    console.log('Total emergencies', emergencies.length);
    emergencies.forEach(e => {
      const assigned = e.assignedHospital ? e.assignedHospital.toString() : null;
      const inHospital = assigned && hospitalIds.includes(assigned);
      if (e.status === 'waiting_for_acceptance' || e.status === 'hospital_accepted') {
        console.log('EMERGENCY', e._id.toString(), 'status', e.status, 'assignedHospital', assigned, 'valid?', inHospital);
      }
    });
    const valid = emergencies.filter(e => e.status==='waiting_for_acceptance' && e.assignedHospital && hospitalIds.includes(e.assignedHospital.toString()));
    const invalid = emergencies.filter(e => e.status==='waiting_for_acceptance' && (!e.assignedHospital || !hospitalIds.includes(e.assignedHospital.toString())));
    console.log('valid waiting', valid.length, 'invalid waiting', invalid.length);
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();