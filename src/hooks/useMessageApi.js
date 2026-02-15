import { message } from "antd";
import { announceToScreenReader } from "../utils/accessibility";

function useMessageApi() {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (type, messageContent) => {
    // Show visual message
    messageApi.open({ type, content: messageContent, duration: 2.5 });
    
    // Announce to screen readers
    const priority = type === 'error' ? 'assertive' : 'polite';
    announceToScreenReader(messageContent, priority);
  };

  return { showMessage, contextHolder };
}

export default useMessageApi;
