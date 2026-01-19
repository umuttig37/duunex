'use client';

import { ConversationList } from '@/components/features/chat/ConversationList';
import { MessageComposer } from '@/components/features/chat/MessageComposer';
import { MessageList } from '@/components/features/chat/MessageList';
import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { useAuth } from '@/components/shared/providers/query-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useChat, type Conversation } from '@/hooks/chat/useChat';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Get conversation ID from URL params
  const taskId = searchParams.get('taskId');

  // Initialize chat hook with selected conversation
  const {
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    sendMessage,
    sendingMessage,
    markAsRead,
  } = useChat({ conversationId: selectedConversation?.id });

  // Auto-select conversation from URL
  useEffect(() => {
    if (taskId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.taskId === taskId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [taskId, conversations]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL to reflect selected conversation
    router.push(`/dashboard/messages?taskId=${conversation.taskId}`);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    router.push('/dashboard/messages');
  };

  const handleSendMessage = (content: string, imageUrl?: string) => {
    if (!selectedConversation || !user?.id) return;

    const receiverId = selectedConversation.participants[0]?.id;
    if (!receiverId) return;

    sendMessage(content, receiverId, imageUrl);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Kirjautuminen vaaditaan</h2>
          <p className="text-gray-600">Sinun tulee olla kirjautuneena nähdäksesi viestit.</p>
        </div>
      </div>
    );
  }

  // Mobile view: show list or conversation within dashboard
  if (isMobile) {
    if (selectedConversation) {
      const participant = selectedConversation.participants[0];
      const participantName = participant
        ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || participant.email || 'Tuntematon käyttäjä'
        : 'Tuntematon käyttäjä';
      return (
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {/* Mobile header */}
          <div className="bg-white border-b border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {participant && (
                <>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={participant.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(participantName || 'T').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-gray-900 truncate text-sm">
                      {participantName || 'Tuntematon käyttäjä'}
                    </h2>
                    <p className="text-xs text-gray-600 truncate">
                      {selectedConversation.task.title}
                    </p>
                  </div>
                </>
              )}

              <Sheet open={showProfilePanel} onOpenChange={setShowProfilePanel}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Info className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Tehtävän tiedot</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedConversation.task.title}</h3>
                      <Badge className="mt-1">
                        {selectedConversation.task.status}
                      </Badge>
                    </div>
                    {participant && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Osallistuja</h4>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={participant.avatar_url || undefined} />
                            <AvatarFallback>
                              {participantName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participantName}</p>
                            <p className="text-sm text-gray-600">{participant.role === 'tasker' ? 'Tekijä' : 'Käyttäjä'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            currentUserId={user.id}
            isLoading={loadingMessages}
          />

          {/* Composer */}
          <MessageComposer
            onSendMessage={handleSendMessage}
            isLoading={sendingMessage}
            disabled={selectedConversation.task.status === 'completed' || selectedConversation.task.status === 'cancelled' || selectedConversation.task.status === 'awaiting_payment'}
            taskId={selectedConversation.taskId}
          />
        </div>
      );
    }

    // Mobile: show conversation list within dashboard
    return (
      <div className="h-[calc(100vh-12rem)] bg-white rounded-lg border border-gray-200 overflow-hidden">
        <ConversationList
          selectedConversationId={undefined}
          onConversationSelect={handleConversationSelect}
        />
      </div>
    );
  }

  // Desktop view: 3-column layout within dashboard container
  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] bg-white md:bg-gray-50 rounded-none md:rounded-lg overflow-hidden border md:border-gray-200 shadow-none md:shadow-sm">
      {/* Left: Conversations list */}
      <div className="w-80 xl:w-96 flex-shrink-0 border-r border-gray-200">
        <ConversationList
          selectedConversationId={selectedConversation?.id || undefined}
          onConversationSelect={handleConversationSelect}
        />
      </div>

      {/* Center: Messages */}
      {selectedConversation ? (
        (() => {
          const participant = selectedConversation.participants[0];
          const participantName = participant
            ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || participant.email || 'Tuntematon käyttäjä'
            : 'Tuntematon käyttäjä';

          return (
            <div className="flex-1 flex flex-col bg-white">
              {/* Header */}
              <div className="border-b border-gray-200 p-4 sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {participant && (
                      <>
                        <Avatar>
                          <AvatarImage src={participant.avatar_url || undefined} />
                          <AvatarFallback>
                            {participantName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold text-gray-900">{participantName}</h2>
                          <p className="text-sm text-gray-600">{selectedConversation.task.title}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProfilePanel(true)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0">
                <MessageList
                  messages={messages}
                  currentUserId={user.id}
                  isLoading={loadingMessages}
                />
              </div>

              {/* Composer */}
              <div className="border-t border-gray-200">
                <MessageComposer
                  onSendMessage={handleSendMessage}
                  isLoading={sendingMessage}
                  disabled={selectedConversation.task.status === 'completed' || selectedConversation.task.status === 'cancelled' || selectedConversation.task.status === 'awaiting_payment'}
                  taskId={selectedConversation.taskId}
                />
              </div>
            </div>
          );
        })()
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
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
              Valitse keskustelu
            </h3>
            <p className="text-gray-500 max-w-sm">
              Valitse keskustelu vasemmalta nähdäksesi viestit ja aloittaaksesi viestittelyn.
            </p>
          </div>
        </div>
      )}

      {/* Right: Profile panel (desktop) */}
      {selectedConversation && showProfilePanel && (
        (() => {
          const participant = selectedConversation.participants[0];
          const participantName = participant
            ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || participant.email || 'Tuntematon käyttäjä'
            : 'Tuntematon käyttäjä';

          return (
            <div className="w-72 xl:w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Tehtävän tiedot</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProfilePanel(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{selectedConversation.task.title}</h4>
                  <Badge>{selectedConversation.task.status}</Badge>
                </div>
                {participant && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Osallistuja</h5>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={participant.avatar_url || undefined} />
                        <AvatarFallback>
                          {participantName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participantName}</p>
                        <p className="text-sm text-gray-600">{participant.role === 'tasker' ? 'Tekijä' : 'Käyttäjä'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function DashboardLayoutWrapper() {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (authUser?.id) {
      const supabase = createClient();
      supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserProfile(data);
          }
        });
    }
  }, [authUser]);

  if (!userProfile && authUser) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Ladataan käyttäjätietoja...</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={userProfile}>
      <div className="flex flex-col h-full w-full">
        <Suspense fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Ladataan...</span>
            </div>
          </div>
        }>
          <MessagesContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return <DashboardLayoutWrapper />;
}