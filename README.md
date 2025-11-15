# 📝 Task Monitor

A simple **Task and Time Tracking** application built with **SvelteKit**, **TypeScript**, **Nhost**, **GraphQL**, and deployed on **Vercel**.

---

## 🚀 Live Demo

[Task Monitor Live](https://tast-monitor-oaxv8usev-kotimundlamuri6718-7280s-projects.vercel.app/)  

**Dummy Credentials:**

| Name                 | Password  |
|----------------------|-----------|
| Srinivas             | Srinivas  |

> Note: These credentials are for testing purposes only.

---

## 🛠 Technologies Used

- **Frontend:** SvelteKit, TypeScript, Tailwind CSS  
- **Backend / Authentication:** Nhost (Auth + Database)  
- **GraphQL:** Hasura / Nhost GraphQL API  
- **Deployment:** Vercel  

---

## ✨ Features

- ✅ **User Authentication:** Sign up, login, and logout  
- ✅ **Task Management:** Create, edit, delete, and update task status  
- ✅ **Time Tracking:** Start and stop timers for tasks  
- ✅ **Time Logs:** View detailed time logs with duration  
- ✅ **Daily Summary:** View total time spent on tasks for the day  
- ✅ **Responsive UI:** Works on desktop and mobile devices  

---

## 📦 Project Structure

src/
├─ routes/ # SvelteKit pages
├─ lib/
│ └─ stores/ # Svelte stores (auth, tasks)
├─ components/ # Reusable UI components


---

## ⚡ Getting Started

### 1️⃣ Clone the repository

git clone https://github.com/Srinivas-Mundlamuri/task-monitor.git
cd task-monitor

### 2️⃣ Install dependencies
pnpm install


You can also use npm install or yarn install if preferred.

### 3️⃣ Configure environment variables

Create a .env file from copy of .env.example

### 4️⃣ Run the development server
pnpm dev


Open http://localhost:5173
 to view your app.

### 5️⃣ Build for production
pnpm build
pnpm preview

---

## 📈 Deployment

This project is deployed on Vercel using @sveltejs/adapter-vercel.

To deploy:

Connect your GitHub repo to Vercel.

Set environment variables in Vercel (same as .env above).

Click Deploy.

## 💡 Notes

The time logs handle tasks that span across multiple days.

Duration is automatically calculated and displayed in HH:MM:SS format.

Ensure you use Node.js v20 or v22 for building the project.

## 📝 Author

Srinivas Mundlamuri
