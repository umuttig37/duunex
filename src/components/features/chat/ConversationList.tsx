'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, type Conversation } from '@/hooks/chat/useChat';
import { CheckCircle2, MessageSquare, Pin, Search } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { ConversationSection } from './ConversationSection';

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  className?: string;
}

function ConversationListComponent({
  selectedConversationId,
  onConversationSelect,
  className = '',
}: ConversationListProps) {
  const {
    groupedConversations,
    loadingConversations,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    connectionStatus,
    retryConnection,
  } = useChat();

  // Memoize calculations to prevent infinite re-renders
  const conversationCounts = useMemo(() => {
    const allConversations = [
      ...groupedConversations.active,
      ...groupedConversations.completed,
      ...groupedConversations.archived
    ];
    return {
      unreadCount: allConversations.reduce((total, conv) => total + conv.unreadCount, 0),
      pinnedCount: allConversations.filter(conv => conv.pinned).length,
      totalCount: allConversations.length,
    };
  }, [groupedConversations]);

  // Memoize event handlers to prevent re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleFilterChange = useCallback((type: 'all' | 'unread' | 'pinned' | 'active' | 'completed') => {
    setFilterType(type);
  }, [setFilterType]);

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-300 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Viestit</h2>
          <ConnectionStatus status={connectionStatus} onRetry={retryConnection} />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hae keskusteluja..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 bg-white border-gray-300 focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('all')}
            className={`
              flex-shrink-0 text-xs
              ${filterType === 'all'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Kaikki
            <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 text-xs">
              {conversationCounts.totalCount}
            </Badge>
          </Button>

          <Button
            variant={filterType === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('active')}
            className={`
              flex-shrink-0 text-xs
              ${filterType === 'active'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Aktiiviset</span>
            <span className="sm:hidden">Active</span>
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
              {groupedConversations.active.length}
            </Badge>
          </Button>

          <Button
            variant={filterType === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('unread')}
            className={`
              flex-shrink-0 text-xs
              ${filterType === 'unread'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <span className="hidden sm:inline">Lukemattomat</span>
            <span className="sm:hidden">Unread</span>
            {conversationCounts.unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-emerald-600 text-white text-xs font-bold border border-emerald-700">
                {conversationCounts.unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={filterType === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('completed')}
            className={`
              flex-shrink-0 text-xs
              ${filterType === 'completed'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Valmiit</span>
            <span className="sm:hidden">Done</span>
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs">
              {groupedConversations.completed.length}
            </Badge>
          </Button>

          {conversationCounts.pinnedCount > 0 && (
            <Button
              variant={filterType === 'pinned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('pinned')}
              className={`
                flex-shrink-0 text-xs
                ${filterType === 'pinned'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Pin className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Kiinnitetyt</span>
              <span className="sm:hidden">Pin</span>
              <Badge variant="secondary" className="ml-1 bg-gray-500 text-white text-xs font-bold border border-gray-600">
                {conversationCounts.pinnedCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        {loadingConversations ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversationCounts.totalCount === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">
              {searchQuery ? 'Ei hakutuloksia' : 'Ei keskusteluja'}
            </h3>
            <p className="text-sm">
              {searchQuery
                ? 'Kokeile eri hakusanoja tai tarkista kirjoitusasu'
                : 'Keskustelut näkyvät täällä kun sinulla on aktiivisia tehtäviä'
              }
            </p>
          </div>
        ) : (
          <div>
            {/* Show conversations based on filter type */}
            {(filterType === 'all' || filterType === 'active') && groupedConversations.active.length > 0 && (
              <ConversationSection
                title="Aktiiviset keskustelut"
                conversations={groupedConversations.active}
                selectedConversationId={selectedConversationId}
                onConversationSelect={onConversationSelect}
                defaultExpanded={true}
              />
            )}

            {(filterType === 'all' || filterType === 'completed') && groupedConversations.completed.length > 0 && (
              <ConversationSection
                title="Valmiit tehtävät"
                conversations={groupedConversations.completed}
                selectedConversationId={selectedConversationId}
                onConversationSelect={onConversationSelect}
                defaultExpanded={false}
              />
            )}

            {(filterType === 'all' || filterType === 'pinned') && conversationCounts.pinnedCount > 0 && (
              <ConversationSection
                title="Kiinnitetyt"
                conversations={[
                  ...groupedConversations.active,
                  ...groupedConversations.completed,
                  ...groupedConversations.archived
                ].filter(conv => conv.pinned)}
                selectedConversationId={selectedConversationId}
                onConversationSelect={onConversationSelect}
                defaultExpanded={true}
              />
            )}

            {(filterType === 'unread') && (
              <ConversationSection
                title="Lukemattomat viestit"
                conversations={[
                  ...groupedConversations.active,
                  ...groupedConversations.completed,
                  ...groupedConversations.archived
                ].filter(conv => conv.unreadCount > 0)}
                selectedConversationId={selectedConversationId}
                onConversationSelect={onConversationSelect}
                defaultExpanded={true}
              />
            )}

            {groupedConversations.archived.length > 0 && filterType === 'all' && (
              <ConversationSection
                title="Arkisto"
                conversations={groupedConversations.archived}
                selectedConversationId={selectedConversationId}
                onConversationSelect={onConversationSelect}
                defaultExpanded={false}
              />
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ConversationList = memo(ConversationListComponent, (prevProps, nextProps) => {
  return (
    prevProps.selectedConversationId === nextProps.selectedConversationId &&
    prevProps.className === nextProps.className &&
    prevProps.onConversationSelect === nextProps.onConversationSelect
  );
});