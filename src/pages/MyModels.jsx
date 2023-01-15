import React, { useState, useEffect } from "react";
import { Row, Col, Skeleton, Empty, Pagination } from "antd";
import useModels from "../hooks/useModels";
import NewModel from "../components/ui/NewModel";
import { ModelsCard } from "../components/ui/ModelsCard";
import UserMenuProfileItem from "../components/ui/UserMenuProfileItem";
import MetaDecorator from "../components/MetaDecorator";
import { profileDetails } from "../data/PageDetails";
import { useDispatch } from "react-redux";
import {
  setCurrentModelPage,
  setModelPaginationSize,
} from "../app/features/modelSlice";

export default function MyModels(props) {
  const [userModels, setUserModels] = useState([]);
  const [totalUserModels, setTotalUserModels] = useState();
  const [userLoading, setUserLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const { getUserModels, addNewTrainer } = useModels();
  const dispatch = useDispatch();

  useEffect(() => {
    getUserModels((userPage - 1) * userPageSize, userPageSize)
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
    getUserModels((userPage - 1) * userPageSize, userPageSize)
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

  function onUserModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    setUserPage(page);
    setUserPageSize(pageSize);
  }

  const profileStyle =
    props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  const { title, description } = profileDetails;

  return (
    <>
      <MetaDecorator title={title} description={description} />
      <div style={profileStyle} className="layout-bg mh-100vh">
        <div>
          <UserMenuProfileItem size="large" />
        </div>
        <div className="details_section" style={{ marginTop: "2rem" }}>
          <h2>My Models</h2>
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
          <div className="flex flex-center-center mt-10">
            <NewModel sm={props.sm} />
          </div>
        </div>
      </div>
    </>
  );
}
