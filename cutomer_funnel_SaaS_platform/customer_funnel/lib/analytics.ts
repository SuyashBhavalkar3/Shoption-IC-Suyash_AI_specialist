import { Product, CartItem, Order, OrderItem } from './types';

/**
 * Analytics Tracking Interface
 * This is currently a mock placeholder module. Future analytics script tags or SaaS tracking SDKs (e.g. Google Analytics, Mixpanel, custom tracking scripts) can hook into these handlers.
 */

export function trackProductView(product: Product) {
  console.group('📊 Analytics Event: Product View');
  console.log('Product ID:', product.id);
  console.log('Product Name:', product.name);
  console.log('Category:', product.category);
  console.log('Price:', product.price);
  console.log('Full Product Object:', product);
  console.groupEnd();
  
  // Future implementation, e.g.:
  // window.analytics?.track('Product Viewed', { id: product.id, name: product.name, ... });
}

export function trackAddToCart(product: Product, quantity: number) {
  console.group('📊 Analytics Event: Add To Cart');
  console.log('Product ID:', product.id);
  console.log('Product Name:', product.name);
  console.log('Quantity:', quantity);
  console.log('Value:', product.price * quantity);
  console.log('Full Product Object:', product);
  console.groupEnd();

  // Future implementation, e.g.:
  // window.analytics?.track('Product Added', { id: product.id, name: product.name, quantity, ... });
}

export function trackCheckoutStarted(cartItems: CartItem[]) {
  console.group('📊 Analytics Event: Checkout Started');
  console.log('Cart Items Count:', cartItems.length);
  console.log('Total Cart Value:', cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0));
  console.log('Cart Details:', cartItems);
  console.groupEnd();

  // Future implementation, e.g.:
  // window.analytics?.track('Checkout Started', { items: cartItems });
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

  // Future implementation, e.g.:
  // window.analytics?.track('Order Completed', { orderId: order.id, total: order.total_amount, ... });
}
