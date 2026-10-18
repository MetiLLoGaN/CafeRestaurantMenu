import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import {
  DEFAULT_BRANDING,
  applyTheme,
  clearTheme,
} from '../utils/branding';

/* ══════════════════════════════════════════════════════════════════
   BrandingContext — the authenticated restaurant's persistent
   branding, fetched from MongoDB (never from browser storage alone).

   - Applies the saved theme to <html> whenever the admin session is
     active, and clears it on logout.
   - previewBranding() applies an UNSAVED palette (settings-page live
     preview / public menu) without touching persisted state.
   - restoreBranding() snaps back to the saved theme (or the app
     defaults when logged out) — used when leaving a preview surface.
══════════════════════════════════════════════════════════════════ */

const BrandingContext = createContext(null);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export const BrandingProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  /* Load + apply the saved branding whenever a session is active */
  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setBranding(DEFAULT_BRANDING);
      clearTheme();
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    api
      .get('/branding')
      .then(({ data }) => {
        if (cancelled) return;
        const next = data.branding || DEFAULT_BRANDING;
        setBranding(next);
        applyTheme(next);
      })
      .catch((error) => {
        if (cancelled) return;
        /* Fall back to defaults so the admin stays fully usable */
        console.error('Failed to load branding:', error);
        setBranding(DEFAULT_BRANDING);
        clearTheme();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* Persist color changes ({ colors… } or { reset: true }) */
  const saveColors = useCallback(async (payload) => {
    try {
      const { data } = await api.put('/branding', payload);
      setBranding(data.branding);
      applyTheme(data.branding);
      return { success: true, branding: data.branding };
    } catch (error) {
      return { success: false, message: errorMessage(error, 'Save failed') };
    }
  }, []);

  /* Upload / replace the restaurant logo (multipart) */
  const uploadLogo = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/branding/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBranding(data.branding);
      return { success: true, branding: data.branding };
    } catch (error) {
      return { success: false, message: errorMessage(error, 'Upload failed') };
    }
  }, []);

  /* Remove the custom logo → default brand mark */
  const removeLogo = useCallback(async () => {
    try {
      const { data } = await api.delete('/branding/logo');
      setBranding(data.branding);
      return { success: true, branding: data.branding };
    } catch (error) {
      return { success: false, message: errorMessage(error, 'Remove failed') };
    }
  }, []);

  /* Apply an unsaved palette (preview) without persisting it */
  const previewBranding = useCallback((next) => {
    applyTheme(next || DEFAULT_BRANDING);
  }, []);

  /* Re-apply the saved theme (or defaults when logged out) */
  const restoreBranding = useCallback(() => {
    applyTheme(branding || DEFAULT_BRANDING);
  }, [branding]);

  const value = {
    branding,
    loading,
    saveColors,
    uploadLogo,
    removeLogo,
    previewBranding,
    restoreBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
