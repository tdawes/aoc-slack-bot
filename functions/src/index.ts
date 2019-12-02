import * as functions from "firebase-functions";
import { pollAOCFunction } from "./functions/poll-aoc";
import { updateSlackFunction } from "./functions/update-slack";

export const pollAOC = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(pollAOCFunction);

export const updateSlack = functions.firestore
  .document("days/{day}")
  .onUpdate(updateSlackFunction);
