import type { Dog, HealthRecord, FeedingSchedule, VaccinationRecord } from '@/types';
import type { ShelterAnimalSearchResult } from '@/types/shelter-animals';

/**
 * 將收容所動物轉換為配對系統使用的 Dog 格式
 */
export function convertShelterAnimalToDog(shelterAnimal: ShelterAnimalSearchResult): Dog {
  // 生成唯一 ID
  const id = `shelter-${shelterAnimal.id}`;
  
  // 創建預設的健康記錄
  const defaultHealthRecord: HealthRecord = {
    lastCheckup: shelterAnimal.adoption_start_date || '未提供',
    conditions: [],
    notes: `收容所動物 - ${shelterAnimal.notes || '無特殊說明'}`
  };

  // 創建預設的餵食記錄
  const defaultFeedingSchedule: FeedingSchedule = {
    foodType: '待收容所提供',
    timesPerDay: 2,
    portionSize: '依體型調整',
    notes: '請向收容所詢問詳細餵食資訊'
  };

  // 創建疫苗記錄 - 基於收容所的基本疫苗接種
  const vaccinationRecords: VaccinationRecord[] = [];
  if (shelterAnimal.is_neutered) {
    vaccinationRecords.push({
      vaccineName: '基礎疫苗',
      dateAdministered: '已接種',
      nextDueDate: '請向收容所查詢'
    });
  }

  // 生成個性特徵
  const personalityTraits: string[] = [];
  if (shelterAnimal.is_neutered) personalityTraits.push('已絕育');
  if (shelterAnimal.age_category === 'CHILD') personalityTraits.push('年幼活潑');
  if (shelterAnimal.age_category === 'ADULT') personalityTraits.push('成年穩重');
  if (shelterAnimal.size === 'SMALL') personalityTraits.push('小型');
  if (shelterAnimal.size === 'MEDIUM') personalityTraits.push('中型');
  if (shelterAnimal.size === 'BIG') personalityTraits.push('大型');
  if (shelterAnimal.gender === 'M') personalityTraits.push('男生');
  if (shelterAnimal.gender === 'F') personalityTraits.push('女生');

  // 如果沒有個性特徵，添加預設值
  if (personalityTraits.length === 0) {
    personalityTraits.push('待發掘的個性');
  }

  // 生成名字
  const generateName = () => {
    if (shelterAnimal.breed) return `${shelterAnimal.breed}寶貝`;
    return `${shelterAnimal.animal_type}寶貝`;
  };

  return {
    id,
    name: generateName(),
    breed: shelterAnimal.breed || shelterAnimal.animal_type,
    age: shelterAnimal.age_category === 'CHILD' ? 1 : 3, // 估算年齡
    gender: shelterAnimal.gender === 'M' ? 'Male' : shelterAnimal.gender === 'F' ? 'Female' : 'Unknown',
    photos: shelterAnimal.image_url ? [shelterAnimal.image_url] : ['/placeholder-dog.jpg'],
    description: `來自${shelterAnimal.shelter_name}的可愛${shelterAnimal.animal_type}。流水編號：${shelterAnimal.serial_number}`,
    healthRecords: defaultHealthRecord,
    feedingSchedule: defaultFeedingSchedule,
    vaccinationRecords,
    status: 'Available', // 收容所動物都是可領養狀態
    location: `${shelterAnimal.city_name} - ${shelterAnimal.shelter_name}`,
    personalityTraits,
    animalType: shelterAnimal.animal_type === '貓' ? 'cat' : 'dog'
  };
}