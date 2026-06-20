# Aman Library - College Library Management System

A premium, full-stack library management system built with Next.js 14, Supabase, and Twilio.

## 🚀 Features

- **Islamic/Academic Aesthetic**: Clean, professional design using Dark Green, Gold, and Cream tones.
- **Student Portal**:
  - Browse books by 10 specific categories.
  - Live search and filtering.
  - One-click book ordering.
  - "My Books" dashboard with circulation deadlines and color-coded status.
- **Admin Dashboard**:
  - Real-time statistics overview.
  - Category breakdown with stock levels.
  - **Orders Queue**: Confirm book issues with automated 21-day deadlines.
  - **Active Loans**: Track all issued books and mark them as returned.
  - **3rd Week Alerts**: Identify students holding books for >14 days.
  - **WhatsApp Integration**: Send manual "Nudges" via Twilio API.
  - **Book Management**: Full CRUD for the library collection.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database/Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Messaging**: Twilio API (WhatsApp)

## 📦 Setup Instructions

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Supabase Setup**:
   - Create a new project on [Supabase](https://supabase.com/).
   - Run the provided SQL (found in the prompt or project specification) in the Supabase SQL Editor.
   - Enable Auth with Email/Password.
4. **Environment Variables**:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The system uses three main tables:
- `students`: User profiles and roles (student/admin).
- `books`: Library collection with status tracking.
- `transactions`: Circulation records including dates and return deadlines.

---
Managed by Aman College Administration.
# amanlibrary
