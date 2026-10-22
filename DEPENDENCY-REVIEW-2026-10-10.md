# Dependency review — 2026-10-10

GitHub initially showed two open alerts in the root package lock: one high alert for http-cache-semantics and one moderate alert for sprintf-js.

A non-forced npm audit fix updated the lockfile and removed the high http-cache-semantics finding. The remaining sprintf-js advisory has no patched release in the selected upstream chain. npm suggests forcing electron-builder down from 26.15.3 to 26.5.0; that downgrade was not accepted without compatibility evidence.

The candidate npm audit reports 8 moderate findings across the affected transitive chain. No major downgrade or application-source change was made. Weekly Dependabot updates are enabled for npm and GitHub Actions. Recheck the advisory when electron-builder or its packaging dependency chain ships a maintained fix.