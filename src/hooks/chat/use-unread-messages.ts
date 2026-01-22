'use client';

import { useAuth } from '@/components/shared/providers/query-provider';
import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useUnreadMessages() {
  const supabase = createClient();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
  
  // Refs to prevent multiple subscription attempts
  const subscriptionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_profile_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread message count:', error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Exception fetching unread message count:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id || subscriptionRef.current) return;

    setConnectionStatus('connecting');
    console.log('Setting up real-time subscription for unread messages...');

    const messagesChannel = supabase
      .channel(`public:messages:unread:${user.id}`) // Unique channel name per user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_profile_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Unread messages subscription payload:', payload);
          // Immediate refresh on any message changes for this user
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_profile_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Message UPDATE detected for user, likely read status change:', payload);
          // Special handling for UPDATE events (like marking as read)
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        console.log('Real-time subscription status:', status, err);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to unread messages channel');
          setConnectionStatus('connected');
          retryAttempts.current = 0; // Reset retry attempts on successful connection
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('Unread messages channel error:', { status, error: err });
          setConnectionStatus('error');
          
          // Only retry if we haven't exceeded max attempts
          if (retryAttempts.current < maxRetries) {
            retryAttempts.current++;
            console.log(`Retrying real-time connection in ${retryDelay}ms (attempt ${retryAttempts.current}/${maxRetries})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              // Clean up current subscription before retrying
              if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
              }
              setupRealtimeSubscription();
            }, retryDelay);
          } else {
            console.warn('Max retry attempts reached for real-time connection. Falling back to periodic polling.');
            setConnectionStatus('disconnected');
          }
        }
        
        if (status === 'TIMED_OUT') {
          console.warn('Unread messages channel timed out');
          setConnectionStatus('error');
        }
        
        if (status === 'CLOSED') {
          console.log('Unread messages channel closed');
          setConnectionStatus('disconnected');
        }
      });

    subscriptionRef.current = messagesChannel;
  }, [supabase, user?.id, fetchUnreadCount]);

  const cleanupSubscription = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    retryAttempts.current = 0;
  }, [supabase]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    setupRealtimeSubscription();

    return cleanupSubscription;
  }, [user?.id, setupRealtimeSubscription, cleanupSubscription]);

  // Fallback polling when real-time fails
  useEffect(() => {
    if (connectionStatus === 'disconnected' && user?.id) {
      console.log('Real-time disconnected, falling back to polling...');
      
      const pollInterval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Poll every 30 seconds as fallback

      return () => clearInterval(pollInterval);
    }
  }, [connectionStatus, user?.id, fetchUnreadCount]);

  return { 
    unreadCount, 
    isLoading, 
    refetchUnreadCount: fetchUnreadCount,
    connectionStatus // Expose connection status for debugging
  };
} 