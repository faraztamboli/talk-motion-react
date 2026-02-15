import React, { useState, useEffect } from "react";
import { Card, Col, Empty, Input, Row, Skeleton } from "antd";
import useSubtitleVideos from "../hooks/useSubtitleVideos";
import { Link } from "react-router-dom";
import UserInfoImage from "../components/ui/UserInfoImg";

function VideoSubtitlesLibrary() {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [videoRecordings, setVideoRecordings] = useState([]);
  const { getVideoRecordings } = useSubtitleVideos();

  const { Search } = Input;
  const emptyImgStyle = { filter: "saturate(12)" };

  // eslint-disable-next-line
  const regex = /embed\/([^\?]+)/i; // Regex to get VideoID from YouTube embed link

  function handleSearch(value) {
    setSearchText(value);
  }

  useEffect(() => {
    setLoading(true);
    getVideoRecordings(searchText, 0, 9999)
      .then((res) => {
        setVideoRecordings(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [searchText]);

  return (
    <div className="layout-bg mh-100vh p-5">
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h2 style={{ 
          margin: 0, 
          marginBottom: "var(--spacing-xs)",
          fontSize: "var(--font-size-2xl)",
          fontWeight: "var(--font-weight-bold)"
        }}>
          Subtitles Library
        </h2>
        <p style={{ 
          margin: 0, 
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-base)"
        }}>
          Browse public videos with sign language subtitles
        </p>
      </div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <Search
          style={{ width: "100%", maxWidth: 600 }}
          placeholder="Search videos by title..."
          enterButton="Search"
          size="large"
          loading={loading}
          onSearch={handleSearch}
          allowClear
          aria-label="Search video library"
        />
      </div>
      {!loading && (
        <Row gutter={[24, 24]} className="mt-8">
          {videoRecordings.length > 0 ? (
            videoRecordings.map((video) => (
              <Col key={video.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                <Link to={`/video-subtitles/library/${video.id}`} style={{ textDecoration: "none" }}>
                  <Card 
                    className="cursor-pointer h-100p" 
                    hoverable
                    style={{
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    cover={
                      <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}>
                        <img
                          width="100%"
                          height="100%"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            objectFit: "cover"
                          }}
                          src={`https://img.youtube.com/vi/${
                            video.original_video_url.match(regex)[1]
                          }/maxresdefault.jpg`}
                          alt={video.original_video_title}
                        />
                      </div>
                    }
                  >
                    <div style={{ padding: "var(--spacing-md)" }}>
                      <div className="flex align-items-center" style={{ marginBottom: "var(--spacing-xs)" }}>
                        <UserInfoImage
                          username={video.create_user}
                          image={video.sm_img}
                        />
                      </div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: "var(--font-size-base)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical"
                      }}>
                        {video.original_video_title}
                      </h3>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty 
                style={{ padding: "var(--spacing-xl)" }}
                imageStyle={emptyImgStyle}
                description={
                  <span style={{ fontSize: "var(--font-size-base)" }}>
                    No videos found. Try a different search term.
                  </span>
                }
              />
            </Col>
          )}
        </Row>
      )}
      {loading && (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
              <Skeleton active style={{ height: 300 }} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default VideoSubtitlesLibrary;
