'use client';

import { useAuth } from '@/components/shared/providers/query-provider';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

export interface ConversationParticipant extends UserProfile {}

export interface ChatMessage extends Message {
  sender: UserProfile;
  receiver: UserProfile;
}

export interface Conversation {
  id: string; // task_id
  taskId: string;
  task: Task;
  participants: ConversationParticipant[];
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
    type: 'text' | 'image';
  };
  unreadCount: number;
  pinned?: boolean;
  section: 'active' | 'completed' | 'archived';
  isOnline?: boolean; // For participant online status
}

interface UseChatOptions {
  conversationId?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const supabase = createClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned' | 'active' | 'completed'>('all');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const subscriptionRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStatusRef = useRef<'connected' | 'connecting' | 'disconnected'>('connecting');
  const retryTriggerRef = useRef(0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // Keep ref in sync with state
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // Helper function to determine conversation section based on task status
  const getConversationSection = (taskStatus: string): 'active' | 'completed' | 'archived' => {
    const completedStatuses = ['completed', 'cancelled', 'disputed'];
    const archivedStatuses = ['early_completed']; // Can be extended
    
    if (completedStatuses.includes(taskStatus)) return 'completed';
    if (archivedStatuses.includes(taskStatus)) return 'archived';
    return 'active';
  };

  // Fetch conversations with proper unread count
  const {
    data: conversations = [],
    isLoading: loadingConversations,
    error: conversationsError,
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, get all messages for conversations where user is involved
      const { data: rawMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          task:tasks!inner(*),
          sender:profiles!messages_sender_profile_id_fkey(*),
          receiver:profiles!messages_receiver_profile_id_fkey(*)
        `)
        .or(`sender_profile_id.eq.${user.id},receiver_profile_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by task_id to create conversations
      const conversationMap = new Map<string, Conversation>();
      const profileMap = new Map<string, UserProfile>();
      const unreadCounts = new Map<string, number>();

      rawMessages?.forEach((msg: any) => {
        const taskId = msg.task_id;
        const sender = msg.sender;
        const receiver = msg.receiver;

        // Build profile map
        if (sender) profileMap.set(sender.id, sender);
        if (receiver) profileMap.set(receiver.id, receiver);

        // Calculate unread count (messages sent to current user that are unread)
        if (msg.receiver_profile_id === user.id && !msg.is_read) {
          unreadCounts.set(taskId, (unreadCounts.get(taskId) || 0) + 1);
        }

        if (!conversationMap.has(taskId)) {
          // Get the other participant (not current user)
          const otherParticipantId = msg.sender_profile_id === user.id 
            ? msg.receiver_profile_id 
            : msg.sender_profile_id;
          
          const participants = [profileMap.get(otherParticipantId)].filter(Boolean) as UserProfile[];
          const section = getConversationSection(msg.task.status);

          conversationMap.set(taskId, {
            id: taskId,
            taskId,
            task: msg.task,
            participants,
            lastMessage: {
              content: msg.content,
              timestamp: new Date(msg.created_at || new Date().toISOString()),
              senderId: msg.sender_profile_id,
              type: ((msg as any).message_type as 'text' | 'image') || 'text',
            },
            unreadCount: unreadCounts.get(taskId) || 0,
            pinned: false, // User preferences for pinned conversations
            section,
          });
        }
      });

      // Sort conversations: active first, then by last message timestamp
      const conversationsList = Array.from(conversationMap.values());
      return conversationsList.sort((a, b) => {
        // Prioritize active conversations over completed ones
        if (a.section === 'active' && b.section !== 'active') return -1;
        if (b.section === 'active' && a.section !== 'active') return 1;
        if (a.section === 'completed' && b.section === 'archived') return -1;
        if (b.section === 'completed' && a.section === 'archived') return 1;
        
        // Within same section, sort by last message timestamp
        return (b.lastMessage?.timestamp.getTime() || 0) - (a.lastMessage?.timestamp.getTime() || 0);
      });
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds to reduce API calls
    refetchOnWindowFocus: true,
  });

  // Fetch messages for a specific conversation
  const {
    data: messages = [],
    isLoading: loadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ['messages', options.conversationId],
    queryFn: async () => {
      if (!options.conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_profile_id_fkey(*),
          receiver:profiles!messages_receiver_profile_id_fkey(*)
        `)
        .eq('task_id', options.conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((msg: any) => ({
        ...msg,
        sender: msg.sender,
        receiver: msg.receiver,
      })) as ChatMessage[];
    },
    enabled: !!options.conversationId,
    staleTime: 60000, // Cache messages for 60 seconds
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Cleanup previous subscription if exists
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    setConnectionStatus('connecting');
    
    // Use unique channel name to avoid conflicts on retry
    const channelName = `messages_channel_${user.id}_${retryTriggerRef.current}`;
    
    // Add timeout to prevent infinite connecting state - use ref to check current status
    const connectionTimeout = setTimeout(() => {
      if (connectionStatusRef.current === 'connecting') {
        console.warn('Connection timeout - will auto-retry');
        setConnectionStatus('disconnected');
        
        // Auto-retry after timeout
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Auto-retrying after timeout...');
          retryTriggerRef.current += 1;
          setRetryTrigger(prev => prev + 1);
        }, 2000);
      }
    }, 5000); // 5 second timeout

    // Subscribe to messages table changes
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_profile_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Real-time message update:', payload);

          if (payload.eventType === 'INSERT') {
            // New message received
            const newMessage = payload.new as Message;
            
            // Fetch the full message with relations
            const { data: fullMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_profile_id_fkey(*),
                receiver:profiles!messages_receiver_profile_id_fkey(*)
              `)
              .eq('id', newMessage.id)
              .single();

            if (fullMessage) {
              // Update messages cache if this conversation is currently open
              if (options.conversationId === newMessage.task_id) {
                queryClient.setQueryData<ChatMessage[]>(
                  ['messages', options.conversationId],
                  (oldMessages = []) => [...oldMessages, fullMessage as ChatMessage]
                );
              }

              // Update conversations cache more selectively to prevent cascade invalidations
              queryClient.invalidateQueries({ 
                queryKey: ['conversations', user.id],
                refetchType: 'active' // Only refetch active queries, not all
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (e.g., marked as read)
            const updatedMessage = payload.new as Message;
            
            if (options.conversationId === updatedMessage.task_id) {
              queryClient.setQueryData<ChatMessage[]>(
                ['messages', options.conversationId],
                (oldMessages = []) =>
                  oldMessages.map((msg) =>
                    msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                  )
              );
            }

            // Update conversations for unread count changes - more selective invalidation
            queryClient.invalidateQueries({ 
              queryKey: ['conversations', user.id],
              refetchType: 'active'
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          clearTimeout(connectionTimeout); // Only clear timeout on successful connection
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          clearTimeout(connectionTimeout);
          setConnectionStatus('disconnected');
          
          // Auto-retry connection after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Auto-retrying connection...');
            retryTriggerRef.current += 1;
            setRetryTrigger(prev => prev + 1);
          }, 3000);
        }
        // For other statuses like 'JOINING', keep 'connecting' state
      });

    subscriptionRef.current = subscription;

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(connectionTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, options.conversationId, queryClient, supabase, retryTrigger]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      taskId,
      content,
      receiverId,
      imageUrl,
    }: {
      taskId: string;
      content: string;
      receiverId: string;
      imageUrl?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Insert message + send email happens server-side
      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          receiverId,
          content,
          imageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to send message');
      }

      return json.message;
    },
    onSuccess: (newMessage) => {
      // Update messages cache
      queryClient.setQueryData<ChatMessage[]>(
        ['messages', options.conversationId],
        (oldMessages = []) => [...oldMessages, newMessage as ChatMessage]
      );

      // Update conversations cache
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (oldConversations = []) => {
          return oldConversations.map((conv) => {
            if (conv.taskId === newMessage.task_id) {
              return {
                ...conv,
                lastMessage: {
                  content: newMessage.content,
                  timestamp: new Date(newMessage.created_at || new Date().toISOString()),
                  senderId: newMessage.sender_profile_id,
                  type: ((newMessage as any).message_type as 'text' | 'image') || 'text',
                },
              };
            }
            return conv;
          });
        }
      );
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('task_id', taskId)
        .eq('receiver_profile_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Refetch unread count
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  // Filter conversations based on search and filter type - memoized to prevent infinite re-renders
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    return conversations.filter((conv) => {
      const matchesSearch = 
        conv.task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        conv.participants.some((p) => 
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );

      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'unread' && conv.unreadCount > 0) ||
        (filterType === 'pinned' && conv.pinned) ||
        (filterType === 'active' && conv.section === 'active') ||
        (filterType === 'completed' && conv.section === 'completed');

      return matchesSearch && matchesFilter;
    });
  }, [conversations, debouncedSearchQuery, filterType]);

  // Group filtered conversations by section - memoized to prevent infinite re-renders
  const groupedConversations = useMemo(() => ({
    active: filteredConversations.filter(conv => conv.section === 'active'),
    completed: filteredConversations.filter(conv => conv.section === 'completed'),
    archived: filteredConversations.filter(conv => conv.section === 'archived'),
  }), [filteredConversations]);

  // Send message helper
  const sendMessage = useCallback(
    (content: string, receiverId: string, imageUrl?: string) => {
      if (!options.conversationId) return;
      sendMessageMutation.mutate({
        taskId: options.conversationId,
        content,
        receiverId,
        imageUrl,
      });
    },
    [options.conversationId, sendMessageMutation]
  );

  // Mark as read helper
  const markAsRead = useCallback(() => {
    if (!options.conversationId) return;
    markAsReadMutation.mutate(options.conversationId);
  }, [options.conversationId, markAsReadMutation]);

  // Retry connection helper - triggers useEffect re-run by updating state
  const retryConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Increment retry trigger to force useEffect re-run and create new channel
    retryTriggerRef.current += 1;
    setRetryTrigger(prev => prev + 1);
    
    // Also refetch conversations data
    queryClient.invalidateQueries({ 
      queryKey: ['conversations', user?.id],
      refetchType: 'active'
    });
  }, [queryClient, user?.id]);

  return {
    // Data
    conversations: filteredConversations,
    groupedConversations,
    messages,
    
    // Loading states
    loadingConversations,
    loadingMessages,
    
    // Errors
    conversationsError,
    messagesError,
    
    // Actions
    sendMessage,
    markAsRead,
    
    // Search and filter
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    
    // Real-time features
    connectionStatus,
    typingUsers,
    retryConnection,
    
    // Mutations
    sendingMessage: sendMessageMutation.isPending,
    markingAsRead: markAsReadMutation.isPending,
  };
}