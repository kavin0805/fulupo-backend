import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../modules/onBoarding/User.js';

// Register User
export const registerUser = async (req, res) => {
  const { username, name, mobile_number, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const existingMobile = await User.findOne({ mobile_number });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already in use' });

    // ✅ Password Strength Validation
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({
    //     message: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
    //   });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      name,
      mobile_number,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
};


// Login User
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      data: {
        username: user.username,
        name: user.name,
        mobile_number: user.mobile_number,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in' });
  }
};
