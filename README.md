# LinkUp

![LinkUp Logo](https://res.cloudinary.com/djc2sdtw2/image/upload/v1763421871/messages/pupjxawyyreoh0qyejka.svg)

> Your Conversations, All in One Place

---

### 🔗 Table of Content
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Contributing](#-contributing)
- [Licence](#-license)
- [Author](#-author)

## 📍 Overview 

LinkUp is a real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js), featuring 1-on-1 messaging, group chats, friend requests, and real-time updates using WebSockets.

- **Check Preview Here**

<p align="center">
  <a href="https://linkup-37np.onrender.com">
    <img src="https://img.shields.io/badge/Live%20Demo-007BFF?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
</p>

## 👾 Features
LinkUp is an app with many features: 

#### 🔹 Authentication :
- Secure sign up & login with JWT
- Forgot password and password reset emails

#### 🔹 Chats & messaging :
- Chronological list of chats
- Send messages and pictures
- Reply to other messages
- Edit and delete messages
- Messages timestamps

#### 🔹 User & Friends management :
- Update profile and account informations
- Send, accept and manage friend requests

#### 🔹 Groups management :
- Create new group chats with multiple participants
- Add and remove members from your group
- Send and manage join requests
- Change and manage member roles 

#### 🔹 Modern UI: 
- Fully responsive
- Smooth animations and transitions
- Light & Dark themes

#### 🔹 Real-time updates :
- Instant messaging using webSockets
- Real-time typing indicators
- Delivered & seen status
- Online & last seen status tracking

[**Back To Top**](#linkup)

## 🧰 Tech Stack

#### 🔹 Frontend :
- React
- React Router
- Zustand
- Tailwind CSS
- Framer Motion
- React Date Picker
- React Hot Toast 
- Emoji Mart
- Lucide Icons
- Axios

#### 🔹 Backend :
- Node.js
- Express.js
- Socket.io
- Cloudinary
- Nodemailer
- Bcrypt

#### 🔹 Database :
- MongoDB

[**Back To Top**](#linkup)

## 📁 Repository Structure: 
````
LinkUp/
├── backend
│   ├── package.json / package-lock.json
│   └── src
│       ├── controllers
│       ├── lib
│       ├── middleware
│       ├── models
│       ├── routes
│       └── index.js
├── frontend
│   ├── package.json / package-lock.json
│   ├── index.html
│   ├── README.md
│   ├── eslint.config.js
│   ├── vite.config.js
│   └── src
│       ├── lib
│       ├── components
│       ├── pages
│       ├── store
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── custom-datepicker.css

````

[**Back To Top**](#linkup)

## 🚀 Getting Started

### 🔹 Prerequisites:
Before getting started with LinkUp, ensure your runtime environment meets the following requirements :
- **Node.js** v18+ and **npm** (or **yarn**)
- **MongoDB** instance

### 🔹 Installation:
Follow these steps to install LinkUp :

#### 1. Clone The LinkUp Repository  
```bash
git clone https://github.com/Abdou-Mdn/LinkUp.git
```

#### 2. Navigate to project directory
```bash
cd LinkUp
```

#### 3. Backend setup 

- **Navigate to backend folder :**
```bash
cd /backend
```

- **Install dependencies :**
```bash
npm install
```

- **Set up your environment variables [(See Below)](#-environment-variables)** 

#### 4. Frontend setup

- **Navigate to frontend folder :**
```bash
cd /frontend
```

- **Install dependencies :**
```bash
npm install
```

### 🔹 Environment Variables: 

Create a `.env` file in the `backend/` directory. Common variables include:

- **Database (MongoDB):** 
```ini
MONGODB_URI = <your_mongodb_connection_string>
PORT = 5000
CLIENT_URL = <your_hosted_frontend_url>
NODE_ENV = development
```

- **Authentication (JWT):**
```ini 
JWT_SECRET = <your_jwt_secret_key>
```

- **Media Uploads (Cloudinary):**
```ini
CLOUDINARY_CLOUD_NAME = <your_cloudinary_cloud_name>
CLOUDINARY_API_KEY = <your_cloudinary_api_key>
CLOUDINARY_API_SECRET = <your_cloudinary_api_secret>
```

- **Email Services (Nodemailer):**
```ini
EMAIL_USER = <your_email_address>
EMAIL_PASS = <your_sendgrid_api_key>
```

### 🔹 Usage:

- **Start backend :**
```bash
cd /backend
npm run dev
```

- **Start frontend :**
```bash
cd /frontend
npm run dev
```

[**Back To Top**](#linkup)

## 🔰 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a pull request!

[**Back To Top**](#linkup)

## 📜 License

This project is licensed under the [MIT License](./LICENSE) and Free to use.

[**Back To Top**](#linkup)

## 👤 Author

This project was developed by me [**AbdouMdn**](https://github.com/Abdou-Mdn). Feel free to reach out with any questions or suggestions.

- Gmail: madaniabderazak01@gmail.com
- LinkedIn: https://www.linkedin.com/in/abderazak-madani-827238307/

[**Back To Top**](#linkup)