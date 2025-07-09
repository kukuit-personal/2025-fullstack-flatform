import React from 'react';
import styles from './guest-layout.module.scss';
import Header from './header/Header';
import Menu from './menu/Menu';
import Banner from './banner/Banner';
import MenuRight from './menu-right/MenuRight';
import Footer from './footer/Footer';

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.wrapper}>
      <Header />
      <Menu />
      <Banner />
      <div className={styles.container}>
        <div className={styles.content}>{children}</div>
        <div className={styles.sidebar}>
          <MenuRight />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GuestLayout;