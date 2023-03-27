import React, { useEffect, useState } from "react";
import { Col, Row, Skeleton } from "antd";
import SaveFolderContent from "../components/ui/SaveFolderContent";
import NewFolder from "../components/ui/NewFolder";
import useFolders from "../hooks/useFolders";
import { Link, useParams } from "react-router-dom";

function FolderManager() {
  const [loading, setLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [childrens, setChildrens] = useState([]);
  const { getFolderAndContentsAndPermissions, saveFolder } = useFolders();

  const { folderId } = useParams();

  useEffect(() => {
    setLoading(true);
    getFolderAndContentsAndPermissions(null)
      .then((res) => {
        console.log(res);
        setTree(() => res.children);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (folderId) {
      setChildLoading(true);
      getFolderAndContentsAndPermissions(folderId)
        .then((res) => {
          console.log(res);
          setChildrens(() => res.children);
          setChildLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setChildLoading(false);
        });
    }
  }, [folderId]);

  return (
    <div className="overflow-hidden layout-bg mh-100vh p-5">
      <div className="flex flex-end-center">
        <SaveFolderContent folderId={folderId} />
        <NewFolder
          folderId={folderId}
          saveFolder={saveFolder}
          setLoading={setLoading}
        />
      </div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Courses</h3>
            </div>
            <ul className="sidebar-nav overflow-y-scroll max-height-65vh">
              {!loading ? (
                tree.length > 0 ? (
                  tree.map((folder) => (
                    <li
                      className={
                        folderId == folder.id
                          ? "sidebar-nav-item active"
                          : "sidebar-nav-item"
                      }
                      key={folder.id}
                    >
                      <Link to={`/video-subtitles/folder-manager/${folder.id}`}>
                        {folder.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  "Nothing to show"
                )
              ) : (
                <Skeleton active />
              )}
            </ul>
          </div>
        </Col>

        <Col span={16}>
          {!childLoading ? (
            tree.length > 0 ? (
              folderId === undefined ? (
                tree.map((child) => (
                  <div className="course-summary" key={child.id}>
                    <div className="course-summary-header">
                      <h2>{child.name}</h2>
                      <p>{child.description}</p>
                    </div>
                    <div className="course-summary-content">
                      <div className="course-summary-section">
                        <h3>Childs</h3>
                        <ul>
                          {child.children.length > 0
                            ? child.children.map((nestedChilds) => (
                                <li key={nestedChilds.id}>
                                  <Link
                                    to={`/video-subtitles/folder-manager/${nestedChilds.id}`}
                                    className="text-black text-16px pl-1 folder-content-card-list-items"
                                  >
                                    {nestedChilds.name}
                                  </Link>
                                </li>
                              ))
                            : "Nothing to show"}
                        </ul>
                      </div>
                      <div className="course-summary-section">
                        <h3>Content</h3>
                        <ul>
                          {child.contents.length > 0
                            ? child.contents.map((nestedContent) => (
                                <li key={nestedContent.content_id}>
                                  <Link
                                    className="text-black text-16px pl-1 folder-content-card-list-items"
                                    to={
                                      nestedContent.type === "model"
                                        ? `/models/${nestedContent.content_id}`
                                        : `/video-subtitles/library/${nestedContent.content_id}`
                                    }
                                  >
                                    {nestedContent.title} - {nestedContent.type}
                                  </Link>
                                </li>
                              ))
                            : "Nothing to show"}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              ) : childrens.length > 0 ? (
                childrens.map((child) => (
                  <div className="course-summary" key={child.id}>
                    <div className="course-summary-header">
                      <h2>{child.name}</h2>
                      <p>{child.description}</p>
                    </div>
                    <div className="course-summary-content">
                      <div className="course-summary-section">
                        <h3>Childs</h3>
                        <ul>
                          {child.children.length > 0
                            ? child.children.map((nestedChilds) => (
                                <li key={nestedChilds.id}>
                                  <Link
                                    to={`/video-subtitles/folder-manager/${nestedChilds.id}`}
                                    className="text-black text-16px pl-1 folder-content-card-list-items"
                                  >
                                    {nestedChilds.name}
                                  </Link>
                                </li>
                              ))
                            : "Nothing to show"}
                        </ul>
                      </div>
                      <div className="course-summary-section">
                        <h3>Content</h3>
                        <ul>
                          {child.contents.length > 0
                            ? child.contents.map((nestedContent) => (
                                <li key={nestedContent.content_id}>
                                  <Link
                                    className="text-black text-16px pl-1 folder-content-card-list-items"
                                    to={
                                      nestedContent.type === "model"
                                        ? `/models/${nestedContent.content_id}`
                                        : `/video-subtitles/library/${nestedContent.content_id}`
                                    }
                                  >
                                    {nestedContent.title} - {nestedContent.type}
                                  </Link>
                                </li>
                              ))
                            : "Nothing to show"}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                "Nothing to show"
              )
            ) : (
              <div className="course-summary">
                <div className="course-summary-header">
                  <h2>Nothing to show</h2>
                </div>
                <div className="course-summary-content">
                  <p>No content found</p>
                </div>
              </div>
            )
          ) : (
            <Skeleton active />
          )}
        </Col>
      </Row>
    </div>
  );
}

export default FolderManager;
