'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShelterAnimalService } from '@/lib/shelter-animal-service';
import type {
  ShelterAnimalSearchResult,
  City,
  Shelter,
  AnimalType,
  AnimalGender,
  AnimalSize,
  AnimalAgeCategory,
  FilterParams
} from '@/types/shelter-animals';
import { Heart, MapPin, Phone, Calendar, Info } from 'lucide-react';
import { usePawsConnect } from '@/context/PawsConnectContext';

interface ShelterAnimalSearchProps {
  onAnimalSelect?: (animal: ShelterAnimalSearchResult) => void;
  showFilters?: boolean;
  maxResults?: number;
}

export function ShelterAnimalSearch({ 
  onAnimalSelect, 
  showFilters = true,
  maxResults = 2500 
}: ShelterAnimalSearchProps) {
  // 使用配對功能
  const { likeShelterAnimal, likedDogs, user } = usePawsConnect();
  const [animals, setAnimals] = useState<ShelterAnimalSearchResult[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    // status: 'OPEN' // 暫時移除狀態篩選來測試
  });
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 24; // 每頁顯示24隻動物

  // 建立搜尋結果區域的 ref
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // 追蹤是否為分頁切換
  const [shouldScrollOnLoad, setShouldScrollOnLoad] = useState(false);

  // 檢查動物是否已被按讚
  const isLiked = (animal: ShelterAnimalSearchResult) => {
    return likedDogs.some(likedDog => likedDog.id === animal.id);
  };

  // 處理按讚動物
  const handleLikeAnimal = async (animal: ShelterAnimalSearchResult) => {
    if (!user) {
      // 這個應該不會發生，因為按鈕已經被禁用了
      return;
    }
    
    await likeShelterAnimal(animal);
  };

  // 處理動物選擇邏輯
  const handleAnimalSelect = (animal: ShelterAnimalSearchResult) => {
    if (onAnimalSelect) {
      onAnimalSelect(animal);
    } else {
      // 默認行為：顯示動物資訊到控制台（可擴展為模態框或路由跳轉）
      console.log('選擇動物:', animal);
      // TODO: 可在此處添加默認的動物詳情顯示邏輯
    }
  };

  // 載入城市列表
  useEffect(() => {
    const loadCities = async () => {
      const { data } = await ShelterAnimalService.getCities();
      setCities(data);
    };
    loadCities();
  }, []);

  // 當城市改變時載入對應的收容所
  useEffect(() => {
    const loadShelters = async () => {
      if (filters.city_code && filters.city_code !== 'all') {
        const { data } = await ShelterAnimalService.getShelters(filters.city_code);
        setShelters(data);
      } else {
        // 如果沒有選擇城市或選擇"全部城市"，載入所有收容所
        const { data } = await ShelterAnimalService.getShelters();
        setShelters(data);
      }
    };
    loadShelters();
  }, [filters.city_code]);

  // 搜尋動物
  const searchAnimals = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const { data, count } = await ShelterAnimalService.searchShelterAnimals({
        ...filters,
        limit: itemsPerPage,
        offset: offset
      });
      setAnimals(data);
      setTotalCount(count || data.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage]);

  // 監聽載入完成，執行滾動
  useEffect(() => {
    if (!loading && shouldScrollOnLoad && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setShouldScrollOnLoad(false);
    }
  }, [loading, shouldScrollOnLoad]);

  // 初始載入及篩選器改變時重新搜尋
  useEffect(() => {
    searchAnimals(1); // 篩選器改變時重置到第一頁
  }, [filters]);

  // 篩選器改變時重置頁面
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // 手動搜尋函數（用於按鈕點擊）
  const handleSearch = () => {
    searchAnimals(1); // 手動搜尋時重置到第一頁
  };

  // 分頁處理函數
  const handlePageChange = (page: number) => {
    setShouldScrollOnLoad(true); // 標記需要滾動
    searchAnimals(page);
  };

  // 重置篩選器
  const resetFilters = () => {
    // setFilters({ status: 'OPEN' }); // 暫時移除狀態篩選
    setFilters({});
    setCurrentPage(1); // 重置到第一頁
  };

  // 性別圖示
  const getGenderIcon = (gender: string) => {
    return gender === 'M' ? '♂️' : gender === 'F' ? '♀️' : '❓';
  };

  // 年齡類別文字
  const getAgeText = (ageCategory: string) => {
    return ageCategory === 'ADULT' ? '成年' : ageCategory === 'CHILD' ? '幼年' : '未知';
  };

  // 體型文字
  const getSizeText = (size: string) => {
    const sizeMap = {
      'SMALL': '小型',
      'MEDIUM': '中型',
      'BIG': '大型'
    };
    return sizeMap[size as keyof typeof sizeMap] || size;
  };

  return (
    <div className="space-y-6">
      {/* 篩選器 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              搜尋篩選
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* 城市選擇 */}
              <div>
                <label className="text-sm font-medium mb-2 block">城市</label>
                <Select
                  value={filters.city_code || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, city_code: value === 'all' ? undefined : value, shelter_id: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇城市" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部城市</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 收容所選擇 */}
              <div>
                <label className="text-sm font-medium mb-2 block">收容所</label>
                <Select
                  value={filters.shelter_id || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, shelter_id: value === 'all' ? undefined : value })}
                  disabled={!filters.city_code || filters.city_code === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.city_code && filters.city_code !== 'all' ? "選擇收容所" : "請先選擇城市"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部收容所</SelectItem>
                    {shelters.map(shelter => (
                      <SelectItem key={shelter.id} value={shelter.id}>
                        {shelter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 動物類型 */}
              <div>
                <label className="text-sm font-medium mb-2 block">動物類型</label>
                <Select
                  value={filters.animal_type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, animal_type: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇動物類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部類型</SelectItem>
                    <SelectItem value="狗">狗</SelectItem>
                    <SelectItem value="貓">貓</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 性別 */}
              <div>
                <label className="text-sm font-medium mb-2 block">性別</label>
                <Select
                  value={filters.gender || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, gender: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇性別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部性別</SelectItem>
                    <SelectItem value="M">公</SelectItem>
                    <SelectItem value="F">母</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 體型 */}
              <div>
                <label className="text-sm font-medium mb-2 block">體型</label>
                <Select
                  value={filters.size || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, size: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇體型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部體型</SelectItem>
                    <SelectItem value="SMALL">小型</SelectItem>
                    <SelectItem value="MEDIUM">中型</SelectItem>
                    <SelectItem value="BIG">大型</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 品種搜尋 */}
              <div>
                <label className="text-sm font-medium mb-2 block">品種</label>
                <Input
                  placeholder="輸入品種名稱..."
                  value={filters.breed || ''}
                  onChange={(e) => setFilters({ ...filters, breed: e.target.value || undefined })}
                />
              </div>

              {/* 年齡類別 */}
              <div>
                <label className="text-sm font-medium mb-2 block">年齡</label>
                <Select
                  value={filters.age_category || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, age_category: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇年齡" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年齡</SelectItem>
                    <SelectItem value="CHILD">幼年</SelectItem>
                    <SelectItem value="ADULT">成年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 是否絕育 */}
              <div>
                <label className="text-sm font-medium mb-2 block">絕育狀況</label>
                <Select
                  value={filters.is_neutered?.toString() || 'all'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    is_neutered: value === 'all' ? undefined : value === 'true'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇絕育狀況" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="true">已絕育</SelectItem>
                    <SelectItem value="false">未絕育</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={loading} className="flex-1">
                  {loading ? '搜尋中...' : '搜尋'}
                </Button>
                <Button onClick={resetFilters} variant="outline">
                  重置
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜尋結果 */}
      <div ref={resultsRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            搜尋結果 (第 {currentPage} 頁，共 {Math.ceil(totalCount / itemsPerPage)} 頁，總計 {totalCount} 隻動物)
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">載入中...</p>
          </div>
        ) : animals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">目前沒有符合條件的動物</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {animals.map(animal => (
              <Card key={animal.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div onClick={() => handleAnimalSelect(animal)}>
                  {/* 動物照片 */}
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {animal.image_url ? (
                      <img
                        src={animal.image_url}
                        alt={`${animal.animal_type} - ${animal.serial_number}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-pet.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-4xl">
                          {animal.animal_type === '狗' ? '🐕' : animal.animal_type === '貓' ? '🐱' : '🐾'}
                        </span>
                      </div>
                    )}
                    {/* 愛心按鈕 */}
                    <Button
                      size="sm"
                      variant={isLiked(animal) ? "default" : "secondary"}
                      className={`absolute top-2 right-2 rounded-full w-8 h-8 p-0 ${
                        isLiked(animal) 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'hover:bg-red-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeAnimal(animal);
                      }}
                      disabled={!user}
                      title={!user ? '請先登入' : isLiked(animal) ? '已加入配對' : '加入配對'}
                    >
                      <Heart className={`h-4 w-4 ${isLiked(animal) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    {/* 基本資訊 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {animal.breed || animal.animal_type}
                        </h4>
                        <span className="text-lg">
                          {getGenderIcon(animal.gender || '')}
                        </span>
                      </div>

                      {/* 標籤 */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">
                          {animal.animal_type}
                        </Badge>
                        {animal.size && (
                          <Badge variant="outline">
                            {getSizeText(animal.size)}
                          </Badge>
                        )}
                        {animal.age_category && (
                          <Badge variant="outline">
                            {getAgeText(animal.age_category)}
                          </Badge>
                        )}
                        {animal.is_neutered && (
                          <Badge variant="default">已絕育</Badge>
                        )}
                      </div>

                      {/* 位置資訊 */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{animal.shelter_name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{animal.city_name}</span>
                      </div>

                      {/* 編號 */}
                      <p className="text-xs text-muted-foreground">
                        編號: {animal.serial_number}
                      </p>

                      {/* 備註 */}
                      {animal.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {animal.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
            </div>
          )}
  
            {/* 分頁控制器 */}
            {!loading && animals.length > 0 && totalCount > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 pt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                上一頁
              </Button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  const pages = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);
                  
                  if (startPage > 1) {
                    pages.push(
                      <Button
                        key={1}
                        variant={1 === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="start-ellipsis" className="px-2">...</span>);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={i === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i)}
                      >
                        {i}
                      </Button>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="end-ellipsis" className="px-2">...</span>);
                    }
                    pages.push(
                      <Button
                        key={totalPages}
                        variant={totalPages === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
              >
                下一頁
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

export default ShelterAnimalSearch;