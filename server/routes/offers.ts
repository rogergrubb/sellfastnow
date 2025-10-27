import { Router } from "express";
import { storage, db } from "../storage";
import { isAuthenticated } from "../supabaseAuth";
import { offers } from "../../shared/schema";
import { eq } from "drizzle-orm";

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

    // TODO: Send notification to seller (email/push notification)
    // TODO: Emit WebSocket event to notify seller in real-time

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
    const { status, counterOfferAmount, counterOfferMessage } = req.body;
    const userId = req.auth.userId;

    // Get the offer
    const offerData = await storage.getOffer(offerId);
    if (!offerData) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const offer = offerData.offer;

    // Only the seller can update offer status
    if (offer.sellerId !== userId) {
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
    const updates: any = { status, respondedAt: new Date() };
    if (status === "countered") {
      updates.counterOfferAmount = counterOfferAmount.toString();
      updates.counterOfferMessage = counterOfferMessage || "";
    }

    const updatedOffer = await storage.updateOfferStatus(offerId, status, updates);

    // TODO: Send notification to buyer
    // TODO: Emit WebSocket event to notify buyer

    // If accepted, create a transaction
    if (status === "accepted") {
      // TODO: Create transaction from accepted offer
      // This should be implemented based on your transaction flow
    }

    res.json({ offer: updatedOffer });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Failed to update offer" });
  }
});

export default router;

