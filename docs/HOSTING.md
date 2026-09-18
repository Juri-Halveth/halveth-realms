# Server and deployment choices

The delivered service is running on one computer at `127.0.0.1:18770`. It is not an internet deployment. Ten guest slots are implemented and tested; they do not imply capacity for ten simultaneous rendered clients on every machine or a production load test.

## Local play

Use `START.cmd` or `node scripts/launch.mjs`. All rendering resources are local. Separate browser sessions on the same server can share the world. Guest access permits bounded gameplay actions; it does not expose operating-system administration.

## Private-network prototype

An operator can choose `REALMS_HOST` and `REALMS_PORT` explicitly, then start `node server.mjs`. For example a private-network address can make the prototype reachable on that operator-controlled interface. No firewall, router or host settings are changed by this project. The existing guest scheme identifies sessions, not verified human accounts. Conversations and world changes are shared world data.

## Public hosted edition

Choose an actual host and domain before deployment. A public paid edition needs a concrete TLS/reverse-proxy setup, appropriate account/room controls, request limits, moderation, monitoring, backups and measured capacity. These operational services are roadmap work, rather than hidden claims in a successful local start.

GitHub can host the repository and run its prepared workflows. This Node server needs a process host; uploading source to GitHub or a static Pages site alone does not run it. A future static single-player adapter is a separate implementation option.

## Evolving content

The checked-in `content-proposals.yml` is prepared for a daily GitHub run at 03:17 UTC after the workflow is published/enabled on the repository's default branch. It tests the source and generates dated, reproducible story proposals as downloadable artifacts. It has read-only repository permissions and does not commit, merge, deploy or charge for content. No workflow run has been claimed merely because the YAML exists.

Offline, `npm run evolve -- "your world phrase"` performs the same local generation. Runtime communities evolve only while the local server is running. Source-code improvements remain ordinary tested development work.
