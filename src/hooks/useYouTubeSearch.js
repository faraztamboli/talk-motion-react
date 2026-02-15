import { useState, useCallback } from 'react';

/**
 * Custom hook for YouTube video search using YouTube Data API v3
 * 
 * @param {string} apiKey - YouTube Data API v3 key
 * @returns {object} - Search functionality and results
 */
function useYouTubeSearch(apiKey) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  /**
   * Search YouTube videos
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {string} pageToken - Token for pagination
   */
  const searchVideos = useCallback(async (query, maxResults = 10, pageToken = null) => {
    if (!apiKey) {
      setSearchError('YouTube API key is not configured');
      return;
    }

    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query.trim(),
        type: 'video',
        maxResults: maxResults.toString(),
        key: apiKey,
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to search YouTube videos');
      }

      const data = await response.json();

      const videos = data.items.map((item) => {
        // Get the best available thumbnail (prefer medium, fallback to default)
        const thumbnails = item.snippet.thumbnails;
        const thumbnail = 
          thumbnails.medium?.url || 
          thumbnails.high?.url || 
          thumbnails.standard?.url || 
          thumbnails.default?.url ||
          `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`; // Fallback to YouTube's thumbnail service
        
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          thumbnail: thumbnail,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
        };
      });

      if (pageToken) {
        // Append to existing results for pagination
        setSearchResults((prev) => [...prev, ...videos]);
      } else {
        // New search, replace results
        setSearchResults(videos);
        setLastQuery(query.trim());
      }

      setNextPageToken(data.nextPageToken || null);
    } catch (error) {
      console.error('YouTube search error:', error);
      setSearchError(error.message || 'An error occurred while searching');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [apiKey]);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(() => {
    if (nextPageToken && !isSearching && lastQuery) {
      searchVideos(lastQuery, 10, nextPageToken);
    }
  }, [nextPageToken, isSearching, lastQuery, searchVideos]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setNextPageToken(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    nextPageToken,
    searchVideos,
    loadMore,
    clearSearch,
  };
}

export default useYouTubeSearch;

