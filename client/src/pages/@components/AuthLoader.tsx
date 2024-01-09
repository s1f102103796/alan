import { onAuthStateChanged } from 'firebase/auth';
import { useAtom } from 'jotai';
import { useEffect, useReducer } from 'react';
import { userAtom } from 'src/atoms/user';
import { apiClient } from 'src/utils/apiClient';
import { createAuth } from 'src/utils/firebase';
import { returnNull } from 'src/utils/returnNull';
import { Loading } from '../../components/Loading/Loading';

export const AuthLoader = () => {
  const [, setUser] = useAtom(userAtom);
  const [isInitedAuth, dispatchIsInitedAuth] = useReducer(() => true, false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(createAuth(), async (fbUser) => {
      if (fbUser) {
        await fbUser
          .getIdToken()
          .then((idToken) => apiClient.session.$post({ body: { idToken } }))
          .catch(returnNull);
        await apiClient.me.$post().catch(returnNull).then(setUser);
      } else {
        await apiClient.session.$delete();
        setUser(null);
      }

      dispatchIsInitedAuth();
    });

    return unsubscribe;
  }, [setUser]);

  return <Loading visible={!isInitedAuth} />;
};
