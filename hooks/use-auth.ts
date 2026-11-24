"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase/client";
import { subscribeToAuthChanges } from "@/lib/firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;

    return subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return { user, loading, configured: firebaseConfigured };
}
