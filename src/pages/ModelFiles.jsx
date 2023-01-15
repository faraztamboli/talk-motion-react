import React, { useEffect, useState } from "react";
import { Table } from "antd";
import useModels from "../hooks/useModels";
import { useParams } from "react-router-dom";

function ModelFiles(props) {
  const [modelFiles, setModelFiles] = useState();
  const [loading, setLoading] = useState(true);
  const { getModelFiles } = useModels();
  const { modelid } = useParams();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    getModelFiles(modelid)
      .then((res) => {
        console.log(res);
        setModelFiles(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      title: "Concept",
      dataIndex: "concept",
      key: "concept",
    },
    {
      title: "File Name",
      dataIndex: "filename",
      key: "filename",
    },
  ];

  const data =
    modelFiles &&
    modelFiles.length > 0 &&
    modelFiles.map((model) => {
      return {
        concept: model.concept,
        filename: model.filename,
      };
    });

  return (
    <div className="layout-bg mh-100vh" style={style}>
      <h2>Model Files</h2>
      <div className="mb-6 mt-6">
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </div>
    </div>
  );
}

export default ModelFiles;
