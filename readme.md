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

plist
---
Designed as an User Agent, which means it should be installed to `~/Library/LaunchAgents`
`cp local.wave-usage.plist ~/Library/LaunchAgents/`
`launchctl load ~/Library/LaunchAgents/local.wave-usage.plist`
Should run every day at noon.
To run immediately, do `launchctl start local.wave-usage`
To get info, do `launchctl info local.wave-usage`
To unload it, `launchctl unload ~/Library/LaunchAgents/local.wave-usage.plist`
