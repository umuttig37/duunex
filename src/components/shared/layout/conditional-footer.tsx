'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't render footer on dashboard or admin pages
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  
  if (isDashboard) {
    return null
  }
  
  return <Footer />
}