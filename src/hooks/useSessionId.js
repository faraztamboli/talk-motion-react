function useSessionId() {
  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  const newSessionId = () => {
    return guid();
  };

  const getSessionId = () => {
    let sessionId = window.localStorage.getItem('sessionId');
    return sessionId;
  };

  return [getSessionId, newSessionId];
}

export default useSessionId;
