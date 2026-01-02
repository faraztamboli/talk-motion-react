import React from "react";
import {
  Card,
  Avatar,
  Typography,
  Space,
  Button,
  Tag,
  Grid,
  Divider,
} from "antd";
import {
  LinkedinOutlined,
  MailOutlined,
  BulbOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

function Neelofar() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        padding: isMobile ? "16px" : "40px",
        borderRadius: "40px",
        background:
          "linear-gradient(180deg, rgba(8,22,95,0.06) 0%, rgba(8,22,95,0.02) 100%)",
      }}
      aria-label="Profile: Neelofar Tamboli"
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 820,
          borderRadius: 20,
          boxShadow:
            "0 10px 30px rgba(8, 22, 95, 0.08), 0 2px 10px rgba(8, 22, 95, 0.06)",
        }}
        bodyStyle={{ padding: isMobile ? 20 : 32 }}
      >
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          align={isMobile ? "center" : "start"}
          size={isMobile ? 20 : 28}
          style={{ width: "100%" }}
        >
          <Avatar
            size={isMobile ? 96 : 128}
            src="https://video.talk-motion.com/profile/neelofar/neelofar_sm.png"
            alt="Portrait of Neelofar Tamboli"
            style={{ border: "3px solid #f0f3ff" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title
              level={isMobile ? 3 : 2}
              style={{ marginBottom: 4, color: "#08165f" }}
            >
              Neelofar Tamboli
            </Title>

            <Space size="small" wrap>
              <Tag color="blue-inverse" icon={<BulbOutlined />}>
                Co-Founder & CPO
              </Tag>
              <Tag color="geekblue" icon={<TeamOutlined />}>
                Product & Partnerships
              </Tag>
            </Space>
          </div>
        </Space>
        <div>
            <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
              Neelofar leads product strategy and partnerships at TalkMotion,
              co-designing with Deaf ASL experts and community partners to build
              tools that <Text strong>expand access</Text> across schools,
              workplaces, and public spaces—while honoring the richness of sign
              language and user autonomy.
            </Paragraph>

            <Paragraph style={{ marginTop: 12 }}>
              With experience across medical-device initiatives, she focuses on{" "}
              <Text strong>ethics, inclusion, and evidence-based design</Text>—
              turning research and community feedback into clear, respectful
              product decisions.
            </Paragraph>

            <Divider style={{ margin: "16px 0" }} />

            <Space wrap>
              <a
                href="https://www.linkedin.com/in/neelofar-tamboli/"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Neelofar Tamboli LinkedIn profile"
              >
                <Button
                  type="primary"
                  shape="round"
                  size={isMobile ? "middle" : "large"}
                  icon={<LinkedinOutlined />}
                >
                  LinkedIn
                </Button>
              </a>

              <a
                href="mailto:info@talk-motion.com?subject=Hello%20Neelofar%20—%20TalkMotion"
                aria-label="Email Neelofar Tamboli"
              >
                <Button
                  shape="round"
                  size={isMobile ? "middle" : "large"}
                  icon={<MailOutlined />}
                >
                  Contact
                </Button>
              </a>
            </Space>
        </div>
      </Card>
    </div>
  );
}

export default Neelofar;
