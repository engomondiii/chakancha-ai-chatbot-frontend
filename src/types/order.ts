/**
 * Order types
 */

export type OrderStatus = 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
  firstName:  string;
  lastName:   string;
  email:      string;
  phone?:     string;
  address1:   string;
  address2?:  string;
  city:       string;
  state?:     string;
  postalCode: string;
  country:    string;
  notes?:     string;
}

export interface OrderItem {
  id:       string;
  name:     string;
  price:    number;
  quantity: number;
  image?:   string;
  category?: string;
}

export interface Order {
  id:                string;
  status:            OrderStatus;
  paymentStatus:     PaymentStatus;
  createdAt:         string;
  estimatedDelivery: string;
  items:             OrderItem[];
  total:             number;
  currency:          string;
  shipping:          ShippingAddress;
  trackingUrl?:      string;
  trackingNumber?:   string;
}

export interface TrackingEvent {
  time:        string;
  description: string;
  location:    string;
}

export interface OrderTracking {
  orderId:        string;
  status:         string;
  carrier:        string;
  trackingNumber: string;
  events:         TrackingEvent[];
}