const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Facility, Team, Company, UserFacility } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

// ============================================
// PROFILE ROUTES (Available to authenticated users)
// ============================================

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] },
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

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (name only)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByPk(req.user.id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update profile' });
  }
});

/**
 * PUT /api/users/profile/password
 * Change current user's password
 */
router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'New password must be at least 8 characters long'
      });
    }

    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password is incorrect'
      });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to change password' });
  }
});

// ============================================
// ADMIN ROUTES (Require admin role)
// ============================================

/**
 * GET /api/users
 * List all users with pagination, search, and filters
 */
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    // Build where clause
    const whereClause = {};

    // Status filter
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    // Default: show all

    // Role filter
    if (role) {
      whereClause.role = role;
    }

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] },
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
      }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to list users'
    });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] },
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
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user'
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, password, firstName, lastName, role, facilityIds } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, firstName, lastName, and role are required'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate role
    const validRoles = ['clinical_resource', 'facility_leader', 'team_leader', 'company_leader', 'corporate', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by beforeCreate hook
      firstName,
      lastName,
      role
    }, { transaction });

    // Assign facilities if provided
    if (facilityIds && Array.isArray(facilityIds) && facilityIds.length > 0) {
      // Verify all facilities exist
      const facilities = await Facility.findAll({
        where: { id: facilityIds }
      });

      if (facilities.length !== facilityIds.length) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation error',
          message: 'One or more facility IDs are invalid'
        });
      }

      // Create assignments
      const assignments = facilityIds.map(facilityId => ({
        userId: user.id,
        facilityId
      }));

      await UserFacility.bulkCreate(assignments, { transaction });
    }

    await transaction.commit();

    // Fetch the created user with assignments
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] }
      }]
    });

    res.status(201).json({ user: createdUser });
  } catch (error) {
    await transaction.rollback();
    console.error('Create user error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/users/:id/password
 * Admin reset user password
 */
router.put('/:id/password', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to reset password' });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, password, firstName, lastName, role, facilityIds, isActive } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (email) {
      // Check if new email already exists for another user
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });
      if (existingUser && existingUser.id !== user.id) {
        await transaction.rollback();
        return res.status(409).json({
          error: 'Conflict',
          message: 'A user with this email already exists'
        });
      }
      user.email = email.toLowerCase();
    }

    if (password) {
      if (password.length < 8) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 8 characters long'
        });
      }
      user.passwordHash = password; // Will be hashed by beforeUpdate hook
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (role) {
      const validRoles = ['clinical_resource', 'facility_leader', 'team_leader', 'company_leader', 'corporate', 'admin'];
      if (!validRoles.includes(role)) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation error',
          message: `Role must be one of: ${validRoles.join(', ')}`
        });
      }
      user.role = role;
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    await user.save({ transaction });

    // Update facility assignments if provided
    if (facilityIds !== undefined) {
      // Remove existing assignments
      await UserFacility.destroy({
        where: { userId: user.id },
        transaction
      });

      // Add new assignments
      if (Array.isArray(facilityIds) && facilityIds.length > 0) {
        const facilities = await Facility.findAll({
          where: { id: facilityIds }
        });

        if (facilities.length !== facilityIds.length) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Validation error',
            message: 'One or more facility IDs are invalid'
          });
        }

        const assignments = facilityIds.map(facilityId => ({
          userId: user.id,
          facilityId
        }));

        await UserFacility.bulkCreate(assignments, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated user with assignments
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Facility,
        as: 'assignedFacilities',
        through: { attributes: [] },
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

    res.json({ user: updatedUser });
  } catch (error) {
    await transaction.rollback();
    console.error('Update user error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Soft delete a user (set is_active = false)
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
