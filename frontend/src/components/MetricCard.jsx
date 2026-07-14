import { CheckCircle2 } from "lucide-react";

export default function MetricCard({ icon, label, value, status, active, onClick, title }) {
  return (
    <article
      className={`metric-card${onClick ? " clickable" : ""}${active ? " active" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? active : undefined}
      title={title}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className={`metric-icon ${status ? status.toLowerCase() : ""}`}>
        {icon || <CheckCircle2 size={20} />}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
