import React from 'react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { Footer } from '../components/Footer';
export default function Home() {
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Dashboard />
      </main>
      <Footer />
    </div>;
}