import React, { useState, useEffect } from "react";
import { Row, Col, Skeleton, Empty, Pagination } from "antd";
import { ModelsCard } from "../components/ui/ModelsCard";
import useModels from "../hooks/useModels";
import { modelsDetails } from "../data/PageDetails";
import MetaDecorator from "../components/MetaDecorator";
import { useDispatch } from "react-redux";
import {
  setCurrentModelPage,
  setModelPaginationSize,
} from "../app/features/modelSlice";
import useMessageApi from "../hooks/useMessageApi";

export default function Models(props) {
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicModels, setPublicModels] = useState([]);
  const [totalPublicModels, setTotalPublicModels] = useState();
  const [publicPage, setPublicPage] = useState(1);
  const [publicPageSize, setPublicPageSize] = useState(10);
  const { contextHolder, showMessage } = useMessageApi();
  const {
    getPublicModels,
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
  } = useModels();

  const dispatch = useDispatch();

  useEffect(() => {
    setPublicLoading(true);
    getPublicModels((publicPage - 1) * publicPageSize, publicPageSize)
      .then((res) => {
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
        setPublicLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setPublicLoading(false);
      });
  }, []);

  useEffect(() => {
    setPublicLoading(true);
    getPublicModels((publicPage - 1) * publicPageSize, publicPageSize)
      .then((res) => {
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
        setPublicLoading(false);
      })
      .catch((err) => {
        setPublicLoading(false);
        console.log(err);
      });
  }, [publicPage, publicPageSize]);

  function onPublicModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setPublicPage(page);
    setPublicPageSize(pageSize);
  }

  const modelStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = modelsDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={modelStyle} className="layout-bg mh-100vh">
        <h2>Public Models</h2>
        <Row gutter={[16, 16]} style={{ marginBottom: "3rem" }}>
          {!publicLoading && publicModels?.length > 0
            ? publicModels.map((model) => {
                return (
                  <Col key={model.id} span={8} xs={24} md={8}>
                    <ModelsCard
                      model={model}
                      deleteModel={deleteModel}
                      cloneModel={cloneModel}
                      purchaseModel={purchaseModel}
                      addNewTrainer={addNewTrainer}
                      key={model.key}
                      showMessage={showMessage}
                    />
                  </Col>
                );
              })
            : !publicLoading && (
                <div className="w-100p m-4">
                  <Empty
                    style={{ fontWeight: 500 }}
                    imageStyle={emptyImgStyle}
                    description={<span>No Models</span>}
                  />
                </div>
              )}
          <Skeleton active loading={publicLoading} style={{ width: "500px" }} />
        </Row>
        {totalPublicModels > 9 && (
          <div className="flex flex-center-center mt-6">
            <Pagination
              defaultCurrent={1}
              total={totalPublicModels}
              showSizeChanger
              onChange={onPublicModelsChange}
            />
          </div>
        )}
      </div>
    </>
  );
}
