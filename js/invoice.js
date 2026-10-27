window.Invoice = (() => {
  const generatePDF = (order) => {
    if (!order || !order.items) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // الخلفية
    ctx.fillStyle = "#F8F6F0";
    ctx.fillRect(0, 0, 800, 1000);

    // الهيدر
    ctx.fillStyle = "#0A3D38";
    ctx.fillRect(0, 0, 800, 120);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px 'Baloo Bhaijaan 2', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("سوّا سوق (SaWWA Souq)", 760, 60);
    ctx.font = "16px 'Baloo Bhaijaan 2', sans-serif";
    ctx.fillText("فاتورة طلب - Order Invoice", 760, 90);

    // معلومات الطلب
    ctx.fillStyle = "#0A3D38";
    ctx.textAlign = "left";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`Order ID: ${order.id}`, 40, 160);
    ctx.font = "16px sans-serif";
    ctx.fillText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 40, 190);
    ctx.fillText(`Customer: ${order.name}`, 40, 220);
    ctx.fillText(`Phone: ${order.phone}`, 40, 250);
    ctx.fillText(`City: ${order.city}`, 40, 280);

    // جدول المنتجات
    let startY = 340;
    ctx.fillStyle = "#0A3D38";
    ctx.fillRect(40, startY, 720, 40);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("الصنف (Item)", 700, startY + 26);
    ctx.textAlign = "center";
    ctx.fillText("الكمية (Qty)", 400, startY + 26);
    ctx.textAlign = "left";
    ctx.fillText("السعر (Price)", 80, startY + 26);

    let currentY = startY + 40;
    ctx.fillStyle = "#0A3D38";
    ctx.font = "16px sans-serif";
    
    order.items.forEach(item => {
      ctx.fillStyle = "#0A3D38";
      ctx.textAlign = "right";
      ctx.fillText(item.nameAr || item.nameEn, 700, currentY + 26);
      ctx.textAlign = "center";
      ctx.fillText(item.qty.toString(), 400, currentY + 26);
      ctx.textAlign = "left";
      ctx.fillText(`${(item.price * item.qty / 100).toFixed(2)} JOD`, 80, currentY + 26);
      
      ctx.strokeStyle = "#E5E0D5";
      ctx.beginPath();
      ctx.moveTo(40, currentY + 40);
      ctx.lineTo(760, currentY + 40);
      ctx.stroke();
      
      currentY += 40;
    });

    // المجاميع
    currentY += 20;
    ctx.fillStyle = "#0A3D38";
    ctx.textAlign = "right";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`Subtotal: ${(order.subtotal / 100).toFixed(2)} JOD`, 700, currentY);
    ctx.fillText(`Shipping: ${(order.shipping / 100).toFixed(2)} JOD`, 700, currentY + 30);
    if (order.discount > 0) {
      ctx.fillStyle = "#C03030";
      ctx.fillText(`Discount: -${(order.discount / 100).toFixed(2)} JOD`, 700, currentY + 60);
      currentY += 30;
    }
    
    currentY += 60;
    ctx.fillStyle = "#0A3D38";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`Total: ${(order.total / 100).toFixed(2)} JOD`, 700, currentY);

    // التذييل
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#557570";
    ctx.fillText("شكراً لتسوقكم معنا! - Thank you for shopping with us!", 400, 900);
    ctx.fillText("WhatsApp: +962 79 125 2004 | sawwasouq.com", 400, 930);

    // تحميل الصورة
    const link = document.createElement('a');
    link.download = `Invoice-${order.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return { generatePDF };
})();
