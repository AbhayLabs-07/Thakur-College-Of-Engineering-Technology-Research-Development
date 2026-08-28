# MongoDB Configuration & Database Setup Guide (TCET R&D Cell)

This document maps configuration standards and connection directions for local inspection (using **MongoDB Compass**) and production cloud hosting (using **MongoDB Atlas**).

---

## 1. Local Database Environment

By default, the server connects to the local MongoDB database service running on the standard TCP port:

- **Connection URI:** `mongodb://127.0.0.1:27017/smart_inventory`
- **Port:** `27017`

### Inspecting with MongoDB Compass
1. Download and launch **MongoDB Compass**.
2. Create a new connection profile.
3. Paste the following connection string in the URI field:
   ```
   mongodb://127.0.0.1:27017
   ```
4. Hit **Connect**. You will see the database `smart_inventory` with the following active collections:
   - `admins` (seeded administrative credentials)
   - `faculties` (seeded academic reviewers and mentors)
   - `students` (attendance-deduplicated student accounts)
   - `components` (hardware components catalogue)
   - `borrowrecords` (checkout approval logs and QR tokens)

---

## 2. Production Database Environment (MongoDB Atlas)

To deploy this application in a hosted staging/production environment, move the database storage to a MongoDB Atlas cluster.

### Setup Instructions
1. Log in to your [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (Shared Sandbox tier is free and sufficient).
3. Under **Database Access**, create a database user with read/write privileges (recommend Password authentication).
4. Under **Network Access**, add an IP Access list entry. Allow access from your application host server IP (or add `0.0.0.0/0` temporarily for testing).
5. Navigate to **Clusters** > **Connect** > **Drivers** > **Node.js**.
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/smart_inventory?retryWrites=true&w=majority
   ```
7. Replace the username and password tokens with your database credentials in the backend `.env` file under the variable `MONGO_URI`.

---

## 3. Performance Indexing Strategy

To keep search parameters responsive and ensure rapid verification scanning for checkout QR vouchers, the database models employ the following index definitions:

- **Students Collection**:
  - `erpId` is indexed as `unique` (allows O(1) logins and stops duplicate entry registrations).
  - `userId` is indexed as `unique` (deterministic login ID support).
- **Components Collection**:
  - `name` is indexed as `unique` (prevents cataloguing redundant records).
  - `keywords` array is indexed to optimize search filters and recommendations matching.
- **BorrowRecords Collection**:
  - `qrToken` is indexed as `unique` to facilitate instant lookups during lab retrievals (scanning code returns record in < 5ms).
  - `student` ref is indexed for rapid personal request history compilation on dashboard loads.
