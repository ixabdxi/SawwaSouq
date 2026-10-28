export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, couponCode, usePoints, city } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // حساب المجموع من السيرفر لتجنب التلاعب بالأسعار من المتصفح
  let subtotal = items.reduce((acc, item) => {
    const price = parseInt(item.price, 10) || 0;
    const qty = parseInt(item.qty, 10) || 1;
    return acc + (price * qty);
  }, 0);

  // افتراضي 3 دنانير شحن، يجب تعديلها حسب المدينة لو حبيت
  let shipping = 300; 
  let discount = 0;

  if (couponCode === "SAWWA10") discount += Math.round(subtotal * 0.1);
  if (usePoints) discount += Math.min(subtotal, 100); 

  let totalJOD = Math.max(0, subtotal + shipping - discount);
  
  // سعر الصرف (يمكن جلبه من API خارجي لاحقاً)
  const exchangeRate = 1.41;
  const totalUSD = ((totalJOD / 100) * exchangeRate).toFixed(2);

  try {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: { 
        Authorization: `Basic ${auth}`, 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenRes.ok) throw new Error('Failed to get PayPal token');
    const tokenData = await tokenRes.json();

    const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { 
            currency_code: 'USD', 
            value: totalUSD 
          }
        }]
      })
    });
    
    if (!orderRes.ok) throw new Error('Failed to create PayPal order');
    const orderData = await orderRes.json();
    
    return res.status(200).json(orderData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
