/* The roll of Contributors, read from data/contributors.json for the
   /contributors/ page. Append-only: stepping back marks someone as an alum. */
import data from "../../data/contributors.json";

export type Contributor = { name: string; region?: string; pinned?: string; alum?: boolean };

export const contributors: Contributor[] = data.contributors as Contributor[];
