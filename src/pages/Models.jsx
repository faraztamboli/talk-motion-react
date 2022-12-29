import React from "react";
import { Row, Col, Skeleton, Empty, Pagination } from "antd";
import NewModel from "../components/ui/NewModel";
import { ModelsCard } from "../components/ui/ModelsCard";
import useModels from "../hooks/useModels";
import { modelsDetails } from "../data/PageDetails";
import MetaDecorator from "../components/MetaDecorator";
import JS2Py from "../remotepyjs";

export default function Models(props) {
  const {
    publicCount,
    publicModels,
    getPublicModels,
    userCount,
    userModels,
    getUserModels,
    publicLoading,
    userLoading,
    createNewModel,
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
  } = useModels();

  const modelStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = modelsDetails;
  console.log(JS2Py);

  return (
    <>
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
              onChange={(page) => getPublicModels(page == 1 ? 1 : page * 9, 9)}
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
              defaultCurrent={1}
              total={userCount}
              onChange={(page) => getUserModels(page == 1 ? 1 : page * 9, 9)}
            />
          </div>
        )}
        <div className="flex flex-center-center mt-10">
          <NewModel sm={props.sm} createNewModel={createNewModel} />
        </div>
      </div>
    </>
  );
}
