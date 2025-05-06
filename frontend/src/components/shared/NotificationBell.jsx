// src/components/shared/NotificationBell.jsx
import { useState } from "react";


export default function NotificationBell() {
  const [count] = useState(3); // mockado

  return (
    <div className="notification-wrapper" title="Notificações">
      <i className="fas fa-bell notification-icon"></i>
      {count > 0 && <span className="notification-badge">{count}</span>}
    </div>
  );
}
