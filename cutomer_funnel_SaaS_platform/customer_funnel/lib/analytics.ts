import { Product, CartItem, Order, OrderItem } from './types';

const API_KEY = process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || "YOUR_API_KEY";

/**
 * Sends tracking data to the external SaaS analytics service.
 */
export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  let userId = 'guest_user';
  try {
    const { createClient } = require('./supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch (e) {
    // Suppress session check error during static generation or server-side execution
  }

  // Allow passing custom or overriding user ID
  if (properties.user_id) {
    userId = properties.user_id;
    delete properties.user_id;
  }

  try {
    const response = await fetch(
      "https://customer-funnel-production.up.railway.app/api/events/track",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: API_KEY,
          user_id: userId,
          event_name: eventName,
          properties
        })
      }
    );
    if (!response.ok) {
      console.warn(`SaaS Analytics event tracking failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending analytics event:", error);
  }
}

export function trackProductView(product: Product) {
  console.group('📊 Analytics Event: Product View');
  console.log('Product ID:', product.id);
  console.log('Product Name:', product.name);
  console.log('Category:', product.category);
  console.log('Price:', product.price);
  console.log('Full Product Object:', product);
  console.groupEnd();
  
  trackEvent("product_view", {
    product_id: product.id,
    category: product.category,
    product_name: product.name,
    price: product.price
  });
}

export function trackAddToCart(product: Product, quantity: number) {
  console.group('📊 Analytics Event: Add To Cart');
  console.log('Product ID:', product.id);
  console.log('Product Name:', product.name);
  console.log('Quantity:', quantity);
  console.log('Value:', product.price * quantity);
  console.log('Full Product Object:', product);
  console.groupEnd();

  trackEvent("add_to_cart", {
    product_id: product.id,
    price: product.price,
    quantity: quantity
  });
}

export function trackCheckoutStarted(cartItems: CartItem[]) {
  console.group('📊 Analytics Event: Checkout Started');
  console.log('Cart Items Count:', cartItems.length);
  console.log('Total Cart Value:', cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0));
  console.log('Cart Details:', cartItems);
  console.groupEnd();

  trackEvent("checkout_started", {
    cart_items_count: cartItems.length,
    total_value: cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0)
  });
}

export function trackPurchase(order: Order, orderItems: OrderItem[]) {
  console.group('📊 Analytics Event: Purchase Completed');
  console.log('Order ID:', order.id);
  console.log('Total Amount:', order.total_amount);
  console.log('Shipping Details:', {
    name: order.shipping_name,
    city: order.shipping_city,
    state: order.shipping_state,
    postalCode: order.shipping_postal_code,
  });
  console.log('Items purchased:', orderItems);
  console.groupEnd();

  trackEvent("purchase", {
    order_id: order.id,
    revenue: order.total_amount,
    user_id: order.user_id // Pass explicitly so it updates tracking session correctly
  });
}

