import React, { useState, useEffect } from "react";
import { Row, Col, Skeleton, Empty, Pagination } from "antd";
import NewModel from "../components/ui/NewModel";
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
  const [userLoading, setUserLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicModels, setPublicModels] = useState([]);
  const [userModels, setUserModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [publicPage, setPublicPage] = useState(1);
  const [publicPageSize, setPublicPageSize] = useState(10);
  const {
    publicCount,
    getPublicModels,
    userCount,
    getUserModels,
    createNewModel,
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
  } = useModels();
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  useEffect(() => {
    getUserModels((userPage - 1) * userPageSize, userPageSize)
      .then((res) => {
        console.log(res);
        setUserLoading(false);
        setUserModels(res);
      })
      .catch((err) => {
        console.log(err);
        setUserLoading(false);
      });
    getPublicModels((publicPage - 1) * publicPageSize, publicPageSize)
      .then((res) => {
        setPublicLoading(false);
        setPublicModels(res);
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
        setPublicModels(res);
        setPublicLoading(false);
      })
      .catch((err) => {
        setPublicLoading(false);
        console.log(err);
      });
  }, [publicPage, publicPageSize]);

  useEffect(() => {
    setUserLoading(true);
    getUserModels((userPage - 1) * userPageSize, userPageSize)
      .then((res) => {
        setUserLoading(false);
        setUserModels(res);
      })
      .catch((err) => {
        setUserLoading(false);
        console.log(err);
      });
  }, [userPage, userPageSize]);

  useEffect(() => {
    setUserLoading(true);
    setPublicLoading(true);
    getUserModels((userPage - 1) * userPageSize, userPageSize)
      .then((res) => {
        setUserModels(res);
        setUserLoading(false);
      })
      .catch((err) => {
        setUserLoading(false);
        console.log(err);
      });
    getPublicModels((publicPage - 1) * publicPageSize, publicPageSize)
      .then((res) => {
        setPublicModels(res);
        setPublicLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setPublicLoading(false);
      });
  }, [loading]);

  function onPublicModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setPublicPage(page);
    setPublicPageSize(pageSize);
  }

  function onUserModelsChange(page, pageSize) {
    setUserPage(page);
    setUserPageSize(pageSize);
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
        {publicCount > 9 && (
          <div className="flex flex-center-center mt-6">
            <Pagination
              defaultCurrent={1}
              total={publicCount}
              showSizeChanger
              onChange={onPublicModelsChange}
            />
          </div>
        )}

        <h2>Your Models</h2>
        <Row gutter={[16, 16]}>
          {!userLoading && userModels?.length > 0
            ? userModels.map((model) => {
                return (
                  <Col key={model.id} span={8} xs={24} md={8}>
                    <ModelsCard
                      model={model}
                      deleteModel={deleteModel}
                      cloneModel={cloneModel}
                      purchaseModel={purchaseModel}
                      addNewTrainer={addNewTrainer}
                      collapsedWidth={props.collapsedWidth}
                      key={model.key}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </Col>
                );
              })
            : !userLoading && (
                <div className="w-100p m-4">
                  <Empty
                    style={{ fontWeight: 500 }}
                    imageStyle={emptyImgStyle}
                    description={<span>No Models</span>}
                  />
                </div>
              )}
          <Skeleton active loading={userLoading} style={{ width: "500px" }} />
        </Row>
        {userCount > 9 && (
          <div className="flex flex-center-center mt-6">
            <Pagination
              showSizeChanger
              defaultCurrent={1}
              total={userCount}
              onChange={onUserModelsChange}
            />
          </div>
        )}
        <div className="flex flex-center-center mt-10">
          <NewModel
            sm={props.sm}
            createNewModel={createNewModel}
            setLoading={setLoading}
          />
        </div>
      </div>
    </>
  );
}
