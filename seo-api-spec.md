# SEO Web Pages & Templating System API Specification

This document details the final endpoints, required request payloads, and response JSON formats for the SEO landing pages system.

---

## 1. Database Schemas Reference

### Location
```json
{
  "name": "Hyderabad",
  "type": "city" // enum: ["country", "state", "city", "area"]
}
```

### WebPageTemplate
```json
{
  "title": "Best [course] course near me",
  "h2": "Best [course] in [location]",
  "content": "<p>Welcome to our premier [course] training institute in [location].</p>",
  "keywords": "best [course] in [location], [course] classes [location]",
  "excerpt": "Get certified in [course] with top-rated training in [location].",
  "sections": [
    {
      "title": "Why study [course] in [location]?",
      "content": "<p>Studying [course] in [location] offers incredible career growth opportunities.</p>",
      "cta": true
    }
  ],
  "faqs": [
    {
      "question": "What is the duration of [course] course in [location]?",
      "answer": "The duration of [course] course in [location] is usually 6 to 12 months."
    }
  ]
}
```

### WebPage (Generated Page)
```json
{
  "categoryId": "647f2a1b9c3b2f12a4b8c9d0",
  "locationId": "647f2a1b9c3b2f12a4b8c9d1",
  "title": "Best CPA course near me",
  "h2": "Best CPA in Hyderabad",
  "content": "<p>Welcome to our premier CPA training institute in Hyderabad.</p>",
  "keywords": "best CPA in Hyderabad, CPA classes Hyderabad",
  "excerpt": "Get certified in CPA with top-rated training in Hyderabad.",
  "sections": [
    {
      "title": "Why study CPA in Hyderabad?",
      "content": "<p>Studying CPA in Hyderabad offers incredible career growth opportunities.</p>",
      "cta": true
    }
  ],
  "faqs": [
    {
      "question": "What is the duration of CPA course in Hyderabad?",
      "answer": "The duration of CPA course in Hyderabad is usually 6 to 12 months."
    }
  ],
  "slug": "cpa-in-hyderabad",
  "status": "generated"
}
```

---

## 2. API Endpoints

### A. Template Management

#### 1. Retrieve Global Template
*   **Endpoint**: `GET /web-pages/template`
*   **Description**: Retrieves the global template. Initializes a default one if none exists.
*   **Payload**: None
*   **Response**:
    ```json
    {
      "_id": "647f2a1b9c3b2f12a4b8c9ff",
      "title": "Best [course] course near me",
      "h2": "Best [course] in [location]",
      "content": "<p>Welcome to our premier [course] training institute in [location].</p>",
      "keywords": "best [course] in [location], [course] classes [location]",
      "excerpt": "Get certified in [course] with top-rated training in [location].",
      "sections": [
        {
          "title": "Why study [course] in [location]?",
          "content": "<p>Studying [course] in [location] offers incredible career growth opportunities.</p>",
          "cta": true,
          "_id": "647f2a1b9c3b2f12a4b8c9fe"
        }
      ],
      "faqs": [
        {
          "question": "What is the duration of [course] course in [location]?",
          "answer": "The duration of [course] course in [location] is usually 6 to 12 months.",
          "_id": "647f2a1b9c3b2f12a4b8c9fd"
        }
      ],
      "createdAt": "2026-06-03T07:48:29.000Z",
      "updatedAt": "2026-06-03T07:48:29.000Z"
    }
    ```

#### 2. Update Global Template
*   **Endpoint**: `POST /web-pages/update-content`
*   **Description**: Updates (or creates) the single global template.
*   **Payload**:
    ```json
    {
      "title": "Best [course] course near me",
      "h2": "Best [course] in [location]",
      "content": "<p>Welcome to our premier [course] training institute in [location].</p>",
      "keywords": "best [course] in [location]",
      "excerpt": "Get certified in [course] with top-rated training in [location].",
      "sections": [
        {
          "title": "Why study [course] in [location]?",
          "content": "<p>Studying [course] in [location] offers incredible career growth opportunities.</p>",
          "cta": true
        }
      ],
      "faqs": [
        {
          "question": "What is the duration of [course] course in [location]?",
          "answer": "The duration of [course] course in [location] is usually 6 to 12 months."
        }
      ]
    }
    ```
