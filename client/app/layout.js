import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Apex Fitness - Forge Your Limits',
  description: 'Premium gym memberships. 5 locations across Nigeria. World-class equipment and expert trainers.',
  keywords: 'gym, fitness, membership, Nigeria, Lagos, Abuja, personal training',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
