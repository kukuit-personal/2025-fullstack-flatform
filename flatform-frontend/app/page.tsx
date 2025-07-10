import Image from "next/image";
import {useTranslations} from 'next-intl';

import GuestLayout from "@/components/layouts/guest/GuestLayout";

export default function Home() {
  const t = useTranslations('login');

  return (
    <GuestLayout>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1>[Home Page] - {t('login')}</h1>
        <h1 className="text-4xl font-bold mt-4">Welcome to Flatform</h1>
        <p className="text-lg mt-2">Your platform for full-stack development</p>
      </div>
    </GuestLayout>
  );
}
