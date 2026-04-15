'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface TaskAttachment {
  id: string;
  file_url: string;
  file_type: string;
}

interface MediaGalleryProps {
  attachments: TaskAttachment[];
  taskTitle: string;
}

export default function MediaGallery({ attachments, taskTitle }: MediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? attachments.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => 
      prev === attachments.length - 1 ? 0 : prev + 1
    );
  };

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  // Single image layout
  if (attachments.length === 1) {
    return (
      <div className="relative overflow-hidden rounded-xl shadow-lg group">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <div className="relative h-80 md:h-[500px] w-full cursor-zoom-in">
              <Image
                src={attachments[0].file_url}
                alt={`${taskTitle} kuva`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={attachments[0].file_url}
                alt={`${taskTitle} kuva`}
                width={1200}
                height={800}
                style={{ objectFit: 'contain' }}
                className="max-w-full max-h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Multiple images layout
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-xl shadow-lg group">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <div className="relative h-80 md:h-[400px] w-full cursor-zoom-in">
              <Image
                src={attachments[selectedImageIndex].file_url}
                alt={`${taskTitle} kuva ${selectedImageIndex + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </DialogTrigger>
          
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation buttons */}
              {attachments.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              <Image
                src={attachments[selectedImageIndex].file_url}
                alt={`${taskTitle} kuva ${selectedImageIndex + 1}`}
                width={1200}
                height={800}
                style={{ objectFit: 'contain' }}
                className="max-w-full max-h-full"
              />
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                {selectedImageIndex + 1} / {attachments.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {attachments.map((attachment, index) => (
          <button
            key={attachment.id}
            onClick={() => openModal(index)}
            className={`relative h-16 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              index === selectedImageIndex
                ? 'border-sky-500 ring-2 ring-primary/20'
                : 'border-transparent hover:border-slate-300'
            }`}
          >
            <Image
              src={attachment.file_url}
              alt={`${taskTitle} thumbnail ${index + 1}`}
              fill
              style={{ objectFit: 'cover' }}
              className="transition-opacity duration-200 hover:opacity-80"
            />
            {index === selectedImageIndex && (
              <div className="absolute inset-0 bg-primary bg-opacity-20" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}