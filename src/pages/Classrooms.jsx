import React, { useState, useEffect } from "react";
import { Col, Empty, Row, Skeleton, Input } from "antd";
import useClassrooms from "../hooks/useClassrooms";
import { ClassroomCard } from "../components/ui/ClassroomCard";

function Classrooms(props) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getStudentsClassrooms, updateClassroom } = useClassrooms();

  const { Search } = Input;

  useEffect(() => {
    getStudentsClassrooms("", 0, 99999)
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
    getStudentsClassrooms(value, 0, 99999)
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
            My Classrooms
          </h2>
          <p style={{ 
            margin: 0, 
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-base)"
          }}>
            Browse and manage your learning classrooms
          </p>
        </div>
        <Search
          style={{ width: "100%", maxWidth: 400 }}
          placeholder="Search classrooms by name or description..."
          enterButton="Search"
          size="large"
          loading={loading}
          onSearch={onSearch}
          allowClear
          aria-label="Search classrooms"
        />
      </div>
      <Row gutter={[24, 24]} style={{ marginBottom: "3rem" }}>
        {!loading && classrooms?.length > 0
          ? classrooms.map((classroom) => {
              return (
                <Col key={classroom.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                  <ClassroomCard
                    classroom={classroom}
                    updateClassroom={updateClassroom}
                    setLoading={setLoading}
                  />
                </Col>
              );
            })
          : !loading && (
              <Col span={24}>
                <Empty
                  style={{ fontWeight: 500, padding: "var(--spacing-xl)" }}
                  imageStyle={emptyImgStyle}
                  description={
                    <span style={{ fontSize: "var(--font-size-base)" }}>
                      No classrooms found. Join a classroom to get started!
                    </span>
                  }
                />
              </Col>
            )}
        {loading && (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Col key={i} xs={24} sm={12} md={8} lg={6}>
                <Skeleton active style={{ height: 300 }} />
              </Col>
            ))}
          </>
        )}
      </Row>
    </div>
  );
}

export default Classrooms;
