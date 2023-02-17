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
    props.collapseWidth === 0
      ? { padding: 8, paddingTop: "55rem" }
      : { padding: 24, paddingTop: "55rem" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = profileDetails;

  return (
    <>
      {contextHolder}
      <MetaDecorator title={title} description={description} />
      <div style={profileStyle} className="layout-bg mh-100vh">
        <div className="details_section">
          <div className="flex flex-between-center mb-5">
            <h2>My Models</h2>
            <Search
              style={{ width: 300 }}
              placeholder="search"
              enterButton="Search"
              size="middle"
              loading={searchBtnLoading}
              onSearch={onUserModelsSearch}
            />
            <NewModel
              sm={props.sm}
              createNewModel={createNewModel}
              setLoading={setLoading}
            />
          </div>
          <Row gutter={[16, 16]}>
            {!userLoading && userModels?.length > 0
              ? userModels.map((model) => {
                  return (
                    <Col key={model.id} span={8} xs={24} md={8}>
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
