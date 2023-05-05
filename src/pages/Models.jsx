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

export default function Models(props) {
  const [publicLoading, setPublicLoading] = useState(true);
  const [searchBtnLoading, setSearchBtnLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
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
    addOrRemoveCartProduct,
    getProductForFree,
  } = useModels();

  const dispatch = useDispatch();

  const { Search } = Input;

  useEffect(() => {
    setPublicLoading(true);
    getPublicModels("", (publicPage - 1) * publicPageSize, publicPageSize)
      .then((res) => {
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
      })
      .catch((err) => {
        console.log(err);
      });
    setPublicLoading(false);
  }, []);

  useEffect(() => {
    setPublicLoading(true);
    getPublicModels(
      searchValue,
      (publicPage - 1) * publicPageSize,
      publicPageSize
    )
      .then((res) => {
        console.log(res[1]["count(*)"]);
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
      })
      .catch((err) => {
        console.log(err);
      });
    setPublicLoading(false);
  }, [publicPage, publicPageSize]);

  function onPublicModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setPublicPage(page);
    setPublicPageSize(pageSize);
  }

  function onPublicModelsSearch(searchText) {
    setSearchValue(searchText);
    setSearchBtnLoading(true);
    setPublicLoading(true);
    getPublicModels(searchText, 0, 10)
      .then((res) => {
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
        setPublicLoading(false);
        setSearchBtnLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setSearchBtnLoading(false);
        setPublicLoading(false);
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
        <div className="flex flex-between-center mb-4">
          <h2>Models Available for Purchase</h2>
          <Search
            style={{ width: 300 }}
            placeholder="search"
            enterButton="Search"
            size="middle"
            loading={searchBtnLoading}
            onSearch={onPublicModelsSearch}
          />
        </div>
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
                      addOrRemoveCartProduct={addOrRemoveCartProduct}
                      getProductForFree={getProductForFree}
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
