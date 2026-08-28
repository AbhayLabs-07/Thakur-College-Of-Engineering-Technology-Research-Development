# System Capabilities — Smart Inventory Management System

The Smart Inventory Management System is a full-stack web application designed for the Research and Development Cell of Thakur College of Engineering and Technology (TCET). This document details the technical features, workflows, and utilities implemented in the system.

---

## 1. Multiple Portal Role-Based Gateways

The system implements three distinct access levels, each isolated by JSON Web Token (JWT) sessions and server-side middleware:

### A. Student Gateway
- **Login:** Access via deterministically generated credentials derived from their ERP ID. Allows logging in with either the raw ERP ID (e.g. `1032250997`) or the User ID (`tcet.std.1032250997`).
- **Project Registration:** Students define their research project with Title, Domain, Description, and select an assigned Faculty Mentor.
- **Team Builder:** Interactive interface to add/remove project co-workers with Branch, division/class, project role, and contact details.
- **Glowing Recommendation Carousel:** Real-time hardware suggestions tailored to the student's project descriptions.
- **Inventory Browser:** Catalog search bar matching by name, description, and keywords with category filters.
- **QR Code Token Modal:** Generates a secure token (e.g., `TCET-RND-1032250997-XXXXXX`) and outputs a base64 receipt containing details of their checkout request.

### B. Faculty Mentor Portal
- **Dashboard Review:** Mentors access a list of pending requests assigned exclusively to them.
- **Full Scope Details:** Review student lead profiles, team compositions, project descriptions, and required components (with current lab availability).
- **Sequential Workflows:** Faculty approve or reject requests. Approved requests advance to the Admin's queue, while rejected ones are closed.

### C. Laboratory Admin Panel
- **Live Asset Tracking:** Visual summary of checkout logs color-coded by state (Approved, Handed Out, Returned, Rejected) with prominent RED alerts for overdue items.
- **Stock Management:** Adjust total stock levels, update components (technical specs and images), or delete obsolete items.
- **CSV Data Exporters:**
  - *Student Credentials Sheet:* Downloads the pre-seeded credentials CSV mapping students' ERP details to generated User IDs and randomized cleartext passwords.
  - *Inventory Asset Log:* Downloads the catalog containing stock levels, categories, and technical descriptions.

---

## 2. Technical Utilities & Background Services

- **Smart Component Recommendation Engine (`recommendationEngine.js`)**:
  - Automatically tokenizes title and descriptions.
  - Strips English stop words (like 'using', 'system', 'based', etc.).
  - Runs keyword matches against the inventory catalog, sorting suggested components by relevance weight.
- **Nodemailer Alerts Mailer (`mailer.js`)**:
  - Dispatches HTML emails using configured SMTP servers.
  - Includes a console logging fallback for development to verify email templates without live connections.
- **Cron Overdue Scanner (`overdueScan.js`)**:
  - Set up with `node-cron` to scan database loans daily at midnight.
  - Sends warning emails to students holding hardware past due dates.
  - Exposes a custom manual trigger route (`POST /api/cron/trigger-overdue`) so administrators can run scans on-demand.
