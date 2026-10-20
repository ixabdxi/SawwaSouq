/* ============================================================
   SaWWA Souq — Customer Notifications (Bell)
   ============================================================ */
window.Notifications = (() => {
  const KEY = "sawwa_customer_notifications";
  const SEEN = "sawwa_notifications_seen";

  // اقرأ إشعارات الأدمن + إشعارات محلية
  const all = () => {
    const adminList = JSON.parse(localStorage.getItem("sawwa_notifications") || "[]");
    const localList = JSON.parse(localStorage.getItem(KEY) || "[]");
    return [...localList, ...adminList].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  const add = (title, body) => {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    list.unshift({
      id: "notif-" + Date.now().toString(36),
      title, body,
      createdAt: Date.now()
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
    window.dispatchEvent(new Event("notifications-change"));
  };

  const lastSeen = () => parseInt(localStorage.getItem(SEEN) || "0", 10);
  const unreadCount = () => all().filter((n) => (n.createdAt || 0) > lastSeen()).length;
  const markAllRead = () => {
    localStorage.setItem(SEEN, String(Date.now()));
    window.dispatchEvent(new Event("notifications-change"));
  };

  return { all, add, unreadCount, markAllRead };
})();