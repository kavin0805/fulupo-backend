import Admin from "./modules/storeAdmin/Admin.js"

const createInitialAdmin = async () => {
  const adminExists = await Admin.findOne({ mobile: '8124372441' });

  if (!adminExists) {
    await Admin.create({ name: 'Kavin', mobile: '8124372441', role: 'masterAdmin' });
    console.log('Initial admin created');
  } else {
    console.log('Admin already exists');
  }
};

export default createInitialAdmin;