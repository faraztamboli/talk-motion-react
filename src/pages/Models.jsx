import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Skeleton,
  Empty,
  Pagination,
  Input,
  Alert,
  Space,
  Button,
} from "antd";
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
import { useParams } from "react-router-dom";
import usePayment from "../hooks/usePayment";

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
  const { confirmPurchase } = usePayment();

  const [urlParams, setUrlParams] = useState({
    payment_intent: null,
    payment_intent_client_secret: null,
    redirect_status: null,
  });

  const dispatch = useDispatch();

  const { Search } = Input;

  useEffect(() => {
    setPublicLoading(true);
    getPublicModels(
      "",
      (publicPage - 1) * publicPageSize,
      publicPageSize
    )
      .then((res) => {
        // removing purchased models and setting the state
        // res[0].filter((model) => model.badge != "purchased")
        setPublicModels(res[0]);
        setTotalPublicModels(res[1]["count(*)"]);
      })
      .catch((err) => {
        console.log(err);
      });
    setPublicLoading(false);
  }, []);

  // update query parameter
  useEffect(() => {
    const request = window.location.search;
    const queryParams = new URLSearchParams(request);
    let params = {};
    params.payment_intent = queryParams.get("payment_intent");
    params.payment_intent_client_secret = queryParams.get(
      "payment_intent_client_secret"
    );
    params.redirect_status = queryParams.get("redirect_status");
    setUrlParams(params);
  }, []);

  useEffect(() => {
    if (urlParams.redirect_status == null) return;
    confirmPurchase(
      urlParams.payment_intent,
      urlParams.payment_intent_client_secret,
      urlParams.redirect_status
    ).then((res) => {
      showMessage("info", `{res.operation_status} - res.error`);
    });
  }, [urlParams]);

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

  const modelStyle = props.sm
    ? { padding: "15px" }
    : { padding: "24px" };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = modelsDetails;

  return (
    <>
      {contextHolder}

      <MetaDecorator title={title} description={description} />
      <div style={modelStyle} className="layout-bg mh-100vh">
        {urlParams.redirect_status && (
          <Row>
            <Col span={12} offset={6}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {urlParams.redirect_status == "succeeded" ? (
                  <Alert
                    message="Payment Successful!"
                    description="Success Description Success Description Success Description"
                    type="success"
                    action={
                      <Button 
                        type="primary"
                        aria-label="Dismiss payment success notification"
                      >
                        Done
                      </Button>
                    }
                    showIcon
                    banner
                    closable
                  />
                ) : (
                  <Alert
                    message="Payment Unsuccessful!"
                    description="Error Description Error Description Error Description Error Description"
                    type="error"
                    showIcon
                    banner
                    closable
                  />
                )}
              </Space>
            </Col>
          </Row>
        )}
        <div 
          className="flex flex-between-center mb-4"
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
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-neutral-900)"
            }}>
              Models Available for Purchase
            </h2>
            <p style={{ 
              margin: 0, 
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-base)"
            }}>
              Browse and purchase gesture recognition models
            </p>
          </div>
          <Search
            style={{ 
              width: "100%",
              maxWidth: "400px"
            }}
            placeholder="Search models by name or description..."
            enterButton="Search"
            size="large"
            loading={searchBtnLoading}
            onSearch={onPublicModelsSearch}
            allowClear
            aria-label="Search models"
          />
        </div>
        <Row gutter={[24, 24]} style={{ marginBottom: "3rem" }}>
          {!publicLoading && publicModels?.length > 0
            ? publicModels.map((model) => {
                return (
                  <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                    <ModelsCard
                      model={model}
                      deleteModel={deleteModel}
                      cloneModel={cloneModel}
                      purchaseModel={purchaseModel}
                      addNewTrainer={addNewTrainer}
                      addOrRemoveCartProduct={addOrRemoveCartProduct}
                      key={model.key}
                      showMessage={showMessage}
                    />
                  </Col>
                );
              })
            : !publicLoading && (
                <Col span={24}>
                  <Empty
                    style={{ fontWeight: 500, padding: "var(--spacing-xl)" }}
                    imageStyle={emptyImgStyle}
                    description={
                      <span style={{ fontSize: "var(--font-size-base)" }}>
                        No models found. Try a different search term.
                      </span>
                    }
                  />
                </Col>
              )}
          {publicLoading && (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Col key={i} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                  <Skeleton active style={{ height: 350 }} />
                </Col>
              ))}
            </>
          )}
        </Row>
        {totalPublicModels > 8 && (
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

export async function loader({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return { contacts };
}
