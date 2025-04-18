/**
 * Root layout for the entire application
 */

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Nexus - Cognitive Agent Architecture',
  description: 'An advanced cognitive agent architecture framework',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
