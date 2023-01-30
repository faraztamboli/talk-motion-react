import JS2Py from "../remotepyjs";
import useBase64String from "./useBase64String";
import useLocalStorage from "./useLocalStorage";

function useProfile() {
  const [token] = useLocalStorage("token");
  const { getBase64 } = useBase64String();

  const uploadProfilePic = (file) => {
    return new Promise((resolve, reject) => {
      try {
        getBase64(file)
          .then((res) =>
            JS2Py.PythonFunctions.TalkMotionServer.uploadProfilePicture(
              token,
              res,
              true,
              function (res) {
                resolve(res);
              }
            )
          )
          .catch((err) => console.log(err));
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  };

  function getUserProfile() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserProfileNew(
          token,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function updateUserProfile(
    first,
    middle,
    last,
    email,
    street,
    city,
    country,
    zip,
    line2,
    sm_img,
    lg_img
  ) {
    return new Promise((resolve, reject) => {
      console.log(first, middle, last);
      try {
        JS2Py.PythonFunctions.TalkMotionServer.updateUserProfileWithImages(
          token,
          first,
          middle,
          last,
          email,
          street,
          city,
          country,
          zip,
          line2,
          sm_img ? sm_img : null,
          lg_img ? lg_img : null,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  return { uploadProfilePic, getUserProfile, updateUserProfile };
}

export default useProfile;
