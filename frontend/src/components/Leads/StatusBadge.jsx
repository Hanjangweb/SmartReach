const STATUS_CONFIG = {
  New: { cls: 'badge-new', label: 'New' },
  Contacted: { cls: 'badge-contacted', label: 'Contacted' },
  Negotiation: { cls: 'badge-negotiation', label: 'Negotiation' },
  SiteVisit: { cls: 'badge-sitevisit', label: 'Site Visit' },
  Closed: { cls: 'badge-closed', label: 'Closed ✓' },
  Lost: { cls: 'badge-lost', label: 'Lost' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { cls: 'badge-new', label: status };
  return <span className={`badge ${config.cls}`}>{config.label}</span>;
}

export function ScoreBadge({ score }) {
  const SCORE_CONFIG = {
    Hot: { cls: 'badge score-hot', label: '🔥 Hot' },
    Warm: { cls: 'badge score-warm', label: '🌤️ Warm' },
    Cold: { cls: 'badge score-cold', label: '❄️ Cold' },
    Unscored: { cls: 'badge score-unscored', label: '— Unscored' },
  };
  const config = SCORE_CONFIG[score] || SCORE_CONFIG.Unscored;
  return <span className={config.cls}>{config.label}</span>;
}
