import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
} from "@ant-design/icons";

function getItem(label, key, icon, children, path) {
  return {
    key,
    icon,
    children,
    label,
    path,
  };
}

const items = [
  getItem("Converter", "1", <PieChartOutlined />, null, "/converter"),
  getItem("Trainer", "2", <DesktopOutlined />, null, "/trainer"),
  getItem("Models", "3", <FileOutlined />, null, "/models"),
];

export default items;
