import React, { useEffect, useState } from "react";
import { Descriptions, Empty, Skeleton } from "antd";
import useModels from "../hooks/useModels";
import { useParams } from "react-router-dom";

function ModelFiles(props) {
  const [modelFiles, setModelFiles] = useState();
  const [loading, setLoading] = useState(true);
  const { getModelFiles } = useModels();
  const { modelid } = useParams();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  useEffect(() => {
    getModelFiles(modelid)
      .then((res) => {
        setModelFiles(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="layout-bg mh-100vh" style={style}>
      <h2>Model Files</h2>
      {!loading &&
        modelFiles?.length > 0 &&
        modelFiles.map((modelFile) => {
          return (
            <div key={modelFile.key} className="mb-6 mt-6">
              <h3>{modelFile?.concept}</h3>
              <Descriptions
                layout="horizontal"
                column={1}
                bordered
                labelStyle={{ backgroundColor: "whitesmoke" }}
              >
                <Descriptions.Item label="Concept">
                  {modelFile?.concept}
                </Descriptions.Item>
                <Descriptions.Item label="Model Id">
                  {modelFile?.model_id}
                </Descriptions.Item>
                <Descriptions.Item label="File Name">
                  {modelFile?.filename}
                </Descriptions.Item>
                <Descriptions.Item label="File Parts">
                  {modelFile?.file_parts}
                </Descriptions.Item>
                <Descriptions.Item label="Group">
                  {modelFile.group ? modelFile.group : "null"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          );
        })}

      {loading && <Skeleton active />}

      {!modelFiles?.length > 0 && !loading && (
        <div className="w-100p mh-100vh">
          <Empty
            style={{ fontWeight: 500 }}
            imageStyle={emptyImgStyle}
            description={<span>No Data</span>}
          />
        </div>
      )}
    </div>
  );
}

export default ModelFiles;
