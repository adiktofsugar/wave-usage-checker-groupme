Wave data usage checker
===
I keep going over my limit and they have no emails that actually send...so...

Script purposes
---
The download.js script
- logs in to wave
- finds the img tags by doing some pretty basic website checking
- downloads the images into cwd/images

The groupme-post script
- uploads the images to an s3 bucket
- posts to groupme using an access token, so only the app creator can post

The index.js script
- defines the cli, gets the information from the creds json file, and feeds it into the other scripts in that order

Installation
---

TL;DR: `npm run pcp; npm run pload`
Should run every day at noon.

Designed as an Apple plist User Agent (http://launchd.info/), which means it should be installed and loaded.

- Install `npm run pcp`
    Generates a file based on TEMPLATE.plist and copies it to the ~/Library/LaunchAgents directory
- Load    `npm run pload`
    Links it up with launchd, so that it'll run on schedule
- Unload  `npm run punload`
    Removes from launchd. Will no longer automatically run

More obscure commands:

- Run     `npm run pstart`
    Immediately runs from launchd. useful for testing
- Info    `npm run pinfo`
    Status within launchd
- Delete  `npm run prm`
    Deletes the plist file

