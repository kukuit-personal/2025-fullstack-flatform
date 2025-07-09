import React from 'react';
import styles from './menu-right.module.scss';

const MenuRight = () => {
  return (
    <div className={styles.menuRight}>
      <p>User: <strong>Guest</strong></p>
      <a href="/login">Login</a>
    </div>
  );
};

export default MenuRight;