import * as functions from "firebase-functions";
import fetch from "node-fetch";

const challengeUnlocked = async (day: string) => {
  const config = functions.config().slack;

  await fetch(config.webhook, {
    method: "POST",
    body: JSON.stringify({
      text: `Ho Ho Ho! Day ${day} has just been unlocked! https://adventofcode.com/2019/day/${day}`,
    }),
    headers: { "content-type": "application/json" },
  });
};

const partCompleted = async (name: string, day: string, part: string) => {
  const config = functions.config().slack;

  await fetch(config.webhook, {
    method: "POST",
    body: JSON.stringify({
      text: `${name} just completed Day ${day}, part ${part}!`,
    }),
    headers: { "content-type": "application/json" },
  });
};

export const updateSlackFunction = async (
  change: functions.Change<FirebaseFirestore.DocumentSnapshot>,
  context: functions.EventContext,
) => {
  const day = change.before.id;

  const prevValue = change.before.data() as any;
  const newValue = change.after.data() as any;

  if (newValue == null) {
    return;
  }

  // New day unlocked
  if ((prevValue == null || !prevValue.unlocked) && newValue.unlocked) {
    challengeUnlocked(day);
  }

  // Part 1
  for (let name of Object.keys(newValue["1"])) {
    if ((prevValue == null || !prevValue["1"][name]) && newValue["1"][name]) {
      partCompleted(name, day, "1");
    }
  }

  // Part 2
  for (let name of Object.keys(newValue["2"])) {
    if ((prevValue == null || !prevValue["2"][name]) && newValue["2"][name]) {
      partCompleted(name, day, "2");
    }
  }
};
