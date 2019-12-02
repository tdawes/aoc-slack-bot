# Advent of Code Slackbot

A slackbot that posts AOC updates to a Slack channel:
- When new days are unlocked
- When members of your team complete challenges

## Getting Started

1. Create a firebase instance with a Firestore and upgrade to the Blaze plan (needed to post to Slack from a Firebase function).
2. Create Slack webhook in the channel of your choice.
3. Create your own version of _config/functions.json_ containing the following properties:

- `"slack.webhook"` - the Slack webhook's url
- `"aoc.host"` - the AOC hostname - typically [https://adventofcode.com](https://adventofcode.com).
- `"aoc.path"` - the path of your private leaderboard. This should be something like `/<year>/leaderboard/private/view/<id>`.
- `"aoc.token"` - a valid session token (you can get this from your browser's local storage.

Then run `yarn && GOOGLE_CLOUD_PROJECT=<firebase-project-id> make` to deploy
