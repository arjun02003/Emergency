require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const User = require('./models/User');
const Emergency = require('./models/Emergency');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const waiting = await Emergency.find({ status: 'waiting_for_acceptance' }).lean();
    console.log('waiting_count', waiting.length);
    for (const emergency of waiting) {
      const assignedHospital = emergency.assignedHospital;
      console.log('EMERGENCY', emergency._id.toString());
      console.log('  assignedHospital:', assignedHospital, typeof assignedHospital);
      if (assignedHospital) {
        const hospDoc = await Hospital.findById(assignedHospital).lean();
        const userDoc = await User.findById(assignedHospital).lean();
        console.log('  hospitalDoc:', hospDoc ? hospDoc._id.toString() : null, hospDoc ? hospDoc.name : null, hospDoc ? hospDoc.email : null);
        console.log('  userDoc:', userDoc ? userDoc._id.toString() : null, userDoc ? userDoc.email : null, userDoc ? userDoc.role : null);
      }
      console.log('  hospitalQueue:', emergency.hospitalQueue);
      for (const qId of emergency.hospitalQueue || []) {
        const hospDoc = await Hospital.findById(qId).lean();
        console.log('    queueId', qId, 'hospitalDoc', hospDoc ? hospDoc._id.toString() : null, hospDoc ? hospDoc.name : null);
      }
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();