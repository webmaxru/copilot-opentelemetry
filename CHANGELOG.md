# Changelog

## v1.0.0 - 2026-08-17

The first supported release of the GitHub Copilot OpenTelemetry demo aligns the runnable collectors,
dashboards, documentation, and presentation with the August 2026 telemetry contracts.

### Highlights

- Adds a prompt-cache **token** hit-rate KPI while separating cache call counts from cache token volume.
- Uses the documented `github.copilot.aiu` field and keeps an explicit fallback for older
  `github.copilot.nano_aiu` telemetry.
- Sums current cost and AI credits from provider-call (`chat`) spans and fixes VS Code agent grouping.
- Enables Application Insights export for non-exception span events, including truncation and
  compaction events used by the cache-cause dashboard.
- Extends the Azure Container Apps strict profile to scrub current skill-event metadata and
  content-capture-only compaction messages before Application Insights storage.
- Publishes the 20-minute presentation and a separate synchronized second-monitor presenter view.

### Upgrade notes

1. Redeploy either Azure collector configuration so `spaneventsenabled: true` takes effect.
2. Re-import dashboard version 3 from `dashboards/tempo/` or `dashboards/appinsights/`.
3. Keep content capture off unless the destination is trusted. Option C minimizes telemetry at the
   Azure-hosted collector; only option B scrubs before telemetry leaves the developer machine.

### Coverage limits

- JetBrains exports OpenTelemetry, but its default `service.name` remains unverified by this project.
- Visual Studio has no documented customer export path.
- The cloud coding agent exposes client-side session/outcome metrics, not its server-side execution trace.
