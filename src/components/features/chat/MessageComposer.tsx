'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadChatImage, validateImageFile } from '@/lib/utils/image-upload';
import { ImageIcon, Send, X } from 'lucide-react';
import Image from 'next/image';
import { KeyboardEvent, useRef, useState } from 'react';

interface MessageComposerProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  taskId?: string; // Added for image upload path
}

export function MessageComposer({
  onSendMessage,
  isLoading = false,
  disabled = false,
  taskId = 'default',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || disabled || isLoading) return;

    try {
      let imageUrl: string | undefined;

      // Upload image to Supabase Storage if selectedImage exists
      if (selectedImage) {
        const uploadResult = await uploadChatImage(selectedImage.file, taskId);
        imageUrl = uploadResult.url;
      }

      onSendMessage(message.trim(), imageUrl);
      setMessage('');
      setSelectedImage(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Viestin lähetys epäonnistui');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using utility function
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, previewUrl });
  };

  const removeImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.previewUrl);
      setSelectedImage(null);
    }
  };

  const canSend = (message.trim() || selectedImage) && !disabled && !isLoading;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Image preview */}
      {selectedImage && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative inline-block">
            <Image
              src={selectedImage.previewUrl}
              alt="Esikatselu"
              width={120}
              height={80}
              className="rounded-lg object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end space-x-3">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Message input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Kirjoita viesti... (Enter = lähetä, Shift+Enter = rivinvaihto)"
              disabled={disabled}
              className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
              style={{
                height: 'auto',
                overflowY: message.split('\n').length > 3 ? 'auto' : 'hidden',
              }}
              onInput={(e) => {
                // Auto-resize textarea
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="sm"
            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 h-11 w-11 p-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Helper text - more compact */}
        <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">
              Enter
            </kbd>
            lähetä
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">
              ⇧ + ↵
            </kbd>
            rivinvaihto
          </span>
        </div>
      </div>
    </div>
  );
}