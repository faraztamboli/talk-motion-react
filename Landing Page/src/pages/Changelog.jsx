import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MetaDecorator from "../components/HOCs/MetaDecorator";
import { changelogPageDetails } from "../data/pageDetails";
import { Section } from "../components/marketing/Sections";
import "../marketing.css";

/* Monthly. Newest first. "What people told us" only quotes feedback that arrived through
   /feedback, with names only when the person ticked "You may thank me by name". */
const ENTRIES = [
  {
    month: "November 2026",
    told: [],
    changed: [
      "We rewrote this website. It no longer promises translation or sign recognition that does not exist, and every claim we make is listed on the Open build page.",
      "Every conversation now reminds both people to ask for a qualified interpreter for health, legal or money matters, with a one-tap request that you still confirm before it is spoken.",
      "You can choose the voice your replies are spoken in.",
      "On a shared phone, captions now name the other person instead of calling every line \"You\". You can type who you are talking to, such as \"Pharmacist\".",
      "My conversations: save any transcript as a text file, or delete it for good.",
      "Pharmacies and clinics: a location's admin adds and removes staff, and reads a monthly summary that counts conversations and never includes what was said.",
      "A feedback page, and a \"Report a problem\" link inside every conversation.",
      "We count visits to this website without cookies, and without storing IP addresses.",
    ],
  },
  {
    month: "Earlier in 2026",
    told: [],
    changed: [
      "Conversation Mode: live captions of the hearing person, suggested replies, and a natural voice that speaks only what you confirm.",
      "Plain-language captions for anyone who prefers shorter sentences.",
      "Tap a word in a caption to see a sign video, where we have one.",
      "Captioned lessons: a teacher speaks, and students read live captions on their own screens.",
    ],
  },
];

function Changelog(props) {
  const { title, description } = changelogPageDetails;
  return (
    <>
      <MetaDecorator title={title} description={description} />
      <Header md={props.md} />
      <main className="tm">
        <Section
          eyebrow="Changelog"
          title="What you told us, and what we changed"
          lede="Every month, in plain words. If you think something here is wrong, tell us and we will correct it."
        >
          <div className="log">
            {ENTRIES.map((e) => (
              <article key={e.month} className="log-entry">
                <h3>{e.month}</h3>
                <h4 className="eyebrow">What people told us</h4>
                {e.told.length ? (
                  <ul className="list">
                    {e.told.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Nothing yet. The <Link to="/feedback">feedback page</Link> opened this month. When people write to
                    us, what they said goes here, with their name only if they agreed.
                  </p>
                )}
                <h4 className="eyebrow">What we changed</h4>
                <ul className="list">
                  {e.changed.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

export default Changelog;
