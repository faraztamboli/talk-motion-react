import React, { useState, useEffect } from "react";
import { Card, Col, Empty, Input, Row, Skeleton } from "antd";
import useSubtitleVideos from "../hooks/useSubtitleVideos";
import { Link } from "react-router-dom";

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
    getVideoRecordings(searchText)
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
      <h2>Subtitles Library</h2>
      <div className="flex flex-center-center">
        <Search
          style={{ width: 300 }}
          placeholder="search"
          enterButton="Search"
          size="middle"
          loading={loading}
          onSearch={handleSearch}
        />
      </div>
      {!loading && (
        <Row gutter={[16, 16]} className="mt-8">
          {videoRecordings.length > 0 ? (
            videoRecordings.map((video) => (
              <Col key={video.id} span={8}>
                <Link to={`/video-subtitles/library/${video.id}`}>
                  <Card className="cursor-pointer h-100p" hoverable>
                    <img
                      width="100%"
                      height="100%"
                      src={`https://img.youtube.com/vi/${
                        video.original_video_url.match(regex)[1]
                      }/maxresdefault.jpg`}
                      alt={video.original_video_title}
                    />
                    <h3>{video.original_video_title}</h3>
                  </Card>
                </Link>
              </Col>
            ))
          ) : (
            <div className="w-100p m-4">
              <Empty style={emptyImgStyle} />
            </div>
          )}
        </Row>
      )}
      {loading && <Skeleton active />}
    </div>
  );
}

export default VideoSubtitlesLibrary;
