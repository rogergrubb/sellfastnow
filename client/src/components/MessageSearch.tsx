// Message Search Component
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  senderUsername: string | null;
  senderEmail: string | null;
  listingTitle: string | null;
}

interface MessageSearchProps {
  onResultClick: (listingId: string, otherUserId: string) => void;
}

export function MessageSearch({ onResultClick }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchData, isLoading } = useQuery<{
    results: SearchResult[];
    query: string;
    pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  }>({
    queryKey: [`/api/messages/search?q=${searchQuery}&limit=20&offset=0`],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setIsSearching(value.length >= 2);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search messages..."
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchData && searchData.results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Found {searchData.pagination.total} result{searchData.pagination.total !== 1 ? 's' : ''}
              </p>
              {searchData.results.map((result) => (
                <Card
                  key={result.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    const otherUserId = result.senderId === result.receiverId 
                      ? result.senderId 
                      : result.senderId;
                    onResultClick(result.listingId, otherUserId);
                    handleClearSearch();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">
                          {result.listingTitle || 'Listing'}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(result.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: {result.senderUsername || result.senderEmail || 'User'}
                      </p>
                      <p className="text-sm line-clamp-2">
                        {highlightMatch(result.content, searchQuery)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

