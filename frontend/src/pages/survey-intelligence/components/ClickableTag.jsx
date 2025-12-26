/**
 * ClickableTag.jsx
 * Reusable component for F-tags that open the tag detail modal
 */

import React, { useContext } from 'react';
import { TagClickContext } from './TagClickContext';

const ClickableTag = ({ tag, count = null, showCount = true }) => {
  const { onTagClick } = useContext(TagClickContext);

  const handleClick = () => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  // Determine tag color based on prefix
  const getTagStyle = (tagName) => {
    if (tagName.startsWith('F')) {
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
    }
    if (tagName.startsWith('K') || tagName.startsWith('E')) {
      return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200';
    }
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${getTagStyle(tag)}`}
      title={`Click for details about ${tag}`}
    >
      <span>{tag}</span>
      {showCount && count !== null && (
        <span className="text-xs opacity-70">({count})</span>
      )}
    </button>
  );
};

export default ClickableTag;
