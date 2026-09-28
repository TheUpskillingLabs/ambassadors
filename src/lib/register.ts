/* The register of Contributing Members, read from data/register.json for the
   /roles/ and /contributing/ pages. Awards are recorded here first; entries are never deleted, and
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
