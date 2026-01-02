import React, { useState, useEffect } from "react";
import AddTeacherToClass from "../components/ui/AddTeacherToClass";
import AddStudentToClass from "../components/ui/AddStudentToClass";
import RemoveStudentFromClass from "../components/ui/RemoveStudentFromClass";
import RemoveTeacherFromClass from "../components/ui/RemoveTeacherFromClass";
import UpdateClassroom from "../components/ui/UpdateClassroom";
import { Avatar, Button, Dropdown, Empty, List, Skeleton, Space } from "antd";
import { DownOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import useClassrooms from "../hooks/useClassrooms";

const Classroom = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const { classroomId } = useParams();
  const {
    addTeacherToClass,
    addStudentToClass,
    removeStudentFromClass,
    removeTeacherFromClass,
    updateClassroom,
    getClassStudents,
  } = useClassrooms();

  useEffect(() => {
    getClassStudents(classroomId, true)
      .then((res) => {
        console.log(res);
        setStudents(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const items = [
    {
      label: (
        <AddTeacherToClass
          setLoading={setLoading}
          classroomId={classroomId}
          addTeacherToClass={addTeacherToClass}
        />
      ),
      key: "1",
      icon: <UserOutlined />,
    },
    {
      label: (
        <AddStudentToClass
          setLoading={setLoading}
          classroomId={classroomId}
          addStudentToClass={addStudentToClass}
        />
      ),
      key: "2",
      icon: <UserOutlined />,
    },
    {
      label: (
        <RemoveStudentFromClass
          setLoading={setLoading}
          classroomId={classroomId}
          removeStudentFromClass={removeStudentFromClass}
        />
      ),
      key: "3",
      icon: <UserOutlined />,
      danger: true,
    },
    {
      label: (
        <RemoveTeacherFromClass
          setLoading={setLoading}
          classroomId={classroomId}
          removeTeacherFromClass={removeTeacherFromClass}
        />
      ),
      key: "4",
      icon: <UserOutlined />,
      danger: true,
    },
    {
      label: (
        <UpdateClassroom
          updateClassroom={updateClassroom}
          setLoading={setLoading}
        />
      ),
      key: "5",
      icon: <UserOutlined />,
    },
  ];
  const menuProps = {
    items,
  };

  return (
    <div className="layout-bg mh-100vh p-5">
      {!loading ? (
        <>
          <div className="flex flex-between-center">
            <h2>Classroom name here</h2>
            <Dropdown menu={menuProps}>
              <Button>
                <Space>
                  Options
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </div>

          <div className="mt-8">
            <h3 className="ml-5">Students</h3>
            {students.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={students}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            item.sm_img
                              ? item.sm_img
                              : `https://randomuser.me/api/portraits/${
                                  index % 2 === 0 ? "men" : "women"
                                }/${index}.jpg`
                          }
                        />
                      }
                      title={
                        <Link
                          to={`/profile/${item.fullname}`}
                          style={{ marginTop: "0" }}
                        >
                          {item.fullname ? item.fullname : "TalkMotion User"}
                        </Link>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty />
            )}
          </div>
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
export default Classroom;
