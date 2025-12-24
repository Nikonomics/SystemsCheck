const jwt = require('jsonwebtoken');
const { User, Facility, Team, Company, UserFacility } = require('../models');

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches user to req.user if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Token has expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Authentication check failed'
    });
  }
};

/**
 * Middleware factory to check if user has one of the allowed roles
 * @param  {...string} allowedRoles - Roles that can access the route
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware factory to check if user can access a specific facility
 * @param {string} facilityIdParam - Name of the request param containing facility ID
 */
const canAccessFacility = (facilityIdParam = 'facilityId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated'
        });
      }

      const facilityId = parseInt(req.params[facilityIdParam] || req.body[facilityIdParam]);

      if (!facilityId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Facility ID is required'
        });
      }

      // Admin and corporate can access all facilities
      if (['admin', 'corporate'].includes(req.user.role)) {
        return next();
      }

      // Get the facility with its team and company
      const facility = await Facility.findByPk(facilityId, {
        include: [{
          model: Team,
          as: 'team',
          include: [{
            model: Company,
            as: 'company'
          }]
        }]
      });

      if (!facility) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Facility not found'
        });
      }

      let hasAccess = false;

      switch (req.user.role) {
        case 'clinical_resource':
        case 'facility_leader':
          // Check user_facilities junction table
          const assignment = await UserFacility.findOne({
            where: {
              userId: req.user.id,
              facilityId: facilityId
            }
          });
          hasAccess = !!assignment;
          break;

        case 'team_leader':
          // Check if user is assigned to any facility in the same team
          const teamFacilities = await Facility.findAll({
            where: { teamId: facility.teamId },
            attributes: ['id']
          });
          const teamFacilityIds = teamFacilities.map(f => f.id);

          const teamAssignment = await UserFacility.findOne({
            where: {
              userId: req.user.id,
              facilityId: teamFacilityIds
            }
          });
          hasAccess = !!teamAssignment;
          break;

        case 'company_leader':
          // Check if user is assigned to any facility in the same company
          const companyTeams = await Team.findAll({
            where: { companyId: facility.team.companyId },
            attributes: ['id']
          });
          const companyTeamIds = companyTeams.map(t => t.id);

          const companyFacilities = await Facility.findAll({
            where: { teamId: companyTeamIds },
            attributes: ['id']
          });
          const companyFacilityIds = companyFacilities.map(f => f.id);

          const companyAssignment = await UserFacility.findOne({
            where: {
              userId: req.user.id,
              facilityId: companyFacilityIds
            }
          });
          hasAccess = !!companyAssignment;
          break;

        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this facility'
        });
      }

      // Attach facility to request for downstream use
      req.facility = facility;
      next();
    } catch (error) {
      console.error('Facility access check error:', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Facility access check failed'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  canAccessFacility
};
