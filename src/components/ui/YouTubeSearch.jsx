import React, { useState, useRef, useEffect } from 'react';
import { Input, List, Card, Spin, Empty, Button } from 'antd';
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import useYouTubeSearch from '../../hooks/useYouTubeSearch';

const { Search } = Input;

/**
 * Video Result Item Component
 */
function VideoResultItem({ video, onSelect }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <List.Item
      style={{
        cursor: 'pointer',
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        transition: 'all 0.2s',
        borderRadius: '4px',
        marginBottom: '4px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(video);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Select video: ${video.title}`}
    >
      <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '168px',
            height: '94px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
          }}
        >
          {!imageError && video.thumbnail ? (
            <>
              {imageLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <Spin size="small" />
                </div>
              )}
              <img
                src={video.thumbnail}
                alt={video.title}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoading ? 'none' : 'block',
                }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#e8e8e8',
                color: '#999',
                fontSize: '24px',
              }}
            >
              <PlayCircleOutlined />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4',
              color: '#030303',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '4px',
            }}
            title={video.title}
          >
            {video.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#606060',
              marginBottom: '2px',
            }}
          >
            {video.channelTitle}
          </div>
          {video.description && (
            <div
              style={{
                fontSize: '12px',
                color: '#606060',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
              }}
            >
              {video.description}
            </div>
          )}
        </div>

        {/* Play Icon */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
          <PlayCircleOutlined
            style={{
              fontSize: '24px',
              color: '#1890ff',
            }}
          />
        </div>
      </div>
    </List.Item>
  );
}

/**
 * YouTube Search Component
 * Allows users to search for YouTube videos and select them
 * 
 * @param {string} apiKey - YouTube Data API v3 key (from environment or props)
 * @param {function} onVideoSelect - Callback when a video is selected
 * @param {boolean} showSearch - Whether to show search interface
 */
function YouTubeSearch({ apiKey, onVideoSelect, showSearch = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const containerRef = useRef(null);

  const {
    searchResults,
    isSearching,
    searchError,
    nextPageToken,
    searchVideos,
    clearSearch,
  } = useYouTubeSearch(apiKey);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSearch = (value) => {
    if (value && value.trim()) {
      setSearchQuery(value);
      setIsOpen(true);
      searchVideos(value, 10);
    } else {
      clearSearch();
      setIsOpen(false);
    }
  };

  const handleVideoSelect = (video) => {
    if (onVideoSelect) {
      onVideoSelect(video.url, video.title, video.description);
    }
    setIsOpen(false);
    setSearchQuery('');
    clearSearch();
  };

  const handleLoadMore = () => {
    if (nextPageToken && !isSearching) {
      searchVideos(searchQuery, 10, nextPageToken);
    }
  };

  if (!showSearch) {
    return null;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <Search
        ref={searchRef}
        placeholder="Search YouTube videos..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (!e.target.value) {
            setIsOpen(false);
            clearSearch();
          }
        }}
        onSearch={handleSearch}
        loading={isSearching}
        style={{ width: '100%' }}
        aria-label="Search YouTube videos"
        aria-describedby="youtube-search-help"
      />
      <div
        id="youtube-search-help"
        className="sr-only"
        style={{ position: 'absolute', left: '-9999px' }}
      >
        Search for YouTube videos by title, keywords, or channel name
      </div>

      {isOpen && (
        <Card
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: '8px',
            maxHeight: '600px',
            overflow: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderRadius: '8px',
          }}
          bodyStyle={{ padding: '8px 0' }}
        >
          {isSearching && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '12px' }}>Searching YouTube...</p>
            </div>
          )}

          {searchError && (
            <Empty
              description={
                <div>
                  <p style={{ color: '#ff4d4f' }}>{searchError}</p>
                  {searchError.includes('API key') && (
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Please configure your YouTube Data API key
                    </p>
                  )}
                </div>
              }
            />
          )}

          {!isSearching && !searchError && searchResults.length === 0 && searchQuery && (
            <Empty description="No videos found. Try a different search term." />
          )}

          {searchResults.length > 0 && (
            <List
              dataSource={searchResults}
              renderItem={(video) => (
                <VideoResultItem video={video} onSelect={handleVideoSelect} />
              )}
              style={{ padding: 0 }}
            />
          )}

          {nextPageToken && searchResults.length > 0 && (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <Button
                onClick={handleLoadMore}
                loading={isSearching}
                type="link"
                aria-label="Load more search results"
              >
                Load More Results
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default YouTubeSearch;

