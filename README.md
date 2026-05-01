
# INTWIT 🚀

Visually Connected. Universally Heard.

---

Welcome to **INTWIT**, a hybrid full-stack social media application that merges the visual appeal of Instagram with the fast-paced, text-driven interactions of Twitter. 

## 🌟 Key Features
- **Smart Mentions:** Real-time `@username` tagging system with dropdown suggestions and instant backend detection.
- **Rich Media Posts:** Create, edit, and delete posts supporting text, emojis, and multiple image sliders (Swiper).
- **Real-Time Engagement:** Live updates for likes, comments, and notifications powered by Socket.io.
- **Advanced Privacy:** Built-in mutual blocking logic and secure feed generation.
- **Robust Authentication:** Secure Login/Signup workflow with form validation.
- **Responsive UI:** Clean, modern interface designed for a seamless user experience.

## 🛠️ Tech Stack
**Frontend:** 
- React.js (with TypeScript)
- Redux Toolkit (State Management)
- Formik & Yup (Form Validation)
- Socket.io-client
- CSS / Swiper

**Backend:** 
- Node.js & Express.js
- TypeScript
- MongoDB (Database)
- Socket.io (Real-time engine)

## ⚙️ Environment Setup
Create a `.env` file in the `server` directory and add your configuration:
```env
PORT=4000
MONGODB_URL=your_mongodb_connection_string_here
# Add your other secret keys here (e.g., JWT_SECRET)
```

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### 1. Clone the repository
```bash
git clone [https://github.com/dashsoumyaranjan336-source/intwit](https://github.com/dashsoumyaranjan336-source/intwit)
cd intwit
```

### 2. Start the Backend Server
Open a terminal and run:
```bash
cd server
npm install
npm run dev
```
*(Server will start on http://localhost:4000)*

### 3. Start the Frontend Client
Open a second terminal tab and run:
```bash
cd client
npm install
npm start
```
*(Client will start on http://localhost:3000)*

---

## 👨‍💻 Core Contributions

**Soumyaranjan Dash (Backend & Core Logic)**
> Architected the robust Node.js/Express server, designed secure authentication flows, implemented the advanced regex-based `@mention` system, and handled real-time data synchronization using Socket.io.

**Sourabha Mohanty (Client Architecture)**  
> Spearheaded the React.js frontend, managed complex Redux global states, and integrated dynamic interactive components (like Swiper and Emoji Pickers) to ensure a seamless and bug-free user experience.

**Arpita Mohanty (Visuals & Interface)**  
> Crafted the highly responsive and modern user interface, designed the intuitive post-creation and feed layouts, and ensured the hybrid visual identity of the platform was consistently maintained across all devices.

**Priti Sahu (Data & Storage)**  
> Designed the scalable MongoDB database schemas, optimized complex Mongoose queries (including mutual-block filtering and relation mapping), and ensured high data integrity and efficient retrieval.

---
*Built with ❤️ by the INTWIT Team.*
```