*   **Response**:
    ```json
    {
      "message": "Web page content template updated successfully for all pages",
      "template": {
        "_id": "647f2a1b9c3b2f12a4b8c9ff",
        "title": "Best [course] course near me",
        "h2": "Best [course] in [location]",
        "content": "<p>Welcome to our premier [course] training institute in [location].</p>",
        "keywords": "best [course] in [location]",
        "excerpt": "Get certified in [course] with top-rated training in [location].",
        "sections": [
          {
            "title": "Why study [course] in [location]?",
            "content": "<p>Studying [course] in [location] offers incredible career growth opportunities.</p>",
            "cta": true,
            "_id": "647f2a1b9c3b2f12a4b8ca00"
          }
        ],
        "faqs": [
          {
            "question": "What is the duration of [course] course in [location]?",
            "answer": "The duration of [course] course in [location] is usually 6 to 12 months.",
            "_id": "647f2a1b9c3b2f12a4b8ca01"
          }
        ],
        "createdAt": "2026-06-03T07:48:29.000Z",
        "updatedAt": "2026-06-03T07:49:00.000Z"
      }
    }
    ```

---

### B. Page Generation & Lifecycle

#### 1. Generate Target Pages for Category
*   **Endpoint**: `POST /web-pages/generate`
*   **Description**: Generates target pages for a specific Category (Course) across all available target locations, replacing placeholders `[course]` and `[location]`.
*   **Payload**:
    ```json
    {
      "categoryId": "647f2a1b9c3b2f12a4b8c9d0"
    }
    ```
*   **Response**:
    ```json
    {
      "message": "Generation complete",
      "generatedCount": 5,
      "totalLocations": 5
    }
    ```

#### 2. List Generated Pages
*   **Endpoint**: `GET /web-pages`
*   **Description**: Lists all generated pages with populated Category and Location.
*   **Query Parameters**: `categoryId` (optional filter).
*   **Payload**: None
*   **Response**:
    ```json
    [
      {
        "_id": "647f2a1b9c3b2f12a4b8cb02",
        "categoryId": {
          "_id": "647f2a1b9c3b2f12a4b8c9d0",
          "name": "CPA"
        },
        "locationId": {
          "_id": "647f2a1b9c3b2f12a4b8c9d1",
          "name": "Hyderabad"
        },
        "title": "Best CPA course near me",
        "h2": "Best CPA in Hyderabad",
        "content": "<p>Welcome to our premier CPA training institute in Hyderabad.</p>",
        "keywords": "best CPA in Hyderabad",
        "excerpt": "Get certified in CPA with top-rated training in Hyderabad.",
        "sections": [
          {
            "title": "Why study CPA in Hyderabad?",
            "content": "<p>Studying CPA in Hyderabad offers incredible career growth opportunities.</p>",
            "cta": true,
            "_id": "647f2a1b9c3b2f12a4b8cb03"
          }
        ],
        "faqs": [
          {
            "question": "What is the duration of CPA course in Hyderabad?",
            "answer": "The duration of CPA course in Hyderabad is usually 6 to 12 months.",
            "_id": "647f2a1b9c3b2f12a4b8cb04"
          }
        ],
        "slug": "cpa-in-hyderabad",
        "status": "generated",
        "createdAt": "2026-06-03T07:50:00.000Z",
        "updatedAt": "2026-06-03T07:50:00.000Z"
      }
    ]
    ```

#### 3. Get Landing Page Counts per Category
*   **Endpoint**: `GET /web-pages/counts`
*   **Description**: Returns a mapping of category IDs to the count of pages generated for them.
*   **Payload**: None
*   **Response**:
    ```json
    {
      "647f2a1b9c3b2f12a4b8c9d0": 12,
      "647f2a1b9c3b2f12a4b8c9a3": 4
    }
    ```

#### 4. Delete Single Generated Page
*   **Endpoint**: `DELETE /web-pages/:id`
*   **Description**: Deletes a single generated page.
*   **Payload**: None
*   **Response**:
    ```json
    {
      "message": "Web page deleted successfully"
    }
    ```

---

### C. Public-Facing Routes

#### 1. Fetch Resolved Page by Slug
*   **Endpoint**: `GET /public/seo-page/:slug`
*   **Description**: Fetches a fully resolved landing page by its slug (e.g., `cpa-in-hyderabad`).
*   **Payload**: None
*   **Response**:
    ```json
    {
      "_id": "647f2a1b9c3b2f12a4b8cb02",
      "categoryId": {
        "_id": "647f2a1b9c3b2f12a4b8c9d0",
        "name": "CPA"
      },
      "locationId": {
        "_id": "647f2a1b9c3b2f12a4b8c9d1",
        "name": "Hyderabad"
      },
      "title": "Best CPA course near me",
      "h2": "Best CPA in Hyderabad",
      "content": "<p>Welcome to our premier CPA training institute in Hyderabad.</p>",
      "keywords": "best CPA in Hyderabad",
      "excerpt": "Get certified in CPA with top-rated training in Hyderabad.",
      "sections": [
        {
          "title": "Why study CPA in Hyderabad?",
          "content": "<p>Studying CPA in Hyderabad offers incredible career growth opportunities.</p>",
          "cta": true,
          "_id": "647f2a1b9c3b2f12a4b8cb03"
        }
      ],
      "faqs": [
        {
          "question": "What is the duration of CPA course in Hyderabad?",
          "answer": "The duration of CPA course in Hyderabad is usually 6 to 12 months.",
          "_id": "647f2a1b9c3b2f12a4b8cb04"
        }
      ],
      "slug": "cpa-in-hyderabad",
      "status": "generated",
      "createdAt": "2026-06-03T07:50:00.000Z",
      "updatedAt": "2026-06-03T07:50:00.000Z"
    }
    ```

