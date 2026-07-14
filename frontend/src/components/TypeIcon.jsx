import { Camera, CreditCard, Shield, Radar } from "lucide-react";

const icons = {
  CAMERA: <Camera size={18} />,
  CARD_READER: <CreditCard size={18} />,
  ALARM_PANEL: <Shield size={18} />,
  MOTION_SENSOR: <Radar size={18} />
};

export default function TypeIcon({ type }) {
  const typeClass = type ? type.toLowerCase().replaceAll("_", "-") : "";
  return (
    <span className={`type-icon ${typeClass}`}>
      {icons[type] || <Shield size={18} />}
    </span>
  );
}
