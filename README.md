```
                /$$$$$$                  /$$           /$$$$$$$$        /$$ /$$          
               /$$__  $$                | $$          | $$_____/       | $$|__/          
              | $$  \__/  /$$$$$$   /$$$$$$$  /$$$$$$ | $$     /$$$$$$ | $$ /$$  /$$$$$$ 
              | $$       /$$__  $$ /$$__  $$ /$$__  $$| $$$$$ /$$__  $$| $$| $$ /$$__  $$
              | $$      | $$  \ $$| $$  | $$| $$$$$$$$| $$__/| $$  \ $$| $$| $$| $$  \ $$
              | $$    $$| $$  | $$| $$  | $$| $$_____/| $$   | $$  | $$| $$| $$| $$  | $$
              |  $$$$$$/|  $$$$$$/|  $$$$$$$|  $$$$$$$| $$   |  $$$$$$/| $$| $$|  $$$$$$/
               \______/  \______/  \_______/ \_______/|__/    \______/ |__/|__/ \______/ 
```

---

## About CodeFolio

**CodeFolio** is a modern portfolio-building platform created to help students, developers, designers, and working professionals showcase their work in a clean and professional format.

Instead of spending hours building a website from scratch, users can create a polished digital portfolio instantly. Built on **Firebase** and deployed through **Vercel**, CodeFolio offers fast load times, seamless authentication, and secure, real-time syncing across devices.

---

## Repo Location URL

**GitHub Repository:**  
https://github.com/elijahsantiago/CodeFolio

---

## Communication Tools

- Discord
---

## Features

- **Firebase Authentication**  
  Secure login with real-time profile syncing.

- **Resume Upload**  
  Upload a PDF resume and display it directly on your profile.

- **Project Showcases**  
  Add images, GitHub links, descriptions, and documents to highlight your work.

- **Discover Profiles**  
  Browse other users’ portfolios and expand your professional network.

- **Profile Customization**  
  Update your banner, profile image, bio, skills, and social links.

- **Connections**  
  Send and accept connection requests to build your community.

- **Verification Badges**  
  Earn badges for student status, certifications, or verified accounts.

- **QR Code Business Cards**  
  Instantly generate a QR code linking to your CodeFolio profile.

- **LiveFeed**  
    A dynamic activity feed where users can share updates, projects, milestones, and interact with posts from their connections.

- **More Features Coming Soon**  
  (analytics dashboard, messaging system, portfolio templates, AI resume feedback)

---

## Build Architecture

- **Next.js (App Router)**
- **React**
- **Tailwind CSS**
- **Firebase Authentication**
- **Firebase Firestore Database**
- **Firebase Storage**
- **Vercel Deployment**

---

## Requirements

To run CodeFolio locally:

- Node.js installed
- Any IDE that supports JavaScript/TypeScript
- Firebase project (for your own local testing)
- Internet connection for Firebase services

---

## Developer Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/elijahsantiago/CodeFolio
   cd CodeFolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Firebase project**
    - Go to https://firebase.google.com
    - Create a new Firebase project
    - Enable **Authentication**, **Firestore**, and **Storage**
    - Create a new Web App inside Firebase
    - Copy your Firebase config and paste it into the project environment files

4. **Create your `.env.local` file**

   Add the Firebase keys:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=yourKeyHere
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yourDomainHere
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=yourProjectId
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yourBucketHere
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=yourSenderId
   NEXT_PUBLIC_FIREBASE_APP_ID=yourAppId
   ```

5. **Run the project locally**
   ```bash
   npm run dev
   ```
   Then open your browser and visit:
   ```
   http://localhost:3000
   ```

6. **Deploying to production**
    - Push your repo to GitHub
    - Connect your repository to **Vercel**
    - Add the environment variables in Vercel
    - Deploy your project

---

## Out-of-Box Installation

CodeFolio does not currently support a downloadable installer.  
Users access the platform through the deployed Vercel website or through a self-hosted version using the steps above.

---

## License

This project is licensed under the **Apache License 2.0**.  
You may use, modify, and distribute this software in compliance with the terms outlined in the LICENSE file.
