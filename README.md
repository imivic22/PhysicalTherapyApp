# Medical App - Healthcare Dashboard

A comprehensive healthcare management system built with Next.js, React, and Tailwind CSS. This application provides a modern interface for healthcare providers and patients to manage medical information, appointments, and treatment plans.

## Features

### 🔐 Authentication System
- **Login Page** (`/auth/login`) - Professional login interface with email/password
- **Signup Page** (`/auth/signup`) - Account creation with role selection (Patient/Provider)
- **Forgot Password** (`/auth/forgot-password`) - Password reset functionality
- **Social Login** - Google and Twitter integration (UI ready)
- **Remember Me** - Session persistence option

### 🏥 Healthcare Dashboard
- **Provider Dashboard** - Complete overview of patient data and appointments
- **Patient Management** - View and manage patient information
- **Appointment Scheduling** - Track and manage appointments
- **Treatment Plans** - Monitor patient progress and recovery
- **Statistics Overview** - Key metrics and performance indicators

### 🎨 Design & UX
- **Modern UI** - Clean, professional healthcare-themed design
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Accessibility** - WCAG compliant with proper focus states and labels
- **Loading States** - Smooth transitions and loading indicators

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Ready for Supabase integration
- **Deployment**: Vercel ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd medical-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (for future implementation)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
medical-app/
├── app/
│   ├── auth/                 # Authentication pages
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   └── forgot-password/ # Password reset
│   ├── dashboard/           # Main dashboard
│   ├── components/          # Reusable components
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects to login)
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## Authentication Flow

1. **Landing Page** (`/`) - Redirects to login
2. **Login** (`/auth/login`) - Email/password authentication
3. **Dashboard** (`/dashboard`) - Main application after login
4. **Logout** - Returns to login page

## Next Steps

### Immediate TODOs
- [ ] Integrate Supabase authentication
- [ ] Add form validation and error handling
- [ ] Implement protected routes
- [ ] Add user profile management

### Future Features
- [ ] Patient portal with limited access
- [ ] Appointment booking system
- [ ] Medical records management
- [ ] Real-time notifications
- [ ] Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
