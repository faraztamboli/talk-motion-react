import React, { useRef } from "react";
import { Card, Typography, Button } from "antd";
import {
  SoundOutlined,
  MessageOutlined,
  ApartmentOutlined,
  SettingOutlined,
  ReadOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function GuidePageContent() {
  const scrollerRef = useRef(null);

  const items = [
    {
      key: "1",
      icon: <MessageOutlined />,
      title: "Sign-language gestures to voice",
      desc:
        "Signing users communicate naturally while TalkMotion captures movement via webcam. Our AI translates recognized sign-language gestures into clear speech or text—supporting conversations in environments where signing may not be understood. This expands access; it does not replace signing.",
    },
    {
      key: "2",
      icon: <SoundOutlined />,
      title: "Voice to sign-language gestures",
      desc:
        "When someone responds verbally, TalkMotion can display sign-language prompts or visual cues using voice recognition. This helps create shared understanding between signing and non-signing participants without requiring a common language in advance.",
    },
    {
      key: "3",
      icon: <ApartmentOutlined />,
      title: "Professional models for various settings",
      desc:
        "Different environments call for different vocabularies. TalkMotion offers context-aware models—co-designed with Deaf ASL experts—for retail, healthcare, classrooms, workplaces, and everyday conversations. These models enhance access and do not substitute human interpreters or lived signing expertise.",
    },
    {
      key: "4",
      icon: <SettingOutlined />,
      title: "Personalized models",
      desc:
        "Create and train your own custom gestures for phrases you use most. Personalization gives you speed and control while honoring your individual signing style and linguistic expression.",
    },
    {
      key: "5",
      icon: <ReadOutlined />,
      title: "TalkMotion in education",
      desc:
        "Signing-aware tools support lessons, discussions, and assignments so students can participate alongside peers in mixed-language classrooms. The goal is equity and access—not “fixing” communication.",
    },
  ];

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9);
    el.scrollTo({ left: el.scrollLeft + dir * amount, behavior: "smooth" });
  };

  return (
    <section className="tm-features" aria-label="TalkMotion Features">
      <div className="tm-features__header">
        <Title level={3} className="tm-features__title">TalkMotion Features</Title>
        <div className="tm-features__controls">
          <Button
            shape="circle"
            size="large"
            icon={<LeftOutlined />}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll features left"
          />
          <Button
            shape="circle"
            size="large"
            icon={<RightOutlined />}
            onClick={() => scrollBy(1)}
            aria-label="Scroll features right"
          />
        </div>
      </div>

      <div className="tm-features__railWrap">
        <div className="tm-features__rail" ref={scrollerRef}>
          {items.map((item, idx) => (
            <Card bordered={false} className="tm-features__card" key={item.key}>
              <div className="tm-features__icon">{item.icon}</div>

              {/* Number + title on one line */}
              <div className="tm-features__heading">
                  <span className="tm-features__num">{idx + 1}</span>
                  <Title level={4} className="tm-features__cardTitle">
                    {item.title}
                  </Title>
                </div>

              <Paragraph className="tm-features__cardText">{item.desc}</Paragraph>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
