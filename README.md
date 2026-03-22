# NaijaWatts ⚡

> Generator & Power Cost Tracker for Nigerian households and businesses

Nigeria has some of the worst electricity supply in the world — NaijaWatts helps you track exactly how many hours of NEPA you get, how much you're spending on generator fuel, and when it's smarter to switch to solar.

## Real Problem Solved
- Average Nigerian home runs generator 8–16 hours/day
- No easy way to track fuel costs over time
- Hard to know if solar + inverter investment is worth it

## Features
- ⚡ Log NEPA hours vs generator hours per day
- ⛽ Log fuel purchases (litres × price = auto total cost)
- 📊 Weekly stacked bar chart: NEPA vs Generator split
- 💰 Real-time cost estimates and monthly projections
- ☀️ Solar payback period calculator
- 🔔 Daily cost alert: "You're spending ₦X/day on fuel"
- ⚙️ Configurable: gen size, fuel consumption, NEPA bill, location

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**

## Getting Started
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Click Deploy — zero config!

## Extend It
- Add localStorage/Supabase for data persistence
- Push notifications when fuel price changes in your area
- Connect to AEDC/BEDC API for outage alerts
- Export monthly cost report as PDF
