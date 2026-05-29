import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';
import i18next from 'i18next';
import '../config/i18n';
import { configEnvs } from '@/config/env';
import { IOrder } from '@/models/IOrder';
import { IUser } from '@/models/IUser';

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: configEnvs.SMTP_SERVICE,
  auth: {
    user: configEnvs.SMTP_USER,
    pass: configEnvs.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  const mailOptions: SendMailOptions = {
    from: configEnvs.SMTP_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

export async function sendVerificationEmail(
  email: string,
  token: string,
  language: string = 'en',
  userName: string = 'there',
) {
  const url = `${configEnvs.FRONTEND_URL}/auth/verifyRegister/${token}`;
  const subject = i18next.t('verifySubject', { ns: 'emails', lng: language });
  const body = i18next
    .t('verifyBody', {
      ns: 'emails',
      lng: language,
      userName,
      link: url,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: email,
    subject,
    html: `<div>${body}</div>`,
  });
}

/**
 * Sends an order placed email to the customer.
 * @param user The user object (customer).
 * @param order The order object.
 * @param language The preferred language for the email.
 */
export async function sendOrderPlacedEmail(user: IUser, order: IOrder, language: string = 'en') {
  const userName = user.firstName || user.username || 'there';
  const subject = i18next.t('orderPlacedSubject', {
    ns: 'emails',
    lng: language,
    orderId: order._id,
  });

  const orderSummaryHtml = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Shop</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${(item.productId as any).name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${(item.shopId as any).name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${(item.priceAtPurchase / 100).toFixed(2)} RON</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `;

  const deliveryAddress = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.county}, ${order.deliveryAddress.zipcode}`;
  const totalAmount = `${(order.totalAmount / 100).toFixed(2)} RON`;

  const body = i18next
    .t('orderPlacedBody', {
      ns: 'emails',
      lng: language,
      userName,
      orderId: order._id,
      orderSummaryHtml,
      totalAmount,
      paymentMethod: order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card',
      deliveryAddress,
      // estimatedDelivery: '2-3 business days' // Placeholder for now
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}

/**
 * Sends an order confirmed email to the customer.
 * @param user The user object (customer).
 * @param order The order object.
 * @param language The preferred language for the email.
 */
export async function sendOrderConfirmedEmail(user: IUser, order: IOrder, language: string = 'en') {
  const userName = user.firstName || user.username || 'there';
  const subject = i18next.t('orderConfirmedSubject', {
    ns: 'emails',
    lng: language,
    orderId: order._id,
  });
  const body = i18next
    .t('orderConfirmedBody', { ns: 'emails', lng: language, userName, orderId: order._id })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}

/**
 * Sends an order shipped email to the customer.
 * @param user The user object (customer).
 * @param order The order object.
 * @param language The preferred language for the email.
 * @param trackingLink The tracking link for the order (optional).
 */
export async function sendOrderShippedEmail(
  user: IUser,
  order: IOrder,
  language: string = 'en',
  trackingLink: string = '#',
) {
  const userName = user.firstName || user.username || 'there';
  const subject = i18next.t('orderShippedSubject', {
    ns: 'emails',
    lng: language,
    orderId: order._id,
  });
  const body = i18next
    .t('orderShippedBody', {
      ns: 'emails',
      lng: language,
      userName,
      orderId: order._id,
      trackingLink,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}

// Placeholder for sendOrderDeliveredEmail and sendOrderCancelledEmail
// These will be implemented when Feature 07 (Reviews) is integrated and cancellation reasons are defined.

export async function sendOrderDeliveredEmail(user: IUser, order: IOrder, language: string = 'en') {
  const userName = user.firstName || user.username || 'there';
  const subject = i18next.t('orderDeliveredSubject', {
    ns: 'emails',
    lng: language,
    orderId: order._id,
  });

  const uniqueShops = new Map();
  order.items.forEach((item: any) => {
    const shop = item.shopId;
    if (shop && !uniqueShops.has(shop._id.toString())) {
      uniqueShops.set(shop._id.toString(), shop);
    }
  });

  const reviewLinksHtml = `
    <p>Thank you for your purchase! Please consider leaving a review for the products and shops:</p>
    <h3>Products:</h3>
    <ul>${order.items.map((item) => `<li><a href="${configEnvs.FRONTEND_URL}/products/${(item.productId as any).slug}">Review ${(item.productId as any).name}</a></li>`).join('')}</ul>
    
    <h3>Shops:</h3>
    <ul>${Array.from(uniqueShops.values())
      .map(
        (shop: any) =>
          `<li><a href="${configEnvs.FRONTEND_URL}/shops/${shop.slug}">Review ${shop.name}</a></li>`,
      )
      .join('')}</ul>
  `;

  const body = i18next
    .t('orderDeliveredBody', {
      ns: 'emails',
      lng: language,
      userName,
      orderId: order._id,
      reviewLinksHtml,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}

export async function sendOrderCancelledEmail(
  user: IUser,
  order: IOrder,
  language: string = 'en',
  cancellationReason: string = 'N/A',
) {
  const userName = user.firstName || user.username || 'there';
  const subject = i18next.t('orderCancelledSubject', {
    ns: 'emails',
    lng: language,
    orderId: order._id,
  });

  let refundStatusHtml = '';
  if (order.paymentMethod === 'stripe' && order.paymentStatus === 'refunded') {
    refundStatusHtml = i18next.t('orderCancelledRefundedStatus', { ns: 'emails', lng: language });
  } else if (order.paymentMethod === 'stripe' && order.paymentStatus !== 'refunded') {
    refundStatusHtml = i18next.t('orderCancelledRefundPendingStatus', {
      ns: 'emails',
      lng: language,
    });
  }

  const body = i18next
    .t('orderCancelledBody', {
      ns: 'emails',
      lng: language,
      userName,
      orderId: order._id,
      cancellationReason,
      refundStatusHtml,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  language: string = 'en',
  userName: string = 'there',
) {
  const url = `${configEnvs.PASSWORD_RESET_URL}/${token}`;
  const subject = i18next.t('resetPasswordSubject', { ns: 'emails', lng: language });
  const body = i18next
    .t('resetPasswordBody', {
      ns: 'emails',
      lng: language,
      userName,
      link: url,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: email,
    subject,
    html: `<div>${body}</div>`,
  });
}

/**
 * Sends a low stock alert to a shop owner. (Feature 09)
 */
export async function sendLowStockAlert(user: IUser, product: any) {
  const language =
    typeof (user.userSettings as any)?.preferredLanguage === 'string'
      ? (user.userSettings as any).preferredLanguage
      : 'en';
  const subject = `Low Stock Alert: ${product.name}`;

  const body = `
    Hello ${user.firstName || 'Owner'},<br/><br/>
    The stock for your product <b>${product.name}</b> has reached the threshold.<br/>
    Current stock: <b>${product.stock}</b><br/>
    Threshold: <b>${product.lowStockThreshold}</b><br/><br/>
    Please restock soon to keep it available for customers.
  `;

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: user.email,
    subject,
    html: `<div>${body}</div>`,
  });
}
