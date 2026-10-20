/* ============================================================
   SaWWA Souq — Order Tracking Timeline
   ============================================================ */
window.Tracking = (() => {
  const STEPS = [
    { key: "PENDING",    ar: "تم استلام الطلب",       en: "Order received" },
    { key: "CONFIRMED",  ar: "تم تأكيد الطلب",         en: "Order confirmed" },
    { key: "SHIPPED",    ar: "تم الشحن",               en: "Shipped" },
    { key: "DELIVERED",  ar: "تم التسليم",             en: "Delivered" }
  ];

  const statusIndex = (status) => {
    if (status === "CANCELLED") return -1;
    const i = STEPS.findIndex((s) => s.key === status);
    return i < 0 ? 0 : i;
  };

  const timeline = (order, lang = "ar") => {
    const idx = statusIndex(order.status);
    const cancelled = order.status === "CANCELLED";
    return STEPS.map((s, i) => ({
      label: lang === "ar" ? s.ar : s.en,
      done: !cancelled && i <= idx,
      current: !cancelled && i === idx,
      cancelled
    }));
  };

  return { STEPS, timeline, statusIndex };
})();