import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/landing');
      }
    }
  }, [user, loading, router]);

  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="text-6xl mb-4">📡</div>
        <div className="text-gray-400">加载中...</div>
      </div>
    </div>
  );
}
