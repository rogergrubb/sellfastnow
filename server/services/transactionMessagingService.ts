// Automated Transaction Messaging Service
// Sends automatic messages when transaction status changes

import { db } from "../db";
import { messages } from "../../shared/schema";
import { getWebSocketService } from "./websocketService";

export class TransactionMessagingService {
  /**
   * Send automated message for transaction event
   */
  private static async sendAutomatedMessage(
    listingId: string,
    senderId: string,
    receiverId: string,
    content: string
  ) {
    try {
      const [newMessage] = await db.insert(messages).values({
        listingId,
        senderId,
        receiverId,
        content,
        isRead: false,
      }).returning();

      // Broadcast via WebSocket
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastMessage(newMessage);
      }

      console.log('🤖 Automated transaction message sent:', { listingId, content: content.substring(0, 50) });
      return newMessage;
    } catch (error) {
      console.error('Error sending automated transaction message:', error);
      throw error;
    }
  }

  /**
   * Notify when deposit is submitted
   */
  static async notifyDepositSubmitted(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number
  ) {
    const content = `🎉 Great news! A deposit of $${amount.toFixed(2)} has been submitted for this item. The seller will review and accept or decline the offer. Transaction ID: ${transactionId}`;
    
    // Send to seller
    await this.sendAutomatedMessage(
      listingId,
      buyerId, // From buyer
      sellerId, // To seller
      content
    );
  }

  /**
   * Notify when seller accepts deposit
   */
  static async notifyDepositAccepted(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number
  ) {
    const contentToBuyer = `✅ The seller has accepted your deposit of $${amount.toFixed(2)}! You can now arrange to complete the transaction. Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller
      buyerId, // To buyer
      contentToBuyer
    );
  }

  /**
   * Notify when seller rejects deposit
   */
  static async notifyDepositRejected(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    reason?: string
  ) {
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const contentToBuyer = `❌ The seller has declined your deposit of $${amount.toFixed(2)}.${reasonText} Your deposit will be refunded. Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller
      buyerId, // To buyer
      contentToBuyer
    );
  }

  /**
   * Notify when transaction is completed
   */
  static async notifyTransactionCompleted(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number
  ) {
    const contentToBuyer = `🎊 Transaction completed! The full payment of $${amount.toFixed(2)} has been released to the seller. Thank you for using SellFast.now! Transaction ID: ${transactionId}`;
    const contentToSeller = `💰 Payment received! The buyer has confirmed the transaction and $${amount.toFixed(2)} has been transferred to your account. Transaction ID: ${transactionId}`;
    
    // Send to both parties
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller
      buyerId, // To buyer
      contentToBuyer
    );

    await this.sendAutomatedMessage(
      listingId,
      buyerId, // From buyer
      sellerId, // To seller
      contentToSeller
    );
  }

  /**
   * Notify when transaction is refunded
   */
  static async notifyTransactionRefunded(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    reason?: string
  ) {
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const contentToBuyer = `💵 Your deposit of $${amount.toFixed(2)} has been refunded.${reasonText} Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller
      buyerId, // To buyer
      contentToBuyer
    );
  }

  /**
   * Notify when transaction is disputed
   */
  static async notifyTransactionDisputed(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    disputedBy: 'buyer' | 'seller',
    reason: string
  ) {
    const otherParty = disputedBy === 'buyer' ? sellerId : buyerId;
    const disputedByParty = disputedBy === 'buyer' ? buyerId : sellerId;
    
    const content = `⚠️ A dispute has been raised for this transaction. Reason: ${reason}. Our support team will review and contact both parties. Transaction ID: ${transactionId}`;
    
    // Send to the other party
    await this.sendAutomatedMessage(
      listingId,
      disputedByParty, // From disputing party
      otherParty, // To other party
      content
    );
  }

  /**
   * Notify when payment is pending
   */
  static async notifyPaymentPending(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    amount: number
  ) {
    const content = `⏳ Payment of $${amount.toFixed(2)} is being processed. This usually takes a few minutes. Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller (system)
      buyerId, // To buyer
      content
    );
  }

  /**
   * Notify when item is marked as shipped
   */
  static async notifyItemShipped(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string,
    trackingNumber?: string
  ) {
    const trackingText = trackingNumber ? ` Tracking number: ${trackingNumber}` : '';
    const content = `📦 The seller has marked your item as shipped!${trackingText} Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller
      buyerId, // To buyer
      content
    );
  }

  /**
   * Notify when item is marked as delivered
   */
  static async notifyItemDelivered(
    transactionId: string,
    listingId: string,
    buyerId: string,
    sellerId: string
  ) {
    const content = `✅ Item delivered! Please confirm receipt to release payment to the seller. Transaction ID: ${transactionId}`;
    
    // Send to buyer
    await this.sendAutomatedMessage(
      listingId,
      sellerId, // From seller (system)
      buyerId, // To buyer
      content
    );
  }
}

