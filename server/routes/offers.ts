import { Router } from "express";
import { storage, db } from "../storage";
import { isAuthenticated } from "../supabaseAuth";
import { offers } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { getWebSocketService } from "../services/websocketService";

const router = Router();

// POST /api/listings/:listingId/offers - Create a new offer
router.post("/:listingId/offers", isAuthenticated, async (req: any, res) => {
  try {
    const { listingId } = req.params;
    const { offerAmount, depositAmount, message } = req.body;
    const buyerId = req.auth.userId;

    // Validate input
    if (!offerAmount || offerAmount <= 0) {
      return res.status(400).json({ error: "Invalid offer amount" });
    }

    if (depositAmount && depositAmount < 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    if (depositAmount && depositAmount > offerAmount) {
      return res.status(400).json({ error: "Deposit cannot exceed offer amount" });
    }

    // Get listing to verify it exists and get seller ID
    const listing = await storage.getListing(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Prevent user from making offer on their own listing
    if (listing.userId === buyerId) {
      return res.status(400).json({ error: "You cannot make an offer on your own listing" });
    }

    // Create the offer
    const offerData = {
      listingId,
      buyerId,
      sellerId: listing.userId,
      offerAmount: offerAmount.toString(),
      depositAmount: depositAmount ? depositAmount.toString() : "0",
      message: message || "",
      status: "pending",
    };

    const newOffer = await storage.createOffer(offerData);

    // Create a message in the thread for the offer
    try {
      const offerMessage = {
        listingId,
        senderId: buyerId,
        receiverId: listing.userId,
        content: message || `Made an offer of $${offerAmount}${depositAmount > 0 ? ` with $${depositAmount} deposit` : ''}`,
        messageType: "offer_made",
        metadata: {
          offerId: newOffer.id,
          offerAmount,
          depositAmount,
          status: "pending",
        },
      };
      
      await storage.createMessage(offerMessage);
      
      // Emit WebSocket event to notify seller in real-time
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.emitToUser(listing.userId, "new_message", {
          listingId,
          senderId: buyerId,
          messageType: "offer_made",
        });
      }
    } catch (error) {
      console.error("Error creating offer message:", error);
      // Don't fail the offer creation if message creation fails
    }

    // TODO: Send notification to seller (email/push notification)

    res.status(201).json({ offer: newOffer });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Failed to create offer" });
  }
});

// GET /api/listings/:listingId/offers - Get all offers for a listing
router.get("/:listingId/offers", isAuthenticated, async (req: any, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.auth.userId;

    // Get listing to verify user is the seller
    const listing = await storage.getListing(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Only the seller can view offers on their listing
    if (listing.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const listingOffers = await storage.getListingOffers(listingId);
    res.json({ offers: listingOffers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// GET /api/offers/made - Get all offers made by the current user
router.get("/made", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const offersMade = await storage.getUserOffersMade(userId);
    res.json({ offers: offersMade });
  } catch (error) {
    console.error("Error fetching offers made:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// GET /api/offers/received - Get all offers received by the current user
router.get("/received", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const offersReceived = await storage.getUserOffersReceived(userId);
    res.json({ offers: offersReceived });
  } catch (error) {
    console.error("Error fetching offers received:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// GET /api/offers/:offerId - Get a specific offer
router.get("/:offerId", isAuthenticated, async (req: any, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.auth.userId;

    const offer = await storage.getOffer(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Only buyer or seller can view the offer
    if (offer.offer.buyerId !== userId && offer.offer.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ offer });
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ error: "Failed to fetch offer" });
  }
});

// PATCH /api/offers/:offerId - Update offer status (accept/reject/counter)
router.patch("/:offerId", isAuthenticated, async (req: any, res) => {
  try {
    const { offerId } = req.params;
    const { status, counterOfferAmount, counterOfferMessage, responseMessage } = req.body;
    const userId = req.auth.userId;

    // Get the offer
    const offerData = await storage.getOffer(offerId);
    if (!offerData) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const offer = offerData.offer;

    // Both buyer and seller can update offer status
    // Seller can respond to initial offers or buyer's counter offers
    // Buyer can respond to seller's counter offers
    const isSeller = offer.sellerId === userId;
    const isBuyer = offer.buyerId === userId;
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate status
    const validStatuses = ["accepted", "rejected", "countered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // If countering, validate counter offer amount
    if (status === "countered") {
      if (!counterOfferAmount || counterOfferAmount <= 0) {
        return res.status(400).json({ error: "Invalid counter offer amount" });
      }
    }

    // Update the offer
    const updates: any = {};
    if (status === "countered") {
      updates.counterOfferAmount = counterOfferAmount.toString();
      updates.counterOfferMessage = counterOfferMessage || "";
    }

    console.log("Updating offer with:", { offerId, status, updates });
    const updatedOffer = await storage.updateOfferStatus(offerId, status, updates);
    console.log("Updated offer result:", updatedOffer);

    // Create a message in the thread for the status update
    try {
      let messageContent = "";
      let messageType = "";
      
      // Determine the receiver (opposite of sender)
      const receiverId = isSeller ? offer.buyerId : offer.sellerId;
      
      if (status === "accepted") {
        const acceptMessage = responseMessage || `Accepted your offer`;
        const amount = offer.counterOfferAmount || offer.offerAmount;
        messageContent = `${acceptMessage} - $${amount}`;
        messageType = "offer_accepted";
      } else if (status === "rejected") {
        const rejectMessage = responseMessage || `Declined your offer`;
        messageContent = rejectMessage;
        messageType = "offer_rejected";
      } else if (status === "countered") {
        messageContent = counterOfferMessage || `Countered with $${counterOfferAmount}`;
        messageType = "offer_countered";
      }
      
      const statusMessage = {
        listingId: offer.listingId,
        senderId: userId,
        receiverId,
        content: messageContent,
        messageType,
        metadata: {
          offerId,
          originalAmount: offer.offerAmount,
          counterAmount: counterOfferAmount,
          status,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        },
      };
      
      await storage.createMessage(statusMessage);
      
      // Emit WebSocket event to notify buyer
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.emitToUser(offer.buyerId, "new_message", {
          listingId: offer.listingId,
          senderId: userId,
          messageType,
        });
      }
    } catch (error) {
      console.error("Error creating status message:", error);
    }

    // If accepted, create a transaction
    if (status === "accepted") {
      try {
        const finalAmount = offer.counterOfferAmount || offer.offerAmount;
        const amount = parseFloat(finalAmount.toString());
        const platformFeeRate = 0.05; // 5% platform fee (5 pennies per dollar)
        const platformFee = amount * platformFeeRate;
        const sellerPayout = amount - platformFee;

        const transaction = await storage.createTransaction({
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          listingId: offer.listingId,
          offerId: offerId,
          amount: amount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          sellerPayout: sellerPayout.toFixed(2),
          depositAmount: (offer.depositAmount || 0).toString(),
          status: "pending", // Waiting for buyer to pay
        });

        console.log("Transaction created:", transaction.id);

        // Send a "proceed to payment" message
        const paymentMessage = {
          listingId: offer.listingId,
          senderId: "system",
          receiverId: offer.buyerId,
          content: `Offer accepted! Proceed to payment to secure this item.`,
          messageType: "payment_required",
          metadata: {
            transactionId: transaction.id,
            offerId: offerId,
            amount: amount,
            platformFee: platformFee,
            sellerPayout: sellerPayout,
          },
        };

        await storage.createMessage(paymentMessage);

        // Notify buyer via WebSocket
        if (wsService) {
          wsService.emitToUser(offer.buyerId, "payment_required", {
            transactionId: transaction.id,
            amount: amount,
          });
        }
      } catch (error) {
        console.error("Error creating transaction:", error);
      }
    }

    res.json({ offer: updatedOffer });
  } catch (error: any) {
    console.error("Error updating offer:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      offerId,
      status,
      counterOfferAmount,
      counterOfferMessage
    });
    res.status(500).json({ 
      error: "Failed to update offer",
      details: error.message 
    });
  }
});

export default router;

