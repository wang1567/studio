import { Metadata } from 'next';
import TASAdoptionSearch from '@/components/tas-adoption/TASAdoptionSearch';

export const metadata: Metadata = {
  title: 'TAS浪愛滿屋推廣動物認養計畫 - PawsConnect',
  description: '臺北市委託民間設置認養中心，推廣動物認養計畫',
};

export default function TASAdoptionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TASAdoptionSearch />
    </div>
  );
}