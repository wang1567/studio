import { Metadata } from 'next';
import PetServiceSearch from '@/components/pet-service/PetServiceSearch';

export const metadata: Metadata = {
  title: '寵物專區 - 特殊寵物業者資訊 | PawsConnect',
  description: '查詢台北市合法登記的特殊寵物業者，包含寵物寄養、買賣等服務資訊，提供評鑑等級、聯絡方式及營業項目查詢。',
  keywords: '寵物服務, 特殊寵物業, 寵物寄養, 寵物買賣, 台北市, 寵物專區',
  openGraph: {
    title: '寵物專區 - 特殊寵物業者資訊',
    description: '查詢台北市合法登記的特殊寵物業者，包含寵物寄養、買賣等服務資訊',
    type: 'website',
    locale: 'zh_TW',
  }
};

export default function PetServicePage() {
  return <PetServiceSearch />;
}