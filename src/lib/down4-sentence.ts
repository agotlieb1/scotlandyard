import type {
  Down4Beacon,
  Down4JoinMode,
  Down4LitBeacon,
  Down4Member,
} from "./types";

/**
 * The preposition falls out of how you join in. Someone already there is "at
 * Cosmic Lanes" — a place you can walk into. Someone who would come out if
 * asked is "around Decatur" — a general part of town.
 */
export const areaPreposition = (joinMode: Down4JoinMode) =>
  joinMode === "show_up" ? "at" : "around";

// Both labels are instructions to the reader, not conditions on the beacon: a
// lit beacon is open to the whole crew either way.
export const JOIN_MODE_LABEL: Record<Down4JoinMode, string> = {
  show_up: "Just show up",
  text_me: "Text 2 Plan",
};

export const JOIN_MODE_HINT: Record<Down4JoinMode, string> = {
  show_up: "I am there now — come find me.",
  text_me: "Not out yet — text and I am in.",
};

/** "Aaron" / "Aaron and Damond" / "Aaron, Damond, and Casey" */
export const formatNames = (names: string[]) => {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

/** "3pm", "3:30pm" — in the reader's own timezone. */
export const formatUntil = (untilAt: string | null) => {
  if (!untilAt) {
    return "";
  }
  const date = new Date(untilAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const minutes = date.getMinutes();
  const suffix = date.getHours() >= 12 ? "pm" : "am";
  const hours = date.getHours() % 12 || 12;
  return minutes === 0
    ? `${hours}${suffix}`
    : `${hours}:${String(minutes).padStart(2, "0")}${suffix}`;
};

/** A beacon with no end time stays lit until its owner turns it off. */
export const isBeaconLit = (
  beacon: Pick<Down4Beacon, "until_at">,
  now: number = Date.now()
) => {
  if (!beacon.until_at) {
    return true;
  }
  const expiry = new Date(beacon.until_at).getTime();
  return Number.isNaN(expiry) ? true : expiry > now;
};

export type BeaconSentence = {
  subject: string;
  verb: string;
  activity: string;
  /** Empty when not set — blank parts are dropped, not rendered. */
  area: string;
  areaPreposition: string;
  until: string;
  joinMode: Down4JoinMode;
  text: string;
};

export const buildSentence = (
  names: string[],
  beacon: Pick<Down4Beacon, "activity" | "area" | "until_at" | "join_mode">
): BeaconSentence => {
  const subject = formatNames(names);
  const verb = names.length === 1 ? "is" : "are";
  const activity = beacon.activity.trim();
  const area = (beacon.area ?? "").trim();
  const until = formatUntil(beacon.until_at);
  const joinMode: Down4JoinMode =
    beacon.join_mode === "show_up" ? "show_up" : "text_me";
  const preposition = areaPreposition(joinMode);

  const parts = [subject, verb, "down4", activity];
  if (area) {
    parts.push(`${preposition} ${area}`);
  }
  if (until) {
    parts.push(`until ${until}`);
  }

  return {
    subject,
    verb,
    activity,
    area,
    areaPreposition: preposition,
    until,
    joinMode,
    text: `${parts.filter(Boolean).join(" ")}.`,
  };
};

/**
 * Roll members up onto the beacons they joined, dropping beacons that have
 * expired or that nobody is in. Originator first, later joiners after.
 */
export const groupLitBeacons = (
  members: Down4Member[],
  beacons: Down4Beacon[],
  now: number = Date.now()
): Down4LitBeacon[] => {
  const byBeacon = new Map<string, Down4Member[]>();
  for (const member of members) {
    if (!member.beacon_id) {
      continue;
    }
    const group = byBeacon.get(member.beacon_id);
    if (group) {
      group.push(member);
    } else {
      byBeacon.set(member.beacon_id, [member]);
    }
  }

  const sortKey = (member: Down4Member) =>
    new Date(member.beacon_joined_at ?? member.created_at).getTime();

  return beacons
    .filter((beacon) => isBeaconLit(beacon, now) && byBeacon.has(beacon.id))
    .map((beacon) => ({
      beacon,
      members: [...(byBeacon.get(beacon.id) ?? [])].sort(
        (a, b) => sortKey(a) - sortKey(b)
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.beacon.created_at).getTime() -
        new Date(a.beacon.created_at).getTime()
    );
};