#### 2. Get All Public Landing Page Links
*   **Endpoint**: `GET /public/seo-pages`
*   **Description**: Retrieves a list of all generated landing pages, including their slugs, titles, and category/location mappings for links/sitemaps.
*   **Payload**: None
*   **Response**:
    ```json
    [
      {
        "_id": "647f2a1b9c3b2f12a4b8cb02",
        "categoryId": {
          "_id": "647f2a1b9c3b2f12a4b8c9d0",
          "name": "CPA"
        },
        "locationId": {
          "_id": "647f2a1b9c3b2f12a4b8c9d1",
          "name": "Hyderabad"
        },
        "title": "Best CPA course near me",
        "slug": "cpa-in-hyderabad",
        "createdAt": "2026-06-03T07:50:00.000Z"
      }
    ]
    ```

#### 3. Public Locations Queries (Hierarchical & Filtered)
*   **Endpoints**:
    *   **Countries**: `GET /public/locations/countries`
    *   **States**: `GET /public/locations/states` (supports optional `?parentId=countryId` query param)
    *   **Cities**: `GET /public/locations/cities` (supports optional `?parentId=stateId` query param)
    *   **Areas**: `GET /public/locations/areas` (supports optional `?parentId=cityId` query param)
    *   **General Query**: `GET /public/locations` (supports optional `?type=country|state|city|area` & `?parentId=parentLocationId` query params)
*   **Description**: Open endpoints to fetch filtered lists of locations by type and parent association to allow dynamic cascade selections (e.g. choosing a Country pulls only its States, and so on).
*   **Response**:
    ```json
    [
      {
        "_id": "647f2a1b9c3b2f12a4b8cb99",
        "name": "Telangana",
        "type": "state",
        "parentId": "647f2a1b9c3b2f12a4b8cb98",
        "createdAt": "2026-06-03T09:00:00.000Z",
        "updatedAt": "2026-06-03T09:00:00.000Z"
      }
    ]
    ```


#### 3. Import Locations from CSV
*   **Endpoint**: `POST /import/locations`
*   **Description**: Import/merge locations from a CSV file. If a location name exists (case-insensitive check), its `type` is updated, otherwise a new record is created.
*   **Payload**: Multipart Form Data with file field `file`
*   **Response**:
    ```json
    {
      "message": "Locations import complete",
      "imported": 5,
      "updated": 2,
      "total": 7
    }
    ```

#### 3. Export Locations as CSV
*   **Endpoint**: `GET /locations/export`
*   **Description**: Exports all saved locations inside the database to a downloadable CSV file.
*   **Payload**: None
*   **Response**: Content-Type: `text/csv` (File download containing columns `name,type`).

---

## 3. Frontend Integration Guidelines

### A. Location Table & Form Changes
1. **Table Columns**:
   - Add a column for **Type** to show the geographical category of each location.
   - The value is one of `["country", "state", "city", "area"]`.
2. **Add / Edit Modal**:
   - Add a dropdown selection menu for **Type** with options: `Country`, `State`, `City`, `Area`.
   - On submitting, include the `type` field in the payload (e.g. `{ name: "Hyderabad", type: "city" }`).

### B. CSV Upload & Download Implementation
1. **Download CSV**:
   - Point a "Download CSV" button to trigger `GET /locations/export` using a standard anchor link download or via Axios blob request.
   - A template CSV can be downloaded in the header structure:
     ```csv
     name,type
     Hyderabad,city
     Telangana,state
     India,country
     ```
2. **Upload CSV**:
   - Add a file input element allowing `.csv` file selections.
   - Upload the selected file to `POST /import/locations` as a multipart form payload:
     ```javascript
     const formData = new FormData();
     formData.append("file", fileInput.files[0]);
     
     axios.post("/import/locations", formData, {
       headers: {
         "Content-Type": "multipart/form-data"
       }
     });
     ```

