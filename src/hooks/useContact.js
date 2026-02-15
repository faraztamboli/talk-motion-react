import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useContact() {
  const [token] = useLocalStorage("token");

  /**
   * Send a contact us message to the backend
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} subject - Message subject
   * @param {string} message - Message content
   * @param {string} category - Message category (optional)
   * @param {string|File} attachment - Attachment file (optional)
   * @returns {Promise} Promise that resolves with the response
   */
  function addContactUsMessage(name, email, subject, message, category = null, attachment = null) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.addContactUsMessage(
          token,
          name,
          email,
          subject,
          message,
          category,
          attachment,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.error("Error sending contact message:", err);
        reject(err);
      }
    });
  }

  return { addContactUsMessage };
}

export default useContact;

