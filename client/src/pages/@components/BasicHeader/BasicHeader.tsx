import { APP_TITLE } from 'commonConstantsWithClient';
import type { UserModel } from 'commonTypesWithClient/appModels';
import { logout } from 'src/utils/login';
import { AuthorIcon } from '../AuthorIcon';
import styles from './basicHeader.module.css';

export const BasicHeader = ({ user }: { user: UserModel }) => {
  const onLogout = async () => {
    if (confirm('Logout?')) await logout();
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.logo}>{APP_TITLE}</div>

        <div className={styles.userBtn} onClick={onLogout}>
          <AuthorIcon size={24} photoURL={user.photoURL} />
          <span className={styles.userName}>{user.displayName}</span>
        </div>
      </div>
    </div>
  );
};
