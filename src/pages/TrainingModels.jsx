import React, { useState, useEffect } from "react";
import { Row, Col, Skeleton, Empty, Pagination, Input } from "antd";
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
  const [searchBtnLoading, setSearchBtnLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
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

  const { Search } = Input;

  useEffect(() => {
    setTrainingLoading(true);
    console.log(trainingPage, trainingPageSize);
    getModelsUserCanTrain(
      searchValue,
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
      searchValue,
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

  function onUserModelsSearch(searchText) {
    setSearchValue(searchText);
    setSearchBtnLoading(true);
    setTrainingLoading(true);
    getModelsUserCanTrain(searchText, 0, 10)
      .then((res) => {
        setTrainingModels(res[0]);
        setTotalTrainingModels(res[1]["count(*)"]);
        setTrainingLoading(false);
        setSearchBtnLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setSearchBtnLoading(false);
        setTrainingLoading(false);
      });
  }

  const modelStyle = props.sm ? { padding: "15px" } : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = modelsDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={modelStyle} className="layout-bg mh-100vh">
        <div 
          className="flex flex-between-center"
          style={{
            flexWrap: "wrap",
            gap: "var(--spacing-md)",
            marginBottom: "var(--spacing-xl)"
          }}
        >
          <div>
            <h2 style={{
              margin: 0,
              marginBottom: "var(--spacing-xs)",
              fontSize: "var(--font-size-2xl)",
              fontWeight: "var(--font-weight-bold)"
            }}>
              Training Models
            </h2>
            <p style={{ 
              margin: 0, 
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-base)"
            }}>
              Models you can train and improve
            </p>
          </div>
          <Search
            style={{ width: "100%", maxWidth: 400 }}
            placeholder="Search training models..."
            enterButton="Search"
            size="large"
            loading={searchBtnLoading}
            onSearch={onUserModelsSearch}
            allowClear
            aria-label="Search training models"
          />
        </div>
        <Row gutter={[24, 24]} style={{ marginBottom: "3rem" }}>
          {!trainingLoading && trainingModels?.length > 0
            ? trainingModels.map((model) => {
                return (
                  <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
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
                <Col span={24}>
                  <Empty
                    style={{ fontWeight: 500, padding: "var(--spacing-xl)" }}
                    imageStyle={emptyImgStyle}
                    description={
                      <span style={{ fontSize: "var(--font-size-base)" }}>
                        No training models found. Try a different search term.
                      </span>
                    }
                  />
                </Col>
              )}
          {trainingLoading && (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Col key={i} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                  <Skeleton active style={{ height: 350 }} />
                </Col>
              ))}
            </>
          )}
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
