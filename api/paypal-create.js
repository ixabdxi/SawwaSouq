export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { totalJOD } = req.body;
  
  // باي بال لا يدعم الدينار الأردني، نقوم بتحويل المبلغ للدولار
  const totalUSD = ((totalJOD / 100) * 1.41).toFixed(2);

  try {
    // 1. الحصول على التوكن من باي بال
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

    // 2. إنشاء الطلب
    const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: totalUSD }
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