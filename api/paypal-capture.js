export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID } = req.body;

  try {
    // 1. الحصول على التوكن
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

    // 2. تأكيد سحب المبلغ
    const captureRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    if (!captureRes.ok) throw new Error('Failed to capture PayPal order');
    const captureData = await captureRes.json();
    
    return res.status(200).json(captureData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}