import { APP_TITLE } from 'commonConstantsWithClient';
import type { UserModel } from 'commonTypesWithClient/appModels';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { useLoading } from 'src/pages/@hooks/useLoading';
import { loginWithGitHub, logout } from 'src/utils/login';
import { AuthorIcon } from '../AuthorIcon';
import styles from './basicHeader.module.css';

export const BasicHeader = (props: { user: UserModel | null }) => {
  const { loadingElm, addLoading, removeLoading } = useLoading();
  const login = async () => {
    addLoading();
    await loginWithGitHub();
    removeLoading();
  };
  const onLogout = async () => {
    if (confirm('Logout?')) await logout();
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.logo}>{APP_TITLE}</div>
        {props.user === null ? (
          <div onClick={login}>
            <div className={styles.loginBtn}>
              <GithubIcon size={18} fill="#fff" />
              <span>Login with GitHub</span>
            </div>
          </div>
        ) : (
          <div className={styles.userBtn} onClick={onLogout}>
            <AuthorIcon size={24} photoURL={props.user.photoURL} />
            <span className={styles.userName}>{props.user.displayName}</span>
          </div>
        )}
      </div>
      {loadingElm}
    </div>
  );
};
