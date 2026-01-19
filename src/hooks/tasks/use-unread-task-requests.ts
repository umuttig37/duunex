'use client';

import { useAuth } from '@/components/shared/providers/query-provider';
import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useUnreadTaskRequests() {
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
      // Count task requests (status: 'request_sent') assigned to this tasker
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_tasker_id', user.id)
        .eq('status', 'request_sent');

      if (error) {
        console.error('Error fetching unread task requests count:', error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Exception fetching unread task requests count:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id || subscriptionRef.current) return;

    setConnectionStatus('connecting');
    console.log('Setting up real-time subscription for task requests...');

    const taskRequestsChannel = supabase
      .channel(`public:tasks:requests:${user.id}`) // Unique channel name per tasker
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_tasker_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Task requests subscription payload:', payload);
          // Refresh count when tasks assigned to this tasker change
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        console.log('Task requests real-time subscription status:', status, err);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to task requests channel');
          setConnectionStatus('connected');
          retryAttempts.current = 0; // Reset retry attempts on successful connection
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('Task requests channel error:', { status, error: err });
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
          console.warn('Task requests channel timed out');
          setConnectionStatus('error');
        }
        
        if (status === 'CLOSED') {
          console.log('Task requests channel closed');
          setConnectionStatus('disconnected');
        }
      });

    subscriptionRef.current = taskRequestsChannel;
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