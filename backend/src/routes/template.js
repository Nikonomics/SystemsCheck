const express = require('express');
const { Op } = require('sequelize');
const {
  AuditTemplate,
  AuditTemplateSystem,
  AuditTemplateItem,
  Scorecard,
  ScorecardSystem,
  ScorecardItem
} = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ============================================
// GET TEMPLATE
// ============================================

/**
 * GET /api/admin/template
 * Get the active audit template with all systems and items
 */
router.get('/', async (req, res) => {
  try {
    const template = await AuditTemplate.findOne({
      where: { isActive: true },
      include: [{
        model: AuditTemplateSystem,
        as: 'systems',
        include: [{
          model: AuditTemplateItem,
          as: 'items',
          order: [['sortOrder', 'ASC']]
        }],
        order: [['sortOrder', 'ASC']]
      }],
      order: [
        [{ model: AuditTemplateSystem, as: 'systems' }, 'sortOrder', 'ASC'],
        [{ model: AuditTemplateSystem, as: 'systems' }, { model: AuditTemplateItem, as: 'items' }, 'sortOrder', 'ASC']
      ]
    });

    if (!template) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No active template found. Please run the seed script to create one.'
      });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get template' });
  }
});

// ============================================
// UPDATE SYSTEM
// ============================================

/**
 * PUT /api/admin/template/systems/:id
 * Update a template system (name, sections, maxPoints)
 */
router.put('/systems/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { name, sections, maxPoints, pageDescription } = req.body;

    const templateSystem = await AuditTemplateSystem.findByPk(id, {
      include: [{
        model: AuditTemplate,
        as: 'template'
      }]
    });

    if (!templateSystem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Not found', message: 'Template system not found' });
    }

    // Update the template system
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sections !== undefined) updates.sections = sections;
    if (maxPoints !== undefined) updates.maxPoints = maxPoints;
    if (pageDescription !== undefined) updates.pageDescription = pageDescription;

    await templateSystem.update(updates, { transaction });

    // Update the parent template's updatedById
    await AuditTemplate.update(
      { updatedById: req.user.id },
      { where: { id: templateSystem.templateId }, transaction }
    );

    // Cascade update to draft scorecards if name changed
    if (name !== undefined) {
      await ScorecardSystem.update(
        { systemName: name },
        {
          where: {
            systemNumber: templateSystem.systemNumber
          },
          include: [{
            model: Scorecard,
            as: 'scorecard',
            where: { status: 'draft' }
          }],
          transaction
        }
      );

      // Use raw query for the join update
      await sequelize.query(`
        UPDATE scorecard_systems ss
        SET system_name = :name
        FROM scorecards s
        WHERE ss.scorecard_id = s.id
          AND ss.system_number = :systemNumber
          AND s.status = 'draft'
      `, {
        replacements: { name, systemNumber: templateSystem.systemNumber },
        transaction
      });
    }

    await transaction.commit();

    // Fetch updated system
    const updated = await AuditTemplateSystem.findByPk(id, {
      include: [{ model: AuditTemplateItem, as: 'items' }]
    });

    res.json({
      message: 'System updated successfully',
      system: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update system error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update system' });
  }
});

// ============================================
// UPDATE ITEM
// ============================================

/**
 * PUT /api/admin/template/items/:id
 * Update a template item (text, maxPoints, sampleSize, multiplier, inputType)
 */
router.put('/items/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { text, maxPoints, sampleSize, multiplier, inputType } = req.body;

    const templateItem = await AuditTemplateItem.findByPk(id, {
      include: [{
        model: AuditTemplateSystem,
        as: 'system',
        include: [{
          model: AuditTemplate,
          as: 'template'
        }]
      }]
    });

    if (!templateItem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Not found', message: 'Template item not found' });
    }

    // Build updates object
    const updates = {};
    if (text !== undefined) updates.text = text;
    if (maxPoints !== undefined) updates.maxPoints = maxPoints;
    if (sampleSize !== undefined) updates.sampleSize = sampleSize;
    if (multiplier !== undefined) updates.multiplier = multiplier;
    if (inputType !== undefined) updates.inputType = inputType;

    await templateItem.update(updates, { transaction });

    // Update the parent template's updatedById
    await AuditTemplate.update(
      { updatedById: req.user.id },
      { where: { id: templateItem.system.templateId }, transaction }
    );

    // Cascade update to draft scorecards
    // We need to update ScorecardItem where:
    // - The scorecard is in draft status
    // - The system matches this item's system number
    // - The item number matches this item's number
    const systemNumber = templateItem.system.systemNumber;
    const itemNumber = templateItem.itemNumber;

    // Build the scorecard item updates
    const scorecardItemUpdates = {};
    if (text !== undefined) scorecardItemUpdates.criteriaText = text;
    if (maxPoints !== undefined) scorecardItemUpdates.maxPoints = maxPoints;
    if (sampleSize !== undefined) scorecardItemUpdates.sampleSize = sampleSize;

    if (Object.keys(scorecardItemUpdates).length > 0) {
      // Use raw query for the complex join update
      const setClauses = [];
      const replacements = { systemNumber, itemNumber };

      if (text !== undefined) {
        setClauses.push('criteria_text = :text');
        replacements.text = text;
      }
      if (maxPoints !== undefined) {
        setClauses.push('max_points = :maxPoints');
        replacements.maxPoints = maxPoints;
      }
      if (sampleSize !== undefined) {
        setClauses.push('sample_size = :sampleSize');
        replacements.sampleSize = sampleSize;
      }

      if (setClauses.length > 0) {
        await sequelize.query(`
          UPDATE scorecard_items si
          SET ${setClauses.join(', ')}
          FROM scorecard_systems ss, scorecards s
          WHERE si.scorecard_system_id = ss.id
            AND ss.scorecard_id = s.id
            AND ss.system_number = :systemNumber
            AND si.item_number = :itemNumber
            AND s.status = 'draft'
        `, {
          replacements,
          transaction
        });
      }
    }

    await transaction.commit();

    // Fetch updated item
    const updated = await AuditTemplateItem.findByPk(id);

    res.json({
      message: 'Item updated successfully',
      item: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update item' });
  }
});

