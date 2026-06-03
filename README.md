# 📝 MERN Notes App

[![Project Status](https://img.shields.io/badge/Status-Completed-success?style=flat)](https://github.com/Qazafi-Hussain-Developer/qazafi-hussain-mern-10pshine)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Qazafi-Hussain-Developer/qazafi-hussain-mern-10pshine)](https://github.com/Qazafi-Hussain-Developer/qazafi-hussain-mern-10pshine/commits)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue?style=flat&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)](https://mongodb.com/)

A modern full-stack Notes Management Application built with the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**.

Developed during the **10Pearls Shine Internship Program**, this project demonstrates industry-standard software engineering practices including scalable architecture, RESTful API development, authentication, testing, code quality analysis, CI/CD automation, and collaborative Git workflows.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Test Credentials](#-test-credentials)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running Tests](#-running-tests)
- [Docker Support](#-docker-support)
- [Continuous Integration](#-continuous-integration)
- [Support & Contact](#-support--contact)
- [Author](#-author)

---

## 🚀 Project Overview

MERN Notes App enables users to securely create, manage, update, and organize notes through an intuitive web interface backed by a robust REST API.

The project was built to simulate a real-world production environment while following clean code principles, modular architecture, automated testing, and modern development workflows.

---

## 🔑 Test Credentials

**Email:** `testuser@example.com`

**Password:** `test123`

---

## ✨ Key Features

### 👤 Authentication & Security

- User Registration & Login
- JWT Authentication
- Password Hashing
- Protected Routes
- Secure Session Management

### 📝 Notes Management

- Create Notes
- View Notes
- Edit Notes
- Delete Notes
- User-Specific Notes
- Real-Time UI Updates

### 🎨 Frontend

- Responsive User Interface
- React Router Navigation
- Reusable Components
- Axios API Integration
- Form Validation
- Error Handling

### ⚙️ Backend

- RESTful API Architecture
- Express.js Server
- MongoDB Database Integration
- Mongoose ODM
- Middleware-Based Request Handling
- Centralized Error Handling

### 🧪 Testing & Quality Assurance

- Jest (Frontend)
- Mocha (Backend)
- Chai Assertions
- Supertest API Testing
- ESLint Code Quality Checks
- SonarCloud Static Code Analysis

### 🚀 DevOps & Automation

- GitHub Actions CI/CD
- Automated Build Validation
- Pull Request Quality Checks
- Docker Containerization
- Branch-Based Development Workflow

---

## 🛠️ Tech Stack

| Category | Technologies                                           |
| -------- | ------------------------------------------------------ |
| Frontend | React.js, React Router, Axios, JavaScript (ES6+), CSS3 |
| Backend  | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt.js |
| Testing  | Jest, Mocha, Chai, Supertest                           |
| DevOps   | Git, GitHub Actions, Docker, SonarCloud, ESLint        |

---

## 📡 API Endpoints

| Method | Endpoint             | Description   | Auth Required |
| ------ | -------------------- | ------------- | ------------- |
| POST   | `/api/auth/register` | Register user | No            |
| POST   | `/api/auth/login`    | Login user    | No            |
| GET    | `/api/notes`         | Get all notes | Yes           |
| POST   | `/api/notes`         | Create note   | Yes           |
| PUT    | `/api/notes/:id`     | Update note   | Yes           |
| DELETE | `/api/notes/:id`     | Delete note   | Yes           |

---

## 📂 Project Structure

```text
qazafi-hussain-mern-10pshine/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── tests/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── tests/
│   └── package.json
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 🌿 Git Branching Strategy

| Branch               | Purpose               |
| -------------------- | --------------------- |
| `main`               | Production-ready code |
| `develop`            | Active development    |
| `feature/frontend/*` | Frontend features     |
| `feature/backend/*`  | Backend features      |
| `hotfix/*`           | Critical bug fixes    |

---

## ⚙️ Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB
- Git
- Docker (Optional)

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/Qazafi-Hussain-Developer/qazafi-hussain-mern-10pshine.git

cd qazafi-hussain-mern-10pshine
```

### Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend URL:

```text
http://localhost:3000
```

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend URL:

```text
http://localhost:5000
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend directory:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
```

---

## 🧪 Running Tests

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### Test Coverage

```bash
npm run coverage
```

---

## 🐳 Docker Support

```bash
docker-compose up --build
```

Stop containers:

```bash
docker-compose down
```

---

## 📊 Code Quality

This project maintains high code quality standards through:

- ESLint
- SonarCloud Analysis
- Automated CI Checks
- Pull Request Reviews
- Consistent Coding Standards

---

## 🔄 Continuous Integration

GitHub Actions automatically performs:

- Dependency Installation
- Lint Validation
- Unit Testing
- Integration Testing
- Build Verification
- SonarCloud Analysis

on every Pull Request and code merge.

---

## 🎯 Learning Outcomes

This project demonstrates practical experience with:

- Full-Stack MERN Development
- REST API Design
- Authentication & Authorization
- Database Modeling
- Automated Testing
- CI/CD Pipelines
- Docker Containerization
- Agile Git Workflows
- Code Quality Engineering

---

## 📈 Potential Future Enhancements

- Rich Text Editor
- Note Categories
- Search & Filtering
- Dark Mode
- File Attachments
- Real-Time Collaboration
- Notifications System
- Cloud Deployment

---

## 📧 Support & Contact

If you encounter any issues or have suggestions:

- Open an Issue on GitHub
- Submit a Pull Request
- Reach out through GitHub

GitHub:
https://github.com/Qazafi-Hussain-Developer

---

## 👨‍💻 Author

### Qazafi Hussain

Full Stack MERN Developer

**Skills**

- React.js
- Node.js
- Express.js
- MongoDB
- JavaScript
- REST APIs
- Testing & QA
- CI/CD

GitHub:
https://github.com/Qazafi-Hussain-Developer

---

## 🙏 Acknowledgments

Special thanks to:

- 10Pearls Team
- Shine Internship Program
- Open Source Community
- All mentors and reviewers who provided valuable feedback

---

## 📄 License

This project was developed as part of the **10Pearls Shine Internship Program** and is showcased for educational, learning, and portfolio purposes.

---

⭐ If you found this project useful, consider giving it a star.
