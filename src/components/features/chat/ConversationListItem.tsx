'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/hooks/chat/useChat';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { CheckCheck, Circle, ImageIcon, MessageCircle, Pin } from 'lucide-react';
import { memo } from 'react';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationListItemComponent({
  conversation,
  isSelected,
  onClick,
}: ConversationListItemProps) {
  const participant = conversation.participants[0];
  const lastMessage = conversation.lastMessage;

  // Get participant display name
  const participantName = participant
    ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || participant.email
    : 'Tuntematon käyttäjä';

  // Format last message timestamp
  const timeAgo = lastMessage?.timestamp
    ? formatDistanceToNow(lastMessage.timestamp, {
      addSuffix: true,
      locale: fi
    })
    : '';

  // Truncate last message content
  const truncatedContent = lastMessage?.content
    ? lastMessage.content.length > 50
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content
    : 'Ei viestejä';

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 text-left transition-all duration-200 hover:bg-gray-50 border-l-2 
        active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
        min-h-[80px] touch-manipulation
        ${isSelected ? 'bg-primary/5 border-l-sky-500 border-r-2 border-r-sky-500' : 'border-l-transparent hover:border-l-gray-200'}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12 md:h-10 md:w-10">
            <AvatarImage
              src={participant?.avatar_url || undefined}
              alt={participantName || 'User'}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {(participantName || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Online status indicator */}
          {conversation.isOnline && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-sky-500 rounded-full border-2 border-white">
              <div className="w-full h-full rounded-full animate-pulse bg-sky-400"></div>
            </div>
          )}

          {/* Tasker badge */}
          {participant?.role === 'tasker' && !conversation.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                }`}>
                {participantName}
              </h3>
              {conversation.pinned && (
                <Pin className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              {timeAgo && (
                <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:inline">
                  {timeAgo}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary text-white text-xs px-2 py-1 font-bold border border-sky-700 shadow-sm min-w-[20px] h-5 flex items-center justify-center"
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Task title */}
          <p className={`text-sm truncate mb-1 ${conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
            }`}>
            {conversation.task.title}
          </p>

          {/* Last message with read status */}
          <div className="flex items-center space-x-1">
            {lastMessage?.type === 'image' && (
              <ImageIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
            )}
            <p className={`text-xs truncate flex-1 ${conversation.unreadCount > 0 ? 'text-gray-600 font-medium' : 'text-gray-500'
              }`}>
              {lastMessage?.type === 'image' ? 'Kuva' : truncatedContent}
            </p>

            {/* Message delivery status */}
            {lastMessage && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                {conversation.unreadCount === 0 && lastMessage.senderId !== participant?.id && (
                  <CheckCheck className="h-3 w-3 text-sky-500" />
                )}
                {conversation.unreadCount > 0 && (
                  <Circle className="h-2 w-2 text-sky-500 fill-current" />
                )}
              </div>
            )}
          </div>

          {/* Task status indicator */}
          <div className="mt-1.5 flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${getTaskStatusStyle(conversation.task.status)}`}
            >
              {getTaskStatusLabel(conversation.task.status)}
            </Badge>

            {/* Section indicator for mobile */}
            <div className="md:hidden flex items-center space-x-1">
              {conversation.section === 'active' && (
                <MessageCircle className="h-3 w-3 text-blue-500" />
              )}
              {conversation.section === 'completed' && (
                <CheckCheck className="h-3 w-3 text-sky-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function getTaskStatusStyle(status: string): string {
  switch (status) {
    case 'open':
      return 'border-blue-200 text-blue-700 bg-blue-50';
    case 'assigned':
    case 'request_sent':
      return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'in_progress':
      return 'border-primary/20 text-primary bg-primary/5';
    case 'completed':
      return 'border-sky-200 text-sky-700 bg-sky-50';
    case 'cancelled':
    case 'disputed':
      return 'border-red-200 text-red-700 bg-red-50';
    case 'awaiting_payment':
    case 'paid':
      return 'border-purple-200 text-purple-700 bg-purple-50';
    default:
      return 'border-gray-200 text-gray-700 bg-gray-50';
  }
}

function getTaskStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Avoin';
    case 'assigned':
      return 'Määrätty';
    case 'request_sent':
      return 'Pyyntö lähetetty';
    case 'request_declined':
      return 'Pyyntö hylätty';
    case 'in_progress':
      return 'Käynnissä';
    case 'completed':
      return 'Valmis';
    case 'cancelled':
      return 'Peruttu';
    case 'disputed':
      return 'Kiistanalainen';
    case 'awaiting_payment':
      return 'Odottaa maksua';
    case 'paid':
      return 'Maksettu';
    default:
      return status;
  }
}

// Export memoized component to prevent unnecessary re-renders
export const ConversationListItem = memo(ConversationListItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.lastMessage?.timestamp?.getTime() === nextProps.conversation.lastMessage?.timestamp?.getTime() &&
    prevProps.conversation.task.status === nextProps.conversation.task.status
  );
});