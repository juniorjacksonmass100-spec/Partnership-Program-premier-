import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptic feedback utility for mobile web & Capacitor native APK
 */
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' = 'light'
) => {
  try {
    // 1. Try Capacitor Native Haptics
    if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    }
    if (type === 'selection') {
      await Haptics.selectionChanged();
      return;
    }

    const style =
      type === 'heavy'
        ? ImpactStyle.Heavy
        : type === 'medium'
        ? ImpactStyle.Medium
        : ImpactStyle.Light;

    await Haptics.impact({ style });
  } catch {
    // 2. Fallback to Web Vibration API if supported
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'heavy') navigator.vibrate(25);
        else if (type === 'medium') navigator.vibrate(15);
        else if (type === 'success') navigator.vibrate([10, 30, 20]);
        else navigator.vibrate(8);
      }
    } catch {
      // Ignore vibration errors silently
    }
  }
};
