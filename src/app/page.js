import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir a dashboard - Landing page pública se implementará más adelante
  redirect('/dashboard');
}
