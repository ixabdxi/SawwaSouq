window.I18N = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.cart": "السلة",
    "nav.account": "حسابي",
    "nav.about": "من نحن",
    "nav.admin": "الأدمن",
    "hero.tagline": "جودة تستحقّها، بسعر يناسبك.",
    "hero.cta": "تسوّق الآن",
    "home.featured": "الأكثر رواجًا",
    "home.rubber": "ماوس باد مطاطي",
    "home.glass": "ماوس باد زجاجي",
    "features.shipping": "شحن 3 دنانير لكل الأردن",
    "features.cod": "الدفع عند الاستلام",
    "features.cliq": "دفع Cliq",
    "features.warranty": "ضمان الجودة",
    "product.addToCart": "أضف إلى السلة",
    "product.buyNow": "اشترِ الآن",
    "product.outOfStock": "نفد المخزون",
    "product.reviews": "المراجعات",
    "product.submitReview": "أرسل المراجعة",
    "cart.title": "سلة التسوق",
    "cart.empty": "سلتك فارغة",
    "cart.subtotal": "المجموع",
    "cart.shipping": "الشحن",
    "cart.total": "الإجمالي",
    "cart.checkout": "إتمام الشراء",
    "cart.remove": "إزالة",
    "checkout.title": "إتمام الشراء",
    "checkout.name": "الاسم الكامل",
    "checkout.email": "البريد الإلكتروني",
    "checkout.phone": "رقم الهاتف",
    "checkout.city": "المدينة",
    "checkout.address": "العنوان التفصيلي",
    "checkout.notes": "ملاحظات (اختياري)",
    "checkout.payment": "طريقة الدفع",
    "checkout.cod": "الدفع عند الاستلام",
    "checkout.cliq": "دفع Cliq",
    "checkout.cliqId": "معرّف Cliq",
    "checkout.cliqInstructions": "حوّل المبلغ إلى المعرّف ثم ارفع صورة الإشعار.",
    "checkout.proof": "صورة إشعار التحويل",
    "checkout.placeOrder": "تأكيد الطلب",
    "checkout.points": "استخدم نقاطك",
    "checkout.pointsHint": "100 نقطة = 1 دينار خصم",
    "account.title": "حسابي",
    "account.orders": "طلباتي",
    "account.points": "نقاطي",
    "account.noOrders": "لا توجد طلبات بعد",
    "footer.contact": "تواصل",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.policy": "سياسة الاستبدال والضمان"
  },
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.cart": "Cart",
    "nav.account": "Account",
    "nav.about": "About",
    "nav.admin": "Admin",
    "hero.tagline": "Quality you deserve, price you love.",
    "hero.cta": "Shop now",
    "home.featured": "Featured",
    "home.rubber": "Rubber mousepads",
    "home.glass": "Glass mousepads",
    "features.shipping": "3 JOD flat shipping across Jordan",
    "features.cod": "Cash on delivery",
    "features.cliq": "Cliq payment",
    "features.warranty": "Quality guarantee",
    "product.addToCart": "Add to cart",
    "product.buyNow": "Buy now",
    "product.outOfStock": "Out of stock",
    "product.reviews": "Reviews",
    "product.submitReview": "Submit review",
    "cart.title": "Shopping cart",
    "cart.empty": "Your cart is empty",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.remove": "Remove",
    "checkout.title": "Checkout",
    "checkout.name": "Full name",
    "checkout.email": "Email",
    "checkout.phone": "Phone",
    "checkout.city": "City",
    "checkout.address": "Detailed address",
    "checkout.notes": "Notes (optional)",
    "checkout.payment": "Payment method",
    "checkout.cod": "Cash on delivery",
    "checkout.cliq": "Cliq payment",
    "checkout.cliqId": "Cliq ID",
    "checkout.cliqInstructions": "Send the amount to the ID below, then upload the receipt.",
    "checkout.proof": "Receipt screenshot",
    "checkout.placeOrder": "Place order",
    "checkout.points": "Use your points",
    "checkout.pointsHint": "100 points = 1 JOD discount",
    "account.title": "My account",
    "account.orders": "My orders",
    "account.points": "My points",
    "account.noOrders": "No orders yet",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved",
    "footer.policy": "Return & warranty policy"
  }
};

window.t = (key) => {
  const lang = window.SAWWA.lang || "ar";
  return (window.I18N[lang] && window.I18N[lang][key]) || key;
};

window.setLang = (lang) => {
  localStorage.setItem("sawwa_lang", lang);
  window.SAWWA.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("lang-en", lang === "en");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = window.t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = window.t(el.dataset.i18nPh);
  });
};