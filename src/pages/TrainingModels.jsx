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

export default function TrainingModels(props) {
  const [trainingLoading, setTrainingLoading] = useState(true);
  const [trainingModels, setTrainingModels] = useState([]);
  const [totalTrainingModels, setTotalTrainingModels] = useState();
  const [trainingPage, setTrainingPage] = useState(1);
  const [trainingPageSize, setTrainingPageSize] = useState(10);
  const { contextHolder, showMessage } = useMessageApi();
  const {
    getModelsUserCanTrain, // parameters: getModelsUserCanTrain(searchText, offset, end);
    deleteModel,
    cloneModel,
    purchaseModel,
    addNewTrainer,
  } = useModels();

  const dispatch = useDispatch();

  useEffect(() => {
    setTrainingLoading(true);
    console.log(trainingPage, trainingPageSize);
    getModelsUserCanTrain(
      "",
      (trainingPage - 1) * trainingPageSize,
      trainingPageSize
    )
      .then((res) => {
        console.log(res);
        setTrainingModels(res[0]);
        setTotalTrainingModels(res[1]["count(*)"]);
        setTrainingLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setTrainingLoading(false);
      });
  }, []);

  useEffect(() => {
    setTrainingLoading(true);
    getModelsUserCanTrain(
      "",
      (trainingPage - 1) * trainingPageSize,
      trainingPageSize
    )
      .then((res) => {
        setTrainingModels(res[0]);
        setTotalTrainingModels(res[1]["count(*)"]);
        setTrainingLoading(false);
      })
      .catch((err) => {
        setTrainingLoading(false);
        console.log(err);
      });
  }, [trainingPage, trainingPageSize]);

  function onTrainingModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setTrainingPage(page);
    setTrainingPageSize(pageSize);
  }

  const modelStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = modelsDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={modelStyle} className="layout-bg mh-100vh">
        <h2>Training Models</h2>
        <Row gutter={[16, 16]} style={{ marginBottom: "3rem" }}>
          {!trainingLoading && trainingModels?.length > 0
            ? trainingModels.map((model) => {
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
            : !trainingLoading && (
                <div className="w-100p m-4">
                  <Empty
                    style={{ fontWeight: 500 }}
                    imageStyle={emptyImgStyle}
                    description={<span>No Models</span>}
                  />
                </div>
              )}
          <Skeleton
            active
            loading={trainingLoading}
            style={{ width: "500px" }}
          />
        </Row>
        {totalTrainingModels > 9 && (
          <div className="flex flex-center-center mt-6">
            <Pagination
              defaultCurrent={1}
              total={totalTrainingModels}
              showSizeChanger
              onChange={onTrainingModelsChange}
            />
          </div>
        )}
      </div>
    </>
  );
}
