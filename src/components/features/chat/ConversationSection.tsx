'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Conversation } from '@/hooks/chat/useChat';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { ConversationListItem } from './ConversationListItem';

interface ConversationSectionProps {
  title: string;
  conversations: Conversation[];
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  defaultExpanded?: boolean;
  showCount?: boolean;
}

function ConversationSectionComponent({
  title,
  conversations,
  selectedConversationId,
  onConversationSelect,
  defaultExpanded = true,
  showCount = true,
}: ConversationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Memoize the toggle handler to prevent unnecessary re-renders
  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Memoize conversation select handler to prevent recreation on every render
  const handleConversationSelect = useCallback((conversation: Conversation) => {
    onConversationSelect(conversation);
  }, [onConversationSelect]);

  // Memoize expensive calculations
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      {/* Section Header */}
      <div className="px-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start p-2 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={handleToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          <span className="font-medium text-sm">{title}</span>
          {showCount && (
            <div className="ml-auto flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                {conversations.length}
              </Badge>
              {totalUnread > 0 && (
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                  {totalUnread} lukematon{totalUnread !== 1 ? 'ta' : ''}
                </Badge>
              )}
            </div>
          )}
        </Button>
      </div>

      {/* Conversations List */}
      {isExpanded && (
        <div>
          {conversations.map((conversation, index) => (
            <div key={conversation.id}>
              <ConversationListItem
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => handleConversationSelect(conversation)}
              />
              {index < conversations.length - 1 && (
                <Separator className="mx-4 my-1 border-gray-200" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Separator */}
      {isExpanded && <Separator className="mx-4 mt-3 mb-2 border-gray-300" />}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ConversationSection = memo(ConversationSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.selectedConversationId === nextProps.selectedConversationId &&
    prevProps.defaultExpanded === nextProps.defaultExpanded &&
    prevProps.showCount === nextProps.showCount &&
    prevProps.conversations.length === nextProps.conversations.length &&
    prevProps.conversations.every((conv, index) =>
      conv.id === nextProps.conversations[index]?.id &&
      conv.unreadCount === nextProps.conversations[index]?.unreadCount
    )
  );
});