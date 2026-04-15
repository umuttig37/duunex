'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@/hooks/chat/useChat';
import { differenceInMinutes, isSameDay } from 'date-fns';
import { useEffect, useRef } from 'react';
import { DateDivider } from './DateDivider';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading?: boolean;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages for better rendering
  const groupedMessages = messages.reduce((groups: Array<{
    date: Date;
    messages: Array<{
      message: ChatMessage;
      showAvatar: boolean;
      showTimestamp: boolean;
    }>;
  }>, message, index) => {
    const messageDate = message.created_at ? new Date(message.created_at) : new Date();
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];

    // Check if we need a new date group
    const prevMessageDate = prevMessage?.created_at ? new Date(prevMessage.created_at) : null;
    const needsNewDateGroup = !prevMessage || !prevMessageDate || !isSameDay(messageDate, prevMessageDate);

    if (needsNewDateGroup) {
      groups.push({
        date: messageDate,
        messages: [],
      });
    }

    const currentGroup = groups[groups.length - 1];

    // Determine if we should show avatar and timestamp
    const isOwnMessage = message.sender_profile_id === currentUserId;
    const prevMessageInGroup = currentGroup.messages[currentGroup.messages.length - 1]?.message;

    const prevMessageInGroupDate = prevMessageInGroup?.created_at ? new Date(prevMessageInGroup.created_at) : null;
    const shouldShowAvatar = !prevMessageInGroup ||
      prevMessageInGroup.sender_profile_id !== message.sender_profile_id ||
      (prevMessageInGroupDate && differenceInMinutes(messageDate, prevMessageInGroupDate) > 5);

    const nextMessageDate = nextMessage?.created_at ? new Date(nextMessage.created_at) : null;
    const shouldShowTimestamp = !nextMessage ||
      nextMessage.sender_profile_id !== message.sender_profile_id ||
      (nextMessageDate && differenceInMinutes(nextMessageDate, messageDate) > 5);

    currentGroup.messages.push({
      message,
      showAvatar: Boolean(shouldShowAvatar),
      showTimestamp: Boolean(shouldShowTimestamp),
    });

    return groups;
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Ladataan viestejä...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aloita keskustelu
          </h3>
          <p className="text-gray-500 max-w-sm">
            Lähetä ensimmäinen viesti aloittaaksesi keskustelun tämän tehtävän osalta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full">
      <div className="p-4 pb-6 space-y-1">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <DateDivider date={group.date} />
            {group.messages.map(({ message, showAvatar, showTimestamp }, messageIndex) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_profile_id === currentUserId}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}