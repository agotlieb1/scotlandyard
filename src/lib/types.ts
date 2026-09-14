export type Investigation = {
  code: string;
  created_at: string;
};

export type EvidenceType = "alias" | "weapon" | "location" | "motive";

export type EvidenceItem = {
  type: EvidenceType;
  value: string;
};

export type InvestigationPlayer = {
  id: string;
  investigation_code: string;
  player_id: string;
  alias_title: string | null;
  alias_color: string | null;
  alias_locked: boolean;
  identity: string | null;
  is_murderer: boolean;
  evidence: EvidenceItem[] | null;
  notebook_checks: EvidenceItem[] | null;
  created_at: string;
  updated_at: string;
};

export type InvestigationCaseFile = {
  investigation_code: string;
  murderer_alias: string;
  weapon: string;
  location: string;
  motive: string;
  created_at: string;
};

export type InvestigationAccusation = {
  id: string;
  investigation_code: string;
  accuser_player_id: string;
  accused_alias: string;
  accused_identity: string;
  weapon: string | null;
  location: string | null;
  motive: string | null;
  is_correct: boolean;
  message: string;
  created_at: string;
};

export type Down4Crew = {
  code: string;
  name: string | null;
  created_at: string;
};

export type Down4Beacon = {
  id: string;
  crew_code: string;
  activity: string;
  area: string;
  until_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Down4Member = {
  id: string;
  crew_code: string;
  member_id: string;
  name: string;
  beacon_id: string | null;
  beacon_joined_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A beacon plus everyone who is in on it, newest joiner last. */
export type Down4LitBeacon = {
  beacon: Down4Beacon;
  members: Down4Member[];
};
