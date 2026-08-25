import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { setting } from '@/src/db/database';
import { Loading, Screen } from '@/src/components/UI';

export default function Index() {
  const [destination, setDestination] = useState<'/(tabs)' | '/onboarding' | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const complete = await setting('onboarding_complete', '0');
        if (!mounted) return;
        setDestination(complete === '1' ? '/(tabs)' : '/onboarding');
      } catch {
        if (mounted) setDestination('/onboarding');
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination]);

  return (
    <Screen>
      <Loading />
    </Screen>
  );
}
