/**
 * Helper utility for looking up deficiency tag definitions
 */
const definitions = require('../data/deficiencyDefinitions');

/**
 * Get the definition for a deficiency tag
 * @param {string} tag - Tag in any format: "F880", "F0880", "F-0880", "0880"
 * @returns {object} Tag definition with tag, name, description, category, prefix
 */
function getTagDefinition(tag) {
  if (!tag) {
    return { tag: '', name: 'Unknown', description: 'No definition available', category: 'Unknown', prefix: '' };
  }

  // Normalize tag: remove non-alphanumeric, uppercase
  let normalized = String(tag).replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // If tag starts with a number, try both E and F prefixes
  if (/^\d/.test(normalized)) {
    // Pad to 4 digits if needed
    normalized = normalized.padStart(4, '0');

    // Try F prefix first (more common), then E
    if (definitions['F' + normalized]) {
      return definitions['F' + normalized];
    }
    if (definitions['E' + normalized]) {
      return definitions['E' + normalized];
    }
  }

  // Try direct lookup
  if (definitions[normalized]) {
    return definitions[normalized];
  }

  // Try with padded number (e.g., F880 -> F0880)
  const match = normalized.match(/^([EF])(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = match[2].padStart(4, '0');
    const paddedKey = prefix + num;
    if (definitions[paddedKey]) {
      return definitions[paddedKey];
    }
  }

  // Return unknown
  return {
    tag: tag,
    name: 'Unknown Tag',
    description: 'No definition available for this tag',
    category: 'Unknown',
    prefix: tag.charAt(0).toUpperCase()
  };
}

/**
 * Format a tag for display (e.g., "880" -> "F-0880")
 * @param {string} tag - Raw tag
 * @returns {string} Formatted tag
 */
function formatTag(tag) {
  const def = getTagDefinition(tag);
  return def.tag || tag;
}

/**
 * Get short display name for a tag (e.g., "F880 - Infection Prevention")
 * @param {string} tag - Raw tag
 * @returns {string} Short display name
 */
function getTagDisplayName(tag) {
  const def = getTagDefinition(tag);
  const shortName = def.name.length > 40 ? def.name.substring(0, 37) + '...' : def.name;
  return `${def.tag} - ${shortName}`;
}

module.exports = { getTagDefinition, formatTag, getTagDisplayName };
