import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useClassrooms() {
  const [token] = useLocalStorage("token");

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  function getStaffClassrooms(searchText, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getStaffsClassrooms(
          token,
          searchText,
          offset,
          end,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getStudentsClassrooms(searchText, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getStudentsClassrooms(
          token,
          searchText,
          offset,
          end,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function createClassroom(name, description, image, isPublic) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.createClassroom(
          token,
          name,
          description,
          null,
          isPublic,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function updateClassroom(id, name, description, image, isPublic, notes) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.updateClassroom(
          token,
          id,
          name,
          description,
          image,
          isPublic,
          notes,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function addStudentToClass(classroomId, userId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.addStudentToClass(
          token,
          classroomId,
          userId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function addTeacherToClass(classroomId, userId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.addTeacherToClass(
          token,
          classroomId,
          userId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function removeStudentFromClass(classroomId, userId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.removeStudentFromClass(
          token,
          classroomId,
          userId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function removeTeacherFromClass(classroomId, userId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.removeTeacherFromClass(
          token,
          classroomId,
          userId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getClassStudents(classroomId, is_approved) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getClassStudents(
          token,
          classroomId,
          is_approved,
          function (res) {
            if (res && res.error) {
              // Handle authorization or other errors
              const errorMessage = res.error.toString();
              console.error('getClassStudents error:', errorMessage);
              reject(new Error(errorMessage));
              return;
            }
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function getClassTeachers(classroomId, is_approved) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getClassTeachers(
          token,
          classroomId,
          is_approved,
          function (res) {
            if (res && res.error) {
              // Handle authorization or other errors
              const errorMessage = res.error.toString();
              console.error('getClassTeachers error:', errorMessage);
              reject(new Error(errorMessage));
              return;
            }
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function requestClassroomAccessAsStudent(classroomId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.requestClassroomAccessAsStudent(
          token,
          classroomId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function requestClassroomAccessAsTeacher(classroomId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.requestClassroomAccessAsTeacher(
          token,
          classroomId,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function approveStudentRequestToClass(request_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.approveStudentRequestToClass(
          token,
          request_id,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  function approveTeacherRequestToClass(request_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.approveTeacherRequestToClass(
          token,
          request_id,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    normFile,
    getStaffClassrooms,
    getStudentsClassrooms,
    createClassroom,
    updateClassroom,
    addStudentToClass,
    addTeacherToClass,
    removeStudentFromClass,
    removeTeacherFromClass,
    getClassStudents,
    getClassTeachers,
    requestClassroomAccessAsStudent,
    requestClassroomAccessAsTeacher,
    approveStudentRequestToClass,
    approveTeacherRequestToClass,
  };
}

export default useClassrooms;
