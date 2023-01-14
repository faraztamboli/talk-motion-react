import React from "react";
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
  const { userModels, getUserModels, userCount, userLoading } = useModels();
  const dispatch = useDispatch();

  function onUserModelsChange(page, pageSize) {
    dispatch(setCurrentModelPage(page));
    dispatch(setModelPaginationSize(pageSize));
    getUserModels((page - 1) * pageSize, pageSize);
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
            <NewModel sm={props.sm} />
          </div>
        </div>
      </div>
    </>
  );
}
