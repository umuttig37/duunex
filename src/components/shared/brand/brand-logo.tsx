import Image from 'next/image';

import { cn } from '@/lib/utils';

const logoAssets = {
  stacked: {
    src: '/images/brand/duunex-logo.png',
    width: 858,
    height: 700,
  },
  icon: {
    src: '/images/brand/duunex-icon.png',
    width: 588,
    height: 509,
  },
  wordmark: {
    src: '/images/brand/duunex-wordmark.png',
    width: 834,
    height: 164,
  },
} as const;

type BrandLogoProps = {
  variant?: keyof typeof logoAssets;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrandLogo({
  variant = 'wordmark',
  className,
  priority = false,
  sizes,
}: BrandLogoProps) {
  const logo = logoAssets[variant];

  return (
    <Image
      src={logo.src}
      alt="Duunex"
      width={logo.width}
      height={logo.height}
      priority={priority}
      sizes={sizes}
      className={cn('h-auto w-auto object-contain', className)}
    />
  );
}
