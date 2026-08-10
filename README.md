# HeritageAI Pakistan 🏛️

> Rediscover Pakistan's ancient soul — an AI-powered heritage tourism platform for discovering and booking tours across 74 archaeological sites, from Neolithic Mehrgarh to imperial Mughal forts.

![HeritageAI Pakistan](./src/assets/preview.png)

---

## 📌 Overview

**HeritageAI Pakistan** is a Final Year Project built to bridge the gap between modern travelers and Pakistan's rich but often inaccessible archaeological heritage. The platform uses AI-driven recommendations and archival matching to help users discover, explore, and book tours across 74 of Pakistan's most significant historical sites — spanning 9,000 years of civilization.

From the Neolithic settlement of Mehrgarh to the Mughal forts of Lahore, HeritageAI makes Pakistan's ancient history navigable, bookable, and alive.

---

## ✨ Features

- **AI Recommender** — Personalized site recommendations based on user interests, travel history, and regional preferences
- **Archival Matching** — AI-driven matching of user queries to historical records and site documentation
- **Explore Sites** — Browse and filter all 74 archaeological sites by era, region, and type
- **Tour Booking** — End-to-end tour booking flow with date selection and confirmation
- **Dark Heritage UI** — Custom Lahori Marble design system — slate, ivory, and jade teal inspired by Lahore Fort's marble inlays
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP requests |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| Anthropic / OpenAI API | AI recommendations & archival matching |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |

### Design
| Tool | Purpose |
|---|---|
| Figma | UI/UX design & prototyping |
| Libre Baskerville | Heading typeface |
| Outfit | Body typeface |
| Lahori Marble palette | Custom color system |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js `v18+`
- npm or yarn
- MongoDB (local or Atlas URI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/heritageai-pakistan.git
   cd heritageai-pakistan
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file inside the `/server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   AI_API_KEY=your_ai_api_key
   ```

   Create a `.env` file inside the `/client` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

5. **Run the development servers**

   Backend (from `/server`):
   ```bash
   npm run dev
   ```

   Frontend (from `/client`):
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
heritageai-pakistan/
│
├── client/                   # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/           # Images, fonts, icons
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level page components
│   │   │   ├── Home.jsx
│   │   │   ├── ExploreSites.jsx
│   │   │   ├── AIRecommender.jsx
│   │   │   └── About.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API call functions
│   │   ├── styles/           # Global styles & theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                   # Node.js + Express backend
│   ├── controllers/          # Route handler logic
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express route definitions
│   ├── middleware/           # Auth, error handling
│   ├── services/             # AI integration logic
│   └── index.js
│
├── .gitignore
├── README.md
└── package.json
```

---

## 🎨 Design System — Lahori Marble

Inspired by the marble inlays of Lahore Fort, the palette is cool, minimal, and architectural.

| Role | Color | Hex |
|---|---|---|
| Page background | Slate Black | `#141618` |
| Cards / Navbar | Charcoal | `#23282D` |
| Borders / Hover | Gunmetal | `#3D494F` |
| Primary CTA | Jade Teal | `#1D9E75` |
| Headings / Body | Ivory | `#EDE9DF` |
| Subtext / Captions | Warm Stone | `#C8B89A` |

**Fonts:** Libre Baskerville (headings) · Outfit (body)

---

## 🗺️ Pages

| Route | Description |
|---|---|
| `/` | Hero landing page |
| `/explore` | Browse all 74 heritage sites |
| `/ai-recommender` | AI-powered site recommendation engine |
| `/about` | Project background and team |
| `/book/:siteId` | Tour booking flow for a specific site |

---

## 🤖 AI Features

The AI layer powers two core experiences:

**1. Site Recommender**
Users answer a short preference questionnaire and the AI returns a ranked list of sites tailored to their interests — adventure, architecture, spirituality, ancient civilizations, etc.

**2. Archival Matching**
Users can search using natural language (e.g. *"Buddhist monasteries near the Indus"*) and the AI matches their query against a curated database of historical records and site descriptions.

---

## 📸 Screenshots

| Home | Explore Sites | AI Recommender |
|---|---|---|
| ![Home](./screenshots/home.png) | ![Explore](./screenshots/explore.png) | ![AI](./screenshots/ai.png) |

---

## 🧑‍💻 Team

| Name | Role |
|---|---|
| Your Name | Full Stack Developer & Designer |
| Supervisor Name | Project Supervisor |

> Final Year Project — BS Computer Science · [Your University Name] · 2025

---

## 📄 License

This project is submitted as an academic Final Year Project. All rights reserved © 2025.

---

## 🙏 Acknowledgements

- Archaeological data sourced from the **Department of Archaeology & Museums, Pakistan**
- Inspired by the rich heritage of the **Indus Valley Civilization**, **Gandharan art**, and **Mughal architecture**
- Typography: [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) and [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts
