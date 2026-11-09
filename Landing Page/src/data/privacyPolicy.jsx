import React from "react";

/*
 * The privacy policy, in plain words. Every statement here matches the code; the evidence is in
 * talkmotion server/docs/marketing/05-claims-register.md section 4. When a data flow changes,
 * change this page in the same release, and add a line to the changelog.
 */
export const PRIVACY_UPDATED = "November 8, 2026";

const P = ({ children }) => <p style={{ maxWidth: "75ch" }}>{children}</p>;

export const privacyPolicy = (
  <div className="privacy-policy-text">
    <P>
      <strong>Last updated: {PRIVACY_UPDATED}</strong>
    </P>
    <P>
      This policy covers talk-motion.com and the TalkMotion app at app.talk-motion.com. It says what we collect, why,
      who else handles it, how long we keep it, and what you can do about it. Questions:{" "}
      <a href="mailto:info@talk-motion.com">info@talk-motion.com</a>.
    </P>

    <h4>The short version</h4>
    <ul>
      <li>We do not sell your information, and we do not use it for advertising.</li>
      <li>Speech recognition runs on our own servers. Your microphone audio is not stored.</li>
      <li>Some features send text to outside AI services. They are named below, and private mode turns them off.</li>
      <li>You can save or delete your conversations yourself. Deleted data leaves our backups within 35 days.</li>
      <li>This website counts visits without cookies, and the counter does not store IP addresses.</li>
    </ul>

    <h4>What we collect</h4>
    <P>
      <strong>Your account.</strong> Your email address, username and display name. Your password is stored only as a
      one-way hash, never as the password itself. If you add them, we also keep your first and last name, a profile
      photo and a postal address. We do not ask for your phone number, gender or location.
    </P>
    <P>
      <strong>Conversations.</strong> What is said in a conversation is stored as text: captions of speech, replies you
      type and speak, suggestions you accept or turn down, plain-language versions, and the names people enter when
      they join. Your microphone audio is streamed to our speech recognition and is not stored. Audio or video you
      upload for automatic captions is deleted once it has been turned into text.
    </P>
    <P>
      <strong>Older sign-language features.</strong> In the Translator, Trainer and Collector from our first prototype,
      the camera picture stays on your device. The app sends the positions of your hands, face and body as points, not
      video. In the Collector, the points you record are stored so we can train your personal model. In the Translator,
      we keep the recognized word and timing information. Videos and recordings you upload are stored on our servers
      and delivered from video.talk-motion.com.
    </P>
    <P>
      <strong>Payments.</strong> Card payments are handled by Stripe. Your card number goes to Stripe, never to us. We
      keep what you bought, your Stripe customer and payment references, and the billing name and address you give.
    </P>
    <P>
      <strong>Messages you send us.</strong> When you use our feedback or contact form, we receive what you write and
      any name or email address you choose to give.
    </P>
    <P>
      <strong>Website visits.</strong> We count visits per day, by page section, event and referring website. The
      counter does not use cookies and does not store your IP address. If your browser sends Do Not Track, we do not
      count your visit at all.
    </P>
    <P>
      <strong>Technical logs.</strong> Like most web servers, ours record IP addresses and request details. We use them
      only for security and troubleshooting, and they are kept for a short time.
    </P>
    <P>
      <strong>Your browser.</strong> The app keeps your sign-in and your preferences, such as text size and voice, in
      your browser&apos;s storage. We set no advertising or tracking cookies. Stripe&apos;s payment script, which the
      app loads, sets its own cookies for fraud prevention.
    </P>

    <h4>Who else handles your information</h4>
    <P>These companies process information for us, only to provide the feature named:</P>
    <ul>
      <li>
        <strong>OpenAI</strong>: plain-language versions, suggested replies and fingerspelling completion receive the
        text of the conversation, including recent turns. Older learning features also use OpenAI: video and course
        descriptions, subtitle help, and the AI tutor, whose chats we store.
      </li>
      <li>
        <strong>ElevenLabs</strong>: when you tap Speak, the text of your reply is sent to ElevenLabs to produce the
        natural voice.
      </li>
      <li>
        <strong>Your browser&apos;s own speech services</strong>: if our speech recognition is unavailable, your browser
        may recognize speech instead, and some browsers send that audio to the company that makes them. Some browser
        voices also work online.
      </li>
      <li>
        <strong>Stripe</strong>: payments. <strong>Brevo</strong>: password-reset emails. <strong>EmailJS</strong>:
        delivers messages from our feedback and contact forms. <strong>Wasabi</strong>: off-site copies of our backups,
        and of data from the older sign-language features.
      </li>
      <li>
        <strong>Services your browser contacts directly</strong>: jsDelivr (scripts the app needs for the camera
        features), Google Fonts (this website&apos;s typefaces) and YouTube (videos shown in lessons and the subtitle
        designer). They see your IP address, as any website you visit does. WhatsApp, if you choose to contact us
        there.
      </li>
    </ul>
    <P>We do not sell or rent personal information, and we do not share it for advertising.</P>

    <h4>Private mode at pharmacies and clinics</h4>
    <P>
      Conversations held for a pharmacy or clinic location use private mode unless the location&apos;s admin turns it
      off. In private mode, what is said stays on TalkMotion&apos;s servers and the phones in the conversation:
      captions come only from our own speech recognition, replies are spoken by the phone&apos;s own voice, and nothing
      is sent to OpenAI or ElevenLabs. The words of each conversation are deleted 15 minutes after it ends, so the
      customer can save a copy first, and a conversation left open with nothing said for an hour ends by itself.
      Copies in our nightly backups are gone within 35 days. The location&apos;s monthly summary keeps counts only.
    </P>
    <P>
      TalkMotion is not a medical service. We do not sign HIPAA business associate agreements yet. For health, legal
      or money matters, ask for a qualified interpreter.
    </P>

    <h4>How long we keep it</h4>
    <ul>
      <li>Your account: until you ask us to delete it.</li>
      <li>Conversations: until you delete them. In private mode, the words are deleted 15 minutes after it ends.</li>
      <li>
        Backups: our database is backed up every night, and each backup is kept for 35 days. Anything you delete leaves
        our backups within 35 days.
      </li>
      <li>Website visit counts: kept as daily totals, with nothing that identifies you.</li>
      <li>Data from the older sign-language features: until you delete it or ask us to.</li>
    </ul>

    <h4>Your choices</h4>
    <ul>
      <li>Save any conversation as a text file, or delete it, under My conversations in the app.</li>
      <li>
        To get a copy of your information, correct it, or delete your account, email{" "}
        <a href="mailto:info@talk-motion.com">info@talk-motion.com</a> from the address on your account. We answer
        within 30 days, wherever you live.
      </li>
      <li>Turn on Do Not Track in your browser, and we will not count your visits.</li>
    </ul>

    <h4>Children</h4>
    <P>
      TalkMotion is not meant for children under 13 to use on their own. In a captioned lesson set up by a teacher,
      students join with a display name and need no account. If you think a child under 13 has given us personal
      information, email us and we will delete it.
    </P>

    <h4>Security</h4>
    <P>
      Information travels to and from our servers encrypted (TLS). Passwords are stored only as hashes, and access to
      our systems is limited to the people who run them. No system is perfectly secure, and we will tell affected users
      if their information is exposed.
    </P>

    <h4>Changes</h4>
    <P>
      When we change how we handle information, we update this page and say so in our{" "}
      <a href="/changelog">changelog</a>. Everything we claim about TalkMotion is listed on our{" "}
      <a href="/open-build">Open build</a> page.
    </P>
  </div>
);
