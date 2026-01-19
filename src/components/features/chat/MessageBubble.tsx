'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ChatMessage } from '@/hooks/chat/useChat';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = false,
}: MessageBubbleProps) {
  const timestamp = message.created_at ? new Date(message.created_at) : new Date();
  const isImage = (message as any).message_type === 'image' && (message as any).image_url;
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`flex items-end space-x-2 mb-1.5 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
      }`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage
            src={message.sender.avatar_url || undefined}
            alt={`${message.sender.first_name} ${message.sender.last_name}`}
          />
          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
            {(message.sender.first_name || message.sender.email || 'T').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when avatar is hidden */}
      {!showAvatar && !isOwnMessage && (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Message content */}
      <div className={`max-w-[300px] md:max-w-[420px] ${isOwnMessage ? 'items-end' : 'items-start'
        }`}>
        {/* Message bubble */}
        <div className={`
          relative px-3 py-2 rounded-2xl shadow-sm transition-colors
          ${isOwnMessage
            ? 'bg-emerald-500 text-white rounded-br-md'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
          }
          ${isImage ? 'p-1' : ''}
        `}>
          {isImage ? (
            <div className="relative">
              {!imageError && (message as any).image_url ? (
                <Image
                  src={(message as any).image_url}
                  alt="Liitetty kuva"
                  width={300}
                  height={200}
                  className="rounded-xl object-cover max-w-[300px] max-h-[200px] w-auto h-auto"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-[300px] h-[200px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                  {imageError ? 'Kuvan lataus epäonnistui' : 'Kuva ei saatavilla'}
                </div>
              )}
              {message.content && message.content !== 'Kuva' && (
                <div className={`
                  mt-2 px-3 pb-2
                  ${isOwnMessage ? 'text-white' : 'text-gray-900'}
                `}>
                  {message.content}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm break-words">
              {message.content}
            </p>
          )}

        </div>

        {/* Timestamp and status */}
        <div className={`
          flex items-center space-x-1 mt-1 px-1
          ${isOwnMessage ? 'justify-end' : 'justify-start'}
        `}>
          {showTimestamp && (
            <span className="text-xs text-gray-500">
              {format(timestamp, 'HH:mm', { locale: fi })}
            </span>
          )}

          {isOwnMessage && (
            <div className="flex items-center space-x-1">
              {message.is_read ? (
                <CheckCheck className="h-3 w-3 text-emerald-600" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}