import React, { useState, useEffect } from "react";
import { Card, Col, Empty, Input, Row, Skeleton, Popconfirm, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import useSubtitleVideos from "../hooks/useSubtitleVideos";
import useMessageApi from "../hooks/useMessageApi";
import { Link } from "react-router-dom";

function VideoSubtitlesMyLibrary() {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [videoRecordings, setVideoRecordings] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const { getPublicVideoRecordings, getMyVideoRecordings, deleteVideoRecording } = useSubtitleVideos();
  const { contextHolder, showMessage } = useMessageApi();

  const { Search } = Input;
  const emptyImgStyle = { filter: "saturate(12)" };

  // eslint-disable-next-line
  const regex = /embed\/([^\?]+)/i; // Regex to get VideoID from YouTube embed link

  function handleSearch(value) {
    setSearchText(value);
  }

  function handleDelete(videoId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeletingId(videoId);
    deleteVideoRecording(videoId)
      .then((res) => {
        console.log(res);
        showMessage("success", "Video recording deleted successfully");
        // Remove the deleted video from the list
        setVideoRecordings((prev) => prev.filter((video) => video.id !== videoId));
        setDeletingId(null);
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "Unable to delete the video recording");
        setDeletingId(null);
      });
  }

  useEffect(() => {
    setLoading(true);
    getMyVideoRecordings(searchText)
      .then((res) => {
        // Handle different response formats
        // Response can be: array of recordings, or [array of recordings, metadata object]
        let recordings = [];
        if (Array.isArray(res)) {
          // If first element is an array, use it (format: [recordings[], metadata{}])
          // Otherwise, use res directly if it's an array of recordings
          recordings = Array.isArray(res[0]) ? res[0] : res;
        } else if (res && Array.isArray(res[0])) {
          recordings = res[0];
        }
        // Filter out any invalid entries
        recordings = recordings.filter(video => video && typeof video === 'object');
        setVideoRecordings(recordings);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setVideoRecordings([]); // Ensure it's always an array
        setLoading(false);
      });
  }, [searchText]);

  return (
    <>
      {contextHolder}
      <div className="layout-bg mh-100vh p-5">
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <h2 style={{ 
            margin: 0, 
            marginBottom: "var(--spacing-xs)",
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)"
          }}>
            My Subtitles Library
          </h2>
          <p style={{ 
            margin: 0, 
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-base)"
          }}>
            Manage your personal video recordings with subtitles
          </p>
        </div>
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <Search
            style={{ width: "100%", maxWidth: 600 }}
            placeholder="Search your videos..."
            enterButton="Search"
            size="large"
            loading={loading}
            onSearch={handleSearch}
            allowClear
            aria-label="Search my video library"
          />
        </div>
        {!loading && (
          <Row gutter={[24, 24]} className="mt-8">
            {videoRecordings && videoRecordings.length > 0 ? (
              videoRecordings
                .filter((video) => video && video.id) // Filter out invalid entries
                .map((video) => (
                <Col key={video.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                  <Card
                    className="cursor-pointer h-100p"
                    hoverable
                    style={{ 
                      position: "relative",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      transition: "all 0.3s ease"
                    }}
                    bodyStyle={{ padding: 0 }}
                    cover={
                      <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}>
                        <Link
                          to={`/video-subtitles/library/${video.id}`}
                          style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
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
                              video.original_video_url?.match(regex)?.[1] || 'default'
                            }/maxresdefault.jpg`}
                            alt={video.original_video_title || 'Video thumbnail'}
                          />
                        </Link>
                      </div>
                    }
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Delete this video?"
                        description="This action cannot be undone."
                        onConfirm={(e) => handleDelete(video.id, e)}
                        onCancel={(e) => {
                          if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletingId === video.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          aria-label="Delete video recording"
                        >
                          Delete
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ padding: "var(--spacing-md)" }}>
                      <Link
                        to={`/video-subtitles/library/${video.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <h3 style={{ 
                          margin: 0,
                          fontSize: "var(--font-size-base)",
                          fontWeight: "var(--font-weight-medium)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {video.original_video_title}
                        </h3>
                      </Link>
                    </div>
                  </Card>
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty 
                  style={{ padding: "var(--spacing-xl)" }}
                  imageStyle={emptyImgStyle}
                  description={
                    <span style={{ fontSize: "var(--font-size-base)" }}>
                      No videos found. Create your first video with subtitles!
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
    </>
  );
}

export default VideoSubtitlesMyLibrary;
