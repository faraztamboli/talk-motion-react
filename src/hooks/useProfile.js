import { useState, useEffect } from "react";
import JS2Py from "../remotepyjs";
import useBase64String from "./useBase64String";
import useLocalStorage from "./useLocalStorage";

function useProfile() {
  const [userProfile, setUserProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [token] = useLocalStorage("token");
  const { getBase64 } = useBase64String();

  useEffect(() => {
    getUserProfile();
  }, [Object.keys(userProfile).length]);

  const uploadProfilePic = (file) => {
    getBase64(file)
      .then((res) =>
        JS2Py.PythonFunctions.TalkMotionServer.uploadProfilePic(
          token,
          file.name,
          res,
          false,
          function (res) {
            console.log(res);
          }
        )
      )
      .catch((err) => console.log(err));
  };

  function getUserProfile() {
    setLoading(true);
    try {
      JS2Py.PythonFunctions.SessionServer.getUserProfile(token, function (res) {
        console.log(res);
        setUserProfile(() => res);
        setLoading(false);
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
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
    setLoading(true);
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
          setLoading(false);
        }
      );
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  }

  return { uploadProfilePic, userProfile, getUserProfile, updateUserProfile };
}

export default useProfile;
