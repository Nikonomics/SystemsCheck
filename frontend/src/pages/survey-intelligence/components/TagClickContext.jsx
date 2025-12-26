/**
 * TagClickContext
 *
 * Provides a consistent way to handle tag clicks across all Survey Intelligence components.
 * When a tag is clicked, it opens the TagDetailModal with the tag's details.
 *
 * Usage:
 * 1. Wrap your Survey Intelligence page with <TagClickProvider>
 * 2. Use useTagClick() hook in any component to get the onTagClick handler
 * 3. Call onTagClick(tagId) when a tag is clicked
 *
 * Example:
 * const { onTagClick } = useTagClick();
 * <button onClick={() => onTagClick('F880')}>F880</button>
 */

import { createContext, useContext, useState, useCallback } from 'react';
import TagDetailModal from './TagDetailModal';

const TagClickContext = createContext(null);

export function TagClickProvider({ children, facilityId, state }) {
  const [selectedTag, setSelectedTag] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onTagClick = useCallback((tag) => {
    if (tag) {
      setSelectedTag(tag);
      setIsModalOpen(true);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Keep selectedTag for a moment to prevent flashing during close animation
    setTimeout(() => setSelectedTag(null), 300);
  }, []);

  return (
    <TagClickContext.Provider value={{ onTagClick, selectedTag, isModalOpen }}>
      {children}
      <TagDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tag={selectedTag}
        facilityId={facilityId}
        state={state}
      />
    </TagClickContext.Provider>
  );
}

export function useTagClick() {
  const context = useContext(TagClickContext);
  if (!context) {
    // Return a no-op function if context is not available
    // This allows components to be used outside the provider
    return {
      onTagClick: () => console.warn('TagClickContext not available'),
      selectedTag: null,
      isModalOpen: false
    };
  }
  return context;
}

/**
 * ClickableTag Component
 *
 * A reusable clickable tag component that integrates with TagClickContext.
 * Use this for consistent tag styling and click behavior.
 */
export function ClickableTag({
  tag,
  tagFormatted,
  tagName,
  className = '',
  showName = false,
  size = 'sm', // 'sm', 'md', 'lg'
  variant = 'default' // 'default', 'pill', 'badge'
}) {
  const { onTagClick } = useTagClick();

  const displayTag = tagFormatted || tag;
  const tagId = tag; // The raw tag ID to pass to the modal

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded',
    pill: 'bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full',
    badge: 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 rounded border border-purple-200'
  };

  return (
    <button
      onClick={() => onTagClick(tagId)}
      className={`
        inline-flex items-center gap-1 font-mono font-medium
        transition-colors cursor-pointer
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      title={tagName || `Click for details on ${displayTag}`}
    >
      {displayTag}
      {showName && tagName && (
        <span className="font-sans font-normal text-gray-500">- {tagName}</span>
      )}
    </button>
  );
}

export default TagClickContext;
