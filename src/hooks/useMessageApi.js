import { message } from "antd";

function useMessageApi() {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (type, messageContent) => {
    messageApi.open({ type, content: messageContent, duration: 2.5 });
  };

  return { showMessage, contextHolder };
}

export default useMessageApi;
