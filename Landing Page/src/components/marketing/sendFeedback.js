import emailjs from "emailjs-com";

// Same delivery path as ContactUsForm: the site's contact API first, EmailJS as the fallback.
const API_URL = import.meta.env.VITE_CONTACT_API_URL ?? "/api/contact";
const EJ_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "service_tc4ncd4";
const EJ_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "template_8vwlwpg";
const EJ_PUBLIC = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "KS80dVx4DYpL3XfBD";

/** Turns the feedback form into the contact template's four fields. */
export function toContactFields(v) {
  const kind = v.kind === "volunteer" ? "Volunteer" : "Feedback";
  const lines = [
    `Type: ${kind}`,
    `I am: ${v.identity || "not given"}`,
    v.kind !== "volunteer" ? `Where: ${v.where || "not given"}` : null,
    v.kind === "volunteer" ? `Can record ASL: ${v.asl ? "yes" : "no"}` : null,
    `Credit by name: ${v.credit ? "yes" : "no"}`,
    "",
    v.message,
  ].filter((line) => line !== null);
  return {
    firstName: v.name?.trim() || "Anonymous",
    lastName: `[${kind}]`,
    email: v.email?.trim() || "not-given@talk-motion.com",
    msg: lines.join("\n"),
  };
}

export async function sendFeedback(values) {
  const fields = toContactFields(values);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) return true;
    if (res.status !== 404) return false;
  } catch {
    // network or CORS: fall through to EmailJS
  }
  await emailjs.send(
    EJ_SERVICE,
    EJ_TEMPLATE,
    { first_name: fields.firstName, last_name: fields.lastName, email: fields.email, message: fields.msg },
    EJ_PUBLIC
  );
  return true;
}
