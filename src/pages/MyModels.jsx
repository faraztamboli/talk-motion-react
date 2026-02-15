import React, { useState, useEffect } from "react";
import { Row, Col, Skeleton, Empty, Pagination, Input } from "antd";
import useModels from "../hooks/useModels";
import NewModel from "../components/ui/NewModel";
import { ModelsCard } from "../components/ui/ModelsCard";
import MetaDecorator from "../components/MetaDecorator";
import { profileDetails } from "../data/PageDetails";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentModelPage,
  setModelPaginationSize,
} from "../app/features/modelSlice";
import useMessageApi from "../hooks/useMessageApi";

export default function MyModels(props) {
  const [loading, setLoading] = useState(false);
  const [searchBtnLoading, setSearchBtnLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [userModels, setUserModels] = useState([]);
  const [totalUserModels, setTotalUserModels] = useState();
  const [userLoading, setUserLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const {
    getUserModels,
    addNewTrainer,
    createNewModel,
    deleteModel,
    purchaseModel,
    cloneModel,
  } = useModels();
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  const { Search } = Input;

  const { modelPaginationSize } = useSelector((state) => state.model);
  const { currentModelPage } = useSelector((state) => state.model);

  useEffect(() => {
    getUserModels(searchValue, (userPage - 1) * userPageSize, userPageSize)
      .then((res) => {
        setUserLoading(false);
        setUserModels(res[0]);
        setTotalUserModels(res[1]["count(*)"]);
      })
      .catch((err) => {
        setUserLoading(false);
        console.log(err);
      });
  }, []);

  useEffect(() => {
    setUserLoading(true);
    getUserModels(searchValue, (userPage - 1) * userPageSize, userPageSize)
      .then((res) => {
        setUserModels(res[0]);
        setTotalUserModels(res[1]["count(*)"]);
        setUserLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setUserLoading(false);
      });
  }, [userPage, userPageSize]);

  useEffect(() => {
    setUserLoading(true);
    getUserModels(
      searchValue,
      (currentModelPage - 1) * modelPaginationSize,
      modelPaginationSize
    )
      .then((res) => {
        setUserModels(res[0]);
        setTotalUserModels(res[1]["count(*)"]);
        setUserLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setUserLoading(false);
      });
  }, [loading]);

  function onUserModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setUserPage(page);
    setUserPageSize(pageSize);
  }

  function onUserModelsSearch(searchText) {
    setSearchValue(searchText);
    setSearchBtnLoading(true);
    setUserLoading(true);
    getUserModels(searchText, 0, 10)
      .then((res) => {
        setUserModels(res[0]);
        setTotalUserModels(res[1]["count(*)"]);
        setUserLoading(false);
        setSearchBtnLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setSearchBtnLoading(false);
        setUserLoading(false);
      });
  }

  const profileStyle =
    props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = profileDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={profileStyle} className="layout-bg mh-100vh">
        <div className="details_section">
          <div 
            className="flex flex-between-center mb-5"
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
                My Models
              </h2>
              <p style={{ 
                margin: 0, 
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-base)"
              }}>
                Manage your gesture recognition models
              </p>
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
              <Search
                style={{ width: "100%", maxWidth: 300 }}
                placeholder="Search my models..."
                enterButton="Search"
                size="large"
                loading={searchBtnLoading}
                onSearch={onUserModelsSearch}
                allowClear
                aria-label="Search my models"
              />
              <NewModel
                sm={props.sm}
                createNewModel={createNewModel}
                setLoading={setLoading}
              />
            </div>
          </div>
          <Row gutter={[24, 24]}>
            {!userLoading && userModels?.length > 0
              ? userModels.map((model) => {
                  return (
                    <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                      <ModelsCard
                        model={model}
                        collapsedWidth={props.collapsedWidth}
                        key={model.key}
                        addNewTrainer={addNewTrainer}
                        loading={loading}
                        setLoading={setLoading}
                        deleteModel={deleteModel}
                        showMessage={showMessage}
                        purchaseModel={purchaseModel}
                        cloneModel={cloneModel}
                      />
                    </Col>
                  );
                })
              : !userLoading && (
                  <Col span={24}>
                    <Empty
                      style={{ fontWeight: 500, padding: "var(--spacing-xl)" }}
                      imageStyle={emptyImgStyle}
                      description={
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "var(--font-size-base)", display: "block", marginBottom: "var(--spacing-md)" }}>
                            No models found. Create your first model to get started!
                          </span>
                          <NewModel
                            sm={props.sm}
                            createNewModel={createNewModel}
                            setLoading={setLoading}
                          />
                        </div>
                      }
                    />
                  </Col>
                )}
            {userLoading && (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Col key={i} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                    <Skeleton active style={{ height: 350 }} />
                  </Col>
                ))}
              </>
            )}
          </Row>
          {totalUserModels > 9 && (
            <div className="flex flex-center-center mt-6">
              <Pagination
                showSizeChanger
                defaultCurrent={1}
                total={totalUserModels}
                onChange={onUserModelsChange}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
