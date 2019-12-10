import * as _ from "lodash";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

admin.initializeApp(functions.config().firebase);

export const pollAOCFunction = async () => {
  const config = functions.config().aoc;

  const result = await fetch(`${config.host}${config.path}`, {
    method: "GET",
    headers: { cookie: `session=${config.token}` },
  });

  const html = await result.text();

  const $ = cheerio.load(html);

  const results = _.range(1, 26).reduce(
    (acc, data) => ({ ...acc, [data]: { unlocked: false, "1": {}, "2": {} } }),
    {},
  );

  for (let day of Object.keys(results)) {
    if (
      !(
        await admin
          .firestore()
          .collection("days")
          .doc(day)
          .get()
      ).exists
    ) {
      await admin
        .firestore()
        .collection("days")
        .doc(day)
        .set({ unlocked: false, "1": {}, "2": {} });
    }
  }

  const latestScore = (
    await admin
      .firestore()
      .collection("days")
      .get()
  ).docs.reduce(
    (acc, data) => ({
      ...acc,
      [data.id]: { data: data.data(), ref: data.ref },
    }),
    {},
  );

  $(".privboard-row").each(async (idx, el) => {
    if (idx === 0) {
      return;
    }

    const name = $(el)
      .find(".privboard-name")
      .text()
      .replace(/^s+(Sponsor)$/g, "");

    $(el)
      .find(
        ".privboard-star-both, .privboard-star-firstonly, .privboard-star-unlocked",
      )
      .each((d, entry) => {
        const day = d + 1;
        if ($(entry).hasClass("privboard-star-both")) {
          results[day].unlocked = true;
          results[day]["1"][name] = true;
          results[day]["2"][name] = true;
        } else if ($(entry).hasClass("privboard-star-firstonly")) {
          results[day].unlocked = true;
          results[day]["1"][name] = true;
          results[day]["2"][name] = false;
        } else {
          results[day].unlocked = true;
          results[day]["1"][name] = false;
          results[day]["2"][name] = false;
        }
      });
  });

  for (let day of Object.keys(results)) {
    // New day unlocked
    const update = {} as any;
    if (results[day].unlocked && !latestScore[day].data.unlocked) {
      update.unlocked = true;
    }

    // Part 1
    for (let name of Object.keys(results[day]["1"])) {
      if (latestScore[day].data["1"][name] !== results[day]["1"][name]) {
        update[`1.${name}`] = results[day]["1"][name];
      }
    }

    // Part 2
    for (let name of Object.keys(results[day]["2"])) {
      if (latestScore[day].data["2"][name] !== results[day]["2"][name]) {
        update[`2.${name}`] = results[day]["2"][name];
      }
    }

    if (Object.keys(update).length > 0) {
      await admin
        .firestore()
        .collection("days")
        .doc(day)
        .update(update);
    }
  }
};
