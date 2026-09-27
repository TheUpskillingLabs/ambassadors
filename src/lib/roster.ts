/* The founding ten, read from data/roster.json for the program page's launch
   section. Add an ambassador as they get in; empty slots read as open. */
import roster from "../../data/roster.json";

export type Founder = { first: string; area?: string };

export const slots: number = roster.slots;
export const founders: Founder[] = (roster.ambassadors as Founder[]).slice(0, roster.slots);
