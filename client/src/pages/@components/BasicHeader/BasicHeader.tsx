import { APP_TITLE } from 'commonConstantsWithClient';
import type { UserModel } from 'commonTypesWithClient/appModels';
import { logout } from 'src/utils/login';
import styles from './BasicHeader.module.css';

export const BasicHeader = ({ user }: { user: UserModel }) => {
  const onLogout = async () => {
    if (confirm('Logout?')) await logout();
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.logo}>{APP_TITLE}</div>

        <div className={styles.userBtn} onClick={onLogout}>
          <span className={styles.userName}>{user.displayName}</span>
        </div>
      </div>
    </div>
  );
};
