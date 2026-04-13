/*
  File name: Notifications.tsx

  Description: This component represents a simple notifications panel that can be opened from the dashboard. It currently displays placeholder notifications and includes a close button.

  Author(s): Connor Anderson
*/

type Props = {
  onClose?: () => void;
};

export default function Notifications({ onClose }: Props) {
  const items = [
    "No new notifications.",
    "Sam liked your post (placeholder).",
    "Reminder: complete your profile (placeholder).",
  ];

  return (
    <div style={{ padding: 16, minWidth: 320 }}>
      <h2 style={{ marginTop: 0 }}>Notifications</h2>
      <ul style={{ paddingLeft: 18 }}>
        {items.map((t, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {t}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => onClose?.()} className="dash-btn">
          Close
        </button>
      </div>
    </div>
  );
}
