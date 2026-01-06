const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Facility, Team, Company } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Account is deactivated'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and user info
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user with facility assignments
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] }, // Exclude junction table attributes
        include: [{
          model: Team,
          as: 'team',
          attributes: ['id', 'name'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name']
          }]
        }]
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user info'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 * Could implement token blacklist here if needed
 */
router.post('/logout', authenticateToken, async (req, res) => {
  // For now, just acknowledge the logout
  // Token invalidation is handled client-side by removing the token
  // In production, you might want to implement a token blacklist
  res.json({
    message: 'Logged out successfully'
  });
});

/**
 * POST /api/auth/onboarding-complete
 * Mark the current user's onboarding as completed
 */
router.post('/onboarding-complete', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    // Update onboarding status
    user.onboardingCompleted = true;
    await user.save();

    res.json({
      message: 'Onboarding completed',
      onboardingCompleted: true
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update onboarding status'
    });
  }
});

module.exports = router;
