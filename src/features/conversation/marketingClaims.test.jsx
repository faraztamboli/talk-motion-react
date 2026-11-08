import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CaptionStream, { fromOtherPerson } from "./components/CaptionStream";
import ComposeTray from "./components/ComposeTray";
import { SummaryView } from "../locations/LocationDetail";
import { recentMonths } from "../locations/api";

// Features behind public marketing claims (talkmotion server/docs/marketing/05-claims-register.md).

describe("their name on each line, on a shared phone", () => {
  it("attributes the right lines to the other person", () => {
    const deafOwner = { role: "primary", isOwner: true, mode: "same_device" };
    const hearingOwner = { role: "partner", isOwner: true, mode: "same_device" };
    expect(fromOtherPerson(deafOwner, true)).toBe(true); // speech heard on a Deaf person's phone
    expect(fromOtherPerson(deafOwner, false)).toBe(false); // their own typed reply
    expect(fromOtherPerson(hearingOwner, false)).toBe(true); // the Deaf person typed on the hearing owner's phone
    expect(fromOtherPerson(hearingOwner, true)).toBe(false);
    expect(fromOtherPerson({ ...hearingOwner, mode: "two_device" }, false)).toBe(false);
    expect(fromOtherPerson(null, true)).toBe(false);
  });

  it("labels the hearing person's speech with the partner label", () => {
    render(
      <CaptionStream
        utterances={[
          { id: 1, participant_id: "me", source: "speech", text: "Any allergies?" },
          { id: 2, participant_id: "me", source: "typed", text: "No allergies" },
        ]}
        partials={{}}
        participants={{ me: { participantId: "me", displayName: "Dana" } }}
        meId="me"
        device={{ role: "primary", isOwner: true, mode: "same_device", partnerLabel: "Pharmacist" }}
      />
    );
    expect(screen.getByText("Pharmacist")).toBeTruthy();
    expect(screen.getByText("You")).toBeTruthy();
  });
});

describe("a voice you choose", () => {
  const base = { onSpeak: vi.fn(), onReject: vi.fn(), onTyping: vi.fn(), suggestions: null };

  it("offers a voice picker when there is a choice", () => {
    render(
      <ComposeTray
        {...base}
        voices={[
          { id: "a", name: "Alex", description: "calm" },
          { id: "b", name: "Sam", description: "" },
        ]}
        voiceId="a"
        onVoiceChange={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox", { name: "Voice" })).toBeTruthy();
    expect(screen.getByText("Alex (calm)")).toBeTruthy();
  });

  it("hides the picker when there is nothing to choose", () => {
    render(<ComposeTray {...base} voices={[{ id: "a", name: "Alex" }]} voiceId="a" onVoiceChange={vi.fn()} />);
    expect(screen.queryByRole("combobox", { name: "Voice" })).toBeNull();
  });
});

describe("monthly accessibility summary", () => {
  it("shows counts and the privacy notes", () => {
    render(
      <SummaryView
        summary={{
          location_name: "Main Street Pharmacy",
          month: "2026-11",
          conversations: 12,
          minutes: 48.5,
          average_minutes: 4,
          replies_spoken: 30,
          captions_shown: 70,
          customers_on_own_phone: 5,
          replies_from_suggestions: 9,
          plain_language_conversations: 3,
          staff_active: 2,
          busiest_weekday: "Tuesday",
          by_week: [{ week_of: "2026-11-02", conversations: 7 }],
          notes: ["Counts only. This summary never includes what anyone said."],
        }}
      />
    );
    expect(screen.getByText(/Main Street Pharmacy: accessibility summary/)).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Tuesday")).toBeTruthy();
    expect(screen.getByText(/never includes what anyone said/)).toBeTruthy();
  });

  it("lists the last twelve months, newest first", () => {
    const months = recentMonths(12, new Date(Date.UTC(2026, 0, 15)));
    expect(months[0]).toBe("2026-01");
    expect(months[1]).toBe("2025-12");
    expect(months).toHaveLength(12);
  });
});
