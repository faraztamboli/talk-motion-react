import React, { useEffect, useState } from "react";
import { Card, Col, Empty, Row, Skeleton } from "antd";
import { FolderFilled } from "@ant-design/icons";
import NewFolder from "../components/ui/NewFolder";
import useFolders from "../hooks/useFolders";
import { Link, useParams } from "react-router-dom";

function FolderManager() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const { getChildFolders, saveFolder } = useFolders();

  const { folderId } = useParams();

  const emptyImgStyle = { filter: "saturate(12)" };

  useEffect(() => {
    getChildFolders(null)
      .then((res) => {
        console.log(res);
        setFolders(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="layout-bg mh-100vh p-5">
      <div className="flex flex-between-center">
        <h2>Folder Manager</h2>
        <NewFolder
          saveFolder={saveFolder}
          setLoading={setLoading}
          parentFolderId={folderId ? folderId : null}
        />
      </div>

      {!loading ? (
        <Row className="mt-8">
          {folders.length > 0 ? (
            folders.map((folder) => (
              <Col key={folder.id}>
                <Link to={`/video-subtitles/folder-manager/${folder.id}`}>
                  <Card>
                    <div className="flex-center-center">
                      <FolderFilled style={{ fontSize: "50px" }} />
                    </div>
                    <h3 className="mb-0">{folder.name}</h3>
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
      ) : (
        <Skeleton active />
      )}
    </div>
  );
}

export default FolderManager;
