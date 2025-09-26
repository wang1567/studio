'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, Building2, Award, Star, Loader2, AlertCircle, Filter, Map, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PetServiceService } from '@/lib/pet-service-service';
import GoogleMapsComponent from '@/components/veterinary-hospital/GoogleMapsComponent';
import type { PetService } from '@/types/pet-service';
import { BUSINESS_TYPES, RATING_LEVELS, TAIPEI_DISTRICTS } from '@/types/pet-service';

export default function PetServiceSearch() {
  const [petServices, setPetServices] = useState<PetService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 篩選狀態
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  
  // 可用選項
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const pageSize = 20;

  // 載入可用縣市
  useEffect(() => {
    const loadCities = async () => {
      const response = await PetServiceService.getAvailableCities();
      if (!response.error) {
        setAvailableCities(response.data);
      }
    };
    loadCities();
  }, []);

  // 當選擇縣市時載入行政區
  useEffect(() => {
    if (selectedCity && selectedCity !== 'all') {
      const loadDistricts = async () => {
        const response = await PetServiceService.getDistrictsByCity(selectedCity);
        if (!response.error) {
          setAvailableDistricts(response.data);
        }
      };
      loadDistricts();
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('all');
    }
  }, [selectedCity]);

  // 搜尋寵物服務業者
  const searchPetServices = useCallback(async (
    keyword = '', 
    city = 'all', 
    district = 'all', 
    businessType = 'all', 
    rating = 'all', 
    page = 1
  ) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      // 構建搜尋參數
      const searchParams = {
        q: keyword.trim() || undefined,
        縣市: (city && city !== 'all') ? city : undefined,
        行政區: (district && district !== 'all') ? district : undefined,
        營業項目: (businessType && businessType !== 'all') ? businessType : undefined,
        評鑑等級: (rating && rating !== 'all') ? rating : undefined,
        limit: 200, // 獲取更多資料以便客戶端分頁
        offset: 0
      };

      response = await PetServiceService.searchPetServices(searchParams);

      if (response.error) {
        setError(response.error);
        setPetServices([]);
        setTotalCount(0);
      } else {
        let filteredData = response.data;

        // 額外的關鍵字篩選（如果 API 不支援）
        if (keyword && keyword.trim() !== '') {
          const keywordLower = keyword.trim().toLowerCase();
          filteredData = filteredData.filter(service =>
            service.許可證登記公司名.toLowerCase().includes(keywordLower) ||
            service.地址.toLowerCase().includes(keywordLower) ||
            service.營業項目.toLowerCase().includes(keywordLower)
          );
        }

        // 分頁處理
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setPetServices(paginatedData);
        setTotalCount(filteredData.length);
        setCurrentPage(page);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜尋失敗';
      setError(errorMessage);
      setPetServices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 載入初始資料
  useEffect(() => {
    searchPetServices();
  }, [searchPetServices]);

  // 處理搜尋
  const handleSearch = () => {
    setCurrentPage(1);
    searchPetServices(
      searchKeyword, 
      selectedCity, 
      selectedDistrict, 
      selectedBusinessType, 
      selectedRating, 
      1
    );
  };

  // 處理重設
  const handleReset = () => {
    setSearchKeyword('');
    setSelectedCity('all');
    setSelectedDistrict('all');
    setSelectedBusinessType('all');
    setSelectedRating('all');
    setCurrentPage(1);
    searchPetServices('', 'all', 'all', 'all', 'all', 1);
  };

  // 處理分頁
  const handlePageChange = (page: number) => {
    searchPetServices(
      searchKeyword, 
      selectedCity, 
      selectedDistrict, 
      selectedBusinessType, 
      selectedRating, 
      page
    );
  };

  // 獲取評鑑等級的顏色
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '特優': return 'bg-purple-100 text-purple-800';
      case '優等': return 'bg-green-100 text-green-800';
      case '甲等': return 'bg-blue-100 text-blue-800';
      case '乙等': return 'bg-yellow-100 text-yellow-800';
      case '丙等': return 'bg-gray-100 text-gray-800';
      case '新設': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取營業項目的顏色
  const getBusinessTypeColor = (businessType: string) => {
    if (businessType.includes('寄養') && businessType.includes('買賣')) {
      return 'bg-indigo-100 text-indigo-800';
    } else if (businessType.includes('寄養')) {
      return 'bg-emerald-100 text-emerald-800';
    } else if (businessType.includes('買賣')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-blue-600" />
          寵物專區 - 特殊寵物業者資訊
        </h1>
        <p className="text-gray-600">查詢台北市合法登記的特殊寵物業者資訊，包含寄養、寵物用品買賣等服務</p>
      </div>

      {/* 搜尋區域 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Search className="mr-2 h-5 w-5" />
            搜尋寵物服務業者
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* 關鍵字搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                關鍵字搜尋
              </label>
              <Input
                type="text"
                placeholder="公司名稱、地址或營業項目..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* 縣市篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                縣市
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇縣市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部縣市</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 行政區篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                行政區
              </label>
              <Select 
                value={selectedDistrict} 
                onValueChange={setSelectedDistrict}
                disabled={!selectedCity || selectedCity === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇行政區" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部行政區</SelectItem>
                  {availableDistricts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 營業項目篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                營業項目
              </label>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇營業項目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部營業項目</SelectItem>
                  {Object.entries(BUSINESS_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 評鑑等級篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                評鑑等級
              </label>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇評鑑等級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等級</SelectItem>
                  {Object.entries(RATING_LEVELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 搜尋按鈕 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 invisible">
                操作
              </label>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  搜尋
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  重設
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 錯誤訊息 */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 結果統計 */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? (
            '搜尋中...'
          ) : (
            `共找到 ${totalCount} 家寵物服務業者${currentPage > 1 ? `，第 ${currentPage} 頁` : ''}`
          )}
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 頁
          </div>
        )}
      </div>

      {/* 寵物服務業者列表 */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            列表檢視
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            地圖檢視
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">載入中...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {petServices.map((service, index) => (
                  <Card key={`${service.id}-${index}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-start justify-between">
                        <span className="text-blue-700 leading-tight">
                          {service.許可證登記公司名}
                        </span>
                        <div className="ml-2 flex flex-col gap-1">
                          <Badge className={getRatingColor(service.評鑑等級)}>
                            <Award className="h-3 w-3 mr-1" />
                            {service.評鑑等級}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{service.縣市} {service.行政區}</div>
                          <div className="text-xs text-gray-500">郵遞區號：{service.郵遞區號}</div>
                          <div className="leading-relaxed mt-1">{service.地址}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {service.電話 || '未提供'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <Badge className={getBusinessTypeColor(service.營業項目)}>
                            {service.營業項目}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          業字號：{service.特寵業字號及有效期限}
                        </div>
                      </div>

                      {/* 導航按鈕 */}
                      <div className="pt-3 border-t border-gray-100">
                        <Button
                          onClick={() => {
                            const destination = encodeURIComponent(`${service.地址}, ${service.縣市}`);
                            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                            
                            if (isMobile) {
                              // 行動設備：嘗試開啟 Google Maps App
                              const googleMapsApp = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
                              const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
                              
                              const appLink = document.createElement('a');
                              appLink.href = googleMapsApp;
                              appLink.style.display = 'none';
                              document.body.appendChild(appLink);
                              
                              appLink.click();
                              
                              setTimeout(() => {
                                window.open(googleMapsWeb, '_blank');
                                document.body.removeChild(appLink);
                              }, 2000);
                            } else {
                              // 桌面設備：直接開啟網頁版
                              const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
                              window.open(googleMapsWeb, '_blank');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          size="sm"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          開啟 Google Maps 導航
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分頁控制 */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      上一頁
                    </Button>
                    
                    {/* 頁碼按鈕 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}

              {/* 無結果提示 */}
              {!loading && petServices.length === 0 && !error && (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">沒有找到符合條件的寵物服務業者</p>
                  <p className="text-sm text-gray-500 mt-2">請嘗試調整搜尋條件</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          <div className="h-96 md:h-[500px] lg:h-[600px]">
            <GoogleMapsComponent 
              hospitals={petServices.map((service, index) => ({
                _id: service.id || index + 1,
                縣市: service.縣市,
                動物醫院名稱: service.許可證登記公司名,
                地址: service.地址,
                電話: service.電話 || '',
                負責人: service.評鑑等級 // 使用評鑑等級作為負責人欄位
              }))} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}