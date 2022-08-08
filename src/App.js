import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Layout } from 'antd';
import 'antd/dist/antd.min.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Converter from './pages/Converter';
import Trainer from './pages/Trainer';
import Models from './pages/Models';
import { Login } from './pages/Login';

const { Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const onCollapsed = () => {
    setCollapsed(!collapsed);
  };
  return (
    <div className="App">
      <Routes>
        <Route exact path="/login" element={<Login />} />
      </Routes>
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout>
          <Header collapsed={collapsed} onCollapsed={onCollapsed} />
          <Content
            style={{
              margin: '24px 16px 0',
            }}
          >
            <div
              className="site-layout-background"
              style={{
                padding: 24,
                minHeight: 360,
              }}
            >
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route path="/converter" element={<Converter />} />
                <Route path="/trainer" element={<Trainer />} />
                <Route path="/models" element={<Models />} />
              </Routes>
            </div>
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </div>
  );
};

export default App;
