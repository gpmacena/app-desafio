import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Participant } from '@/lib/types';
import { getParticipant, PARTICIPANTS } from '@/lib/participants';
import { db, ref, onValue, set, onDisconnect } from '@/lib/firebase';

const PREFIX = 'fitchallenge_';

function fbKey(k: string): string {
  return k.replace(/\//g, '-').replace(/\./g, '_');
}

interface UserContextType {
  currentUser: Participant | null;
  syncVersion: number;
  onlineUsers: Record<string, boolean>;
  login: (userId: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  syncVersion: 0,
  onlineUsers: {},
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Participant | null>(() => {
    const saved = localStorage.getItem('fitchallenge_currentUser');
    if (saved) return getParticipant(saved) ?? null;
    return null;
  });
  const [syncVersion, setSyncVersion] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  // Sincroniza dados de todos os participantes do Firebase → localStorage
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    PARTICIPANTS.forEach(p => {
      const unsub = onValue(ref(db, `data/${p.id}`), (snap) => {
        const data = snap.val() || {};
        Object.entries(data).forEach(([fbField, value]) => {
          // Converte chave Firebase de volta para localStorage (- volta a /)
          const lsField = fbField.replace(/-/g, '/');
          localStorage.setItem(`${PREFIX}data_${p.id}_${lsField}`, JSON.stringify(value));
        });
        setSyncVersion(v => v + 1);
      });
      unsubscribers.push(unsub);
    });

    // Presença de todos os participantes
    const presenceUnsub = onValue(ref(db, 'presence'), (snap) => {
      setOnlineUsers(snap.val() || {});
    });
    unsubscribers.push(presenceUnsub);

    return () => unsubscribers.forEach(u => u());
  }, []);

  // Presença do usuário logado
  useEffect(() => {
    if (!currentUser) return;
    const presenceRef = ref(db, `presence/${currentUser.id}`);
    set(presenceRef, true).catch(console.error);
    onDisconnect(presenceRef).remove();
    return () => {
      set(presenceRef, false).catch(console.error);
    };
  }, [currentUser]);

  const login = useCallback((userId: string) => {
    const p = getParticipant(userId);
    if (p) {
      setCurrentUser(p);
      localStorage.setItem('fitchallenge_currentUser', userId);
    }
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      set(ref(db, `presence/${currentUser.id}`), false).catch(console.error);
    }
    setCurrentUser(null);
    localStorage.removeItem('fitchallenge_currentUser');
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, syncVersion, onlineUsers, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
