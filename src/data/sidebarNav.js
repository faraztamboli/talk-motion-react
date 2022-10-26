import { DesktopOutlined, FileOutlined, PieChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import React from 'react';

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
  getItem(
    'Converter',
    '1',
    <Link to="/converter">
      <PieChartOutlined />
    </Link>,
    null,
    '/converter',
  ),
  getItem(
    'Trainer',
    '2',
    <Link to="/trainer">
      <DesktopOutlined />
    </Link>,
    null,
    '/trainer',
  ),
  getItem(
    'Models',
    '3',
    <Link to="/models">
      <FileOutlined />
    </Link>,
    null,
    '/models',
  ),
];

export default items;
