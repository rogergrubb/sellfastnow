

> ## Mutual Pin + Live Visibility: Implementation Plan
> **Author:** Manus AI
> **Date:** October 26, 2025
> **Status:** In Progress

---

### 1. Overview

This document outlines the implementation plan for the **Mutual Pin + Live Visibility** feature for the SellFast.Now marketplace. This feature is designed to enhance the safety and convenience of in-person meetups between buyers and sellers by providing a real-time location sharing mechanism. The core functionality enables two users to mutually consent to share their live location for a limited time as they travel to a designated meetup point. This plan details the proposed database schema, backend and frontend architecture, security considerations, and a phased implementation strategy.

### 2. Key Objectives

*   **Enhance User Safety:** Provide a secure and transparent way for users to know each other's location during a meetup.
*   **Improve Meetup Reliability:** Reduce no-shows and improve punctuality by making the process more interactive.
*   **Streamline Coordination:** Simplify the process of finding each other at a busy public location.
*   **Build Trust:** Introduce a reliability score based on meetup history to foster a more trustworthy community.

---



### 3. Database Schema

The foundation of this feature is a set of new database tables designed to manage location sharing sessions, track location history, facilitate communication, and score user reliability. The schema is designed to be scalable and secure, with clear data separation and referential integrity.

| Table Name             | Purpose                                                                                             | Key Columns                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `meetup_sessions`      | Tracks active location sharing sessions between a buyer and a seller for a specific transaction.      | `id`, `transactionId`, `listingId`, `buyerId`, `sellerId`, `status`, `expiresAt`                          |
| `location_history`     | Stores a historical log of location updates for each user within a session for auditing and scoring.  | `id`, `sessionId`, `userId`, `latitude`, `longitude`, `timestamp`                                         |
| `meetup_messages`      | Enables users to send quick, predefined status messages to each other during the meetup.            | `id`, `sessionId`, `senderId`, `messageType`, `messageText`                                               |
| `reliability_scores`   | Maintains a reliability score for each user based on their meetup history and punctuality.            | `id`, `userId`, `totalMeetups`, `completedMeetups`, `reliabilityScore`                                    |

For the complete schema definitions, please refer to the `shared/meetup-schema.ts` file.

---

### 4. Technical Architecture

The feature will be implemented using a full-stack approach, leveraging the existing technology stack (React, Node.js, PostgreSQL) and introducing a real-time component for live updates.

#### 4.1. Backend Architecture

The backend will be responsible for managing the lifecycle of meetup sessions, handling location updates, and ensuring the security of the data.

*   **API Endpoints:** A new set of RESTful API endpoints will be created under `/api/meetups` to manage the CRUD operations for meetup sessions. These endpoints will handle session creation, status updates, and retrieval of session details.
*   **Real-time Communication:** A WebSocket server will be implemented to handle the real-time sharing of location data. This will allow for low-latency updates between clients without the need for constant polling. The server will manage WebSocket connections, broadcast location updates to the relevant users, and handle authentication and authorization for the real-time channels.
*   **Security:** All location data will be transmitted over secure WebSocket (WSS) connections. User authentication tokens will be used to authorize access to session data. Location data will be considered sensitive and will be stored encrypted at rest.

#### 4.2. Frontend Architecture

The frontend will provide the user interface for initiating, managing, and viewing the live location sharing session.

*   **UI Components:**
    *   **Meetup Initiation Modal:** A modal dialog will allow users to request or accept a location sharing session.
    *   **Live Map View:** A dedicated component will display a map (using a library like Mapbox or Leaflet) showing the live locations of both users, the meetup point, and the estimated time of arrival.
    *   **Status Panel:** A panel will display the current status of the meetup, quick message buttons, and an emergency "share with trusted contact" button.
*   **State Management:** The existing React Query library will be used to manage the state of the meetup session, while the WebSocket connection will be managed in a dedicated context or hook.
*   **Geolocation:** The browser's Geolocation API will be used to obtain the user's live location. The implementation will include mechanisms to handle permissions, errors, and optimize for battery life.

---



### 5. Implementation Phases

The development of this feature will be broken down into the following phases:

*   **Phase 1: Backend API Development:**
    *   Implement the `/api/meetups` endpoints for session management.
    *   Integrate the database schema and migrations.
    *   Develop the logic for creating, updating, and expiring sessions.

*   **Phase 2: Real-time Infrastructure:**
    *   Set up the WebSocket server.
    *   Implement the logic for handling WebSocket connections, authentication, and message broadcasting.

*   **Phase 3: Frontend UI - Session Management:**
    *   Build the UI components for initiating and accepting meetup requests.
    *   Integrate the frontend with the backend API for session management.

*   **Phase 4: Frontend UI - Live Map and Geolocation:**
    *   Integrate a map library (e.g., Mapbox, Leaflet).
    *   Implement the live location tracking using the Geolocation API and WebSockets.
    *   Build the live map view with user markers, meetup point, and status updates.

*   **Phase 5: Testing and Deployment:**
    *   Conduct thorough end-to-end testing of the feature.
    *   Deploy the feature to a staging environment for user acceptance testing.
    *   Deploy to production.

---



### 6. API Endpoint Definitions

The following endpoints will be created to support the Mutual Pin feature.

| Method | Endpoint                      | Description                                                                 | Request Body                                       | Response Body                                      |
|--------|-------------------------------|-----------------------------------------------------------------------------|----------------------------------------------------|----------------------------------------------------|
| POST   | `/api/meetups`                | Initiate a new meetup session.                                              | `{ transactionId: string, listingId: string }`     | `{ meetupSession: MeetupSession }`                 |
| GET    | `/api/meetups/:id`            | Get the details of a specific meetup session.                               | -                                                  | `{ meetupSession: MeetupSession }`                 |
| PATCH  | `/api/meetups/:id/status`     | Update the status of a session (e.g., accept, cancel, complete).            | `{ status: 'active' \| 'cancelled' \| 'completed' }` | `{ meetupSession: MeetupSession }`                 |
| POST   | `/api/meetups/:id/share`      | Opt-in to share location for the session.                                   | -                                                  | `{ success: true }`                                |
| POST   | `/api/meetups/:id/messages`   | Send a quick message within the session.                                    | `{ messageType: string, messageText?: string }`    | `{ message: MeetupMessage }`                       |

---

