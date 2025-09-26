import { Metadata } from 'next';
import VeterinaryHospitalSearch from '@/components/veterinary-hospital/VeterinaryHospitalSearch';

export const metadata: Metadata = {
  title: '臺北市動物醫院資訊 | PawsConnect',
  description: '查詢台北市合法登記的動物醫院資訊，包含醫院名稱、地址、電話及負責人資料。',
  keywords: ['動物醫院', '台北市', '寵物', '獸醫', '寵物醫療'],
};

export default function VeterinaryHospitalPage() {
  return <VeterinaryHospitalSearch />;
}