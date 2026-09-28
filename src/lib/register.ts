/* The register of Contributing Members, kept in data/register.json.
   Not shown on any page yet. Awards are recorded here first; entries are never deleted, and
   stepping back moves someone to emeritus. */
import data from "../../data/register.json";

export type RegisterEntry = {
  number: string;
  name: string;
  rank: "Contributing Member" | "Reviewer" | "Committer" | "Maintainer";
  level: "regional" | "national";
  region?: string;
  since?: string;
  status: "active" | "emeritus";
};

export const register: RegisterEntry[] = data.entries as RegisterEntry[];
