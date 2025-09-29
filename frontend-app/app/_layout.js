import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { authAPI } from '../src/api/auth';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);  // null = chưa biết
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // mỗi khi route thay đổi, kiểm tra lại token
    const syncAuthThenNavigate = async () => {
      try {
        const loggedIn = await authAPI.isLoggedIn();
        setIsLoggedIn(loggedIn);
        console.log('✅ Auth status checked:', loggedIn);

        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';

        console.log('🧭 Navigation check:', {
          segments,
          inAuthGroup,
          inTabsGroup,
          isLoggedIn: loggedIn,
        });

        if (loggedIn && inAuthGroup) {
          // Đã đăng nhập mà còn đứng trong nhóm auth → đưa sang tabs
          router.replace('/(tabs)/profile');
        } else if (!loggedIn && inTabsGroup) {
          // Chưa đăng nhập mà đứng trong tabs → đá về login
          router.replace('/(auth)/login');
        } else if (!loggedIn && !inAuthGroup && !inTabsGroup) {
          // Chưa đăng nhập mà ở màn hình lạ → cũng về login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setIsLoggedIn(false);
        router.replace('/(auth)/login');
      }
    };

    syncAuthThenNavigate();
  }, [segments, router]);

  if (isLoggedIn === null) {
    return null; // có thể trả về splash/loading component nếu muốn
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}