// ============================================
// BULK UPDATE ITEMS
// ============================================

/**
 * PUT /api/admin/template/systems/:systemId/items
 * Bulk update all items in a system
 */
router.put('/systems/:systemId/items', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { systemId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid input', message: 'Items must be an array' });
    }

    const templateSystem = await AuditTemplateSystem.findByPk(systemId, {
      include: [{
        model: AuditTemplate,
        as: 'template'
      }]
    });

    if (!templateSystem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Not found', message: 'Template system not found' });
    }

    // Update each item
    for (const itemData of items) {
      if (!itemData.id) continue;

      const updates = {};
      if (itemData.text !== undefined) updates.text = itemData.text;
      if (itemData.maxPoints !== undefined) updates.maxPoints = itemData.maxPoints;
      if (itemData.sampleSize !== undefined) updates.sampleSize = itemData.sampleSize;
      if (itemData.multiplier !== undefined) updates.multiplier = itemData.multiplier;
      if (itemData.inputType !== undefined) updates.inputType = itemData.inputType;

      if (Object.keys(updates).length > 0) {
        await AuditTemplateItem.update(updates, {
          where: { id: itemData.id, templateSystemId: systemId },
          transaction
        });
      }
    }

    // Update the parent template's updatedById
    await AuditTemplate.update(
      { updatedById: req.user.id },
      { where: { id: templateSystem.templateId }, transaction }
    );

    // Cascade update to draft scorecards for all items
    const systemNumber = templateSystem.systemNumber;

    for (const itemData of items) {
      if (!itemData.itemNumber) continue;

      const setClauses = [];
      const replacements = { systemNumber, itemNumber: itemData.itemNumber };

      if (itemData.text !== undefined) {
        setClauses.push('criteria_text = :text');
        replacements.text = itemData.text;
      }
      if (itemData.maxPoints !== undefined) {
        setClauses.push('max_points = :maxPoints');
        replacements.maxPoints = itemData.maxPoints;
      }
      if (itemData.sampleSize !== undefined) {
        setClauses.push('sample_size = :sampleSize');
        replacements.sampleSize = itemData.sampleSize;
      }

      if (setClauses.length > 0) {
        await sequelize.query(`
          UPDATE scorecard_items si
          SET ${setClauses.join(', ')}
          FROM scorecard_systems ss, scorecards s
          WHERE si.scorecard_system_id = ss.id
            AND ss.scorecard_id = s.id
            AND ss.system_number = :systemNumber
            AND si.item_number = :itemNumber
            AND s.status = 'draft'
        `, {
          replacements,
          transaction
        });
      }
    }

    await transaction.commit();

    // Fetch updated system with items
    const updated = await AuditTemplateSystem.findByPk(systemId, {
      include: [{
        model: AuditTemplateItem,
        as: 'items',
        order: [['sortOrder', 'ASC']]
      }]
    });

    res.json({
      message: 'Items updated successfully',
      system: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Bulk update items error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update items' });
  }
});

// ============================================
// GET DRAFT SCORECARD COUNT
// ============================================

/**
 * GET /api/admin/template/draft-count
 * Get count of draft scorecards that will be affected by template changes
 */
router.get('/draft-count', async (req, res) => {
  try {
    const count = await Scorecard.count({
      where: { status: 'draft' }
    });

    res.json({ draftCount: count });
  } catch (error) {
    console.error('Get draft count error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get draft count' });
  }
});

module.exports = router;
