import React, { useState, useEffect } from "react";
import { Col, Empty, Row, Skeleton, Input } from "antd";
import NewClassroom from "../components/ui/NewClassroom";
import useClassrooms from "../hooks/useClassrooms";
import { ClassroomCard } from "../components/ui/ClassroomCard";

function StaffClassrooms(props) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getStaffClassrooms, createClassroom, updateClassroom } =
    useClassrooms();

  const { Search } = Input;

  useEffect(() => {
    getStaffClassrooms("", 0, 99999)
      .then((res) => {
        console.log(res);
        setLoading(false);
        setClassrooms(res[0]);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const style = props.collapseWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  function onSearch(value) {
    setLoading(true);
    getStaffClassrooms(value, 0, 99999)
      .then((res) => {
        setLoading(false);
        setClassrooms(res[0]);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }

  return (
    <div style={style} className="layout-bg mh-100vh p-5">
      <div className="flex flex-between-center mb-5">
        <h2>My Classrooms - Staff</h2>
        <Search
          style={{ width: 300 }}
          placeholder="search"
          enterButton="Search"
          size="middle"
          loading={loading}
          onSearch={onSearch}
        />
        <NewClassroom
          sm={props.sm}
          createClassroom={createClassroom}
          setLoading={setLoading}
        />
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: "3rem" }}>
        {!loading && classrooms?.length > 0
          ? classrooms.map((classroom) => {
              return (
                <Col key={classroom.id} span={8} xs={24} md={8}>
                  <ClassroomCard
                    classroom={classroom}
                    updateClassroom={updateClassroom}
                    setLoading={setLoading}
                  />
                </Col>
              );
            })
          : !loading && (
              <div className="w-100p m-4">
                <Empty
                  style={{ fontWeight: 500 }}
                  imageStyle={emptyImgStyle}
                  description={<span>No Models</span>}
                />
              </div>
            )}
        <Skeleton active loading={loading} style={{ width: "500px" }} />
      </Row>
    </div>
  );
}

export default StaffClassrooms;
