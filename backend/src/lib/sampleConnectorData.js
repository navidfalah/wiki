'use strict';
module.exports = {
  "FIELD_DEVICES": [
    [
      1,
      "AUR-SNS-0142",
      "Nova Widget v2",
      "Portland Watershed Site 3",
      "online",
      "2026-08-29"
    ],
    [
      2,
      "AUR-SNS-0143",
      "Nova Widget v2",
      "Portland Watershed Site 3",
      "online",
      "2026-08-29"
    ],
    [
      3,
      "AUR-SNS-0087",
      "Nova Widget",
      "Tillamook Coastal Array",
      "offline",
      "2026-07-11"
    ],
    [
      4,
      "AUR-SNS-0201",
      "Nova Widget v2",
      "Willamette Valley Farm Co-op",
      "online",
      "2026-09-02"
    ],
    [
      5,
      "AUR-SNS-0055",
      "Nova Widget",
      "Tillamook Coastal Array",
      "degraded",
      "2026-08-15"
    ],
    [
      6,
      "AUR-SNS-0210",
      "Nova Widget v2",
      "Willamette Valley Farm Co-op",
      "online",
      "2026-09-02"
    ]
  ],
  "SUPPORT_TICKETS": [
    [
      1,
      "AUR-SNS-0087",
      "open",
      "high",
      "Device offline since firmware 0.3.9 rollout",
      "Field tech reports AUR-SNS-0087 stopped reporting after the 0.3.9 OTA push. Battery reads full; suspect relay-mode radio regression flagged in the beta invite thread.",
      "2026-07-11"
    ],
    [
      2,
      "AUR-SNS-0055",
      "in_progress",
      "medium",
      "Intermittent battery drain, faster than spec",
      "Customer measured ~30% faster battery drain than spec once relay mode is enabled, matching the known relay-mode issue. Recommended disabling relay mode as a workaround pending firmware fix.",
      "2026-08-15"
    ],
    [
      3,
      "AUR-SNS-0142",
      "resolved",
      "low",
      "Requested historical sensor export",
      "Watershed Site 3 team requested a CSV export of the last quarter's readings for a grant report. Resolved by pointing them at the /resources export.",
      "2026-08-20"
    ],
    [
      4,
      "AUR-SNS-0201",
      "open",
      "medium",
      "Mesh reformation after co-op network change",
      "Farm co-op re-cabled their gateway; mesh took ~40 minutes to reform instead of the usual ~5. Investigating whether the new gateway's channel overlaps neighboring nodes.",
      "2026-09-02"
    ],
    [
      5,
      "AUR-SNS-0210",
      "closed",
      "low",
      "False-positive low-battery alert",
      "Alert fired at 22% charge instead of the configured 15% threshold. Traced to a firmware rounding bug already fixed in 0.3.9; customer confirmed resolved after OTA update.",
      "2026-09-03"
    ]
  ]
};
