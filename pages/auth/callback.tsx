import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth/email confirmation callback
    const handleCallback = async () => {
      if (typeof window === 'undefined') return;

      // Get the URL hash and query parameters
      const { hash } = window.location;

      if (hash && hash.includes('access_token')) {
        // Exchange the code for a session
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // No hash, just redirect to dashboard (might already be logged in)
        router.push('/dashboard');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <Head>
        <title>处理中... - Info Radar</title>
      </Head>
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">📡</div>
        <p className="text-gray-500">正在处理登录...</p>
      </div>
    </div>
  );
}
