# CRM Frontend

A modern Next.js frontend for the CRM system with TypeScript, Tailwind CSS, and animations.

## Features

- Responsive design with blue/dark blue theme
- Animated UI components with Framer Motion
- Authentication with JWT
- Role-based access (Admin, Staff, User)
- Form validation with Joi
- API integration with backend
- SEO optimized
- Fast performance with Next.js

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Framer Motion
- React Hook Form
- Joi validation
- Axios for API calls
- Zustand for state management
- React Hot Toast for notifications

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`
3. Start the development server: `npm run dev`
4. Open [http://localhost:3001](http://localhost:3001)

## Pages

- `/` - Login page
- `/register` - Admin registration
- `/dashboard` - Main dashboard
- `/users` - View users/staff
- `/add-staff` - Add staff (admin only)
- `/add-user` - Add user (admin only)

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL

# or

pnpm dev

# or

bun dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```
