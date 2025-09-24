'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Building2, Hash, Loader2, AlertCircle, User, Map, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PetRegistrationService } from '@/lib/pet-registration-service';
import GoogleMapsComponent from '@/components/veterinary-hospital/GoogleMapsComponent';
import type { PetRegistration } from '@/types/pet-registration';

export default function PetRegistrationSearch() {
  const [petRegistrations, setPetRegistrations] = useState<PetRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 篩選狀態
  const [selectedCity, setSelectedCity] = useState('all');
  
  // 可用選項
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const pageSize = 20;

  // 載入可用縣市
  useEffect(() => {
    const loadCities = async () => {
      const response = await PetRegistrationService.getAvailableCities();
      if (!response.error) {
        setAvailableCities(response.data);
      }
    };
    loadCities();
  }, []);

  // 初始載入
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (
    keyword: string = searchKeyword,
    city: string = selectedCity,
    page: number = 1
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 構建搜尋參數
      const searchParams = {
        q: keyword.trim() || undefined,
        縣市: (city && city !== 'all') ? city : undefined,
        limit: 200, // 獲取更多資料以便客戶端分頁
        offset: 0
      };

      const response = await PetRegistrationService.searchPetRegistrations(searchParams);

      if (response.error) {
        setError(response.error);
        setPetRegistrations([]);
        setTotalCount(0);
      } else {
        let filteredData = response.data;

        // 額外的關鍵字篩選（如果 API 不支援）
        if (keyword && keyword.trim() !== '') {
          const keywordLower = keyword.trim().toLowerCase();
          filteredData = filteredData.filter(station =>
            station.動物醫院名稱.toLowerCase().includes(keywordLower) ||
            station.地址.toLowerCase().includes(keywordLower) ||
            station.電話.toLowerCase().includes(keywordLower) ||
            (station.負責人 && station.負責人.toLowerCase().includes(keywordLower))
          );
        }

        // 分頁處理
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setPetRegistrations(paginatedData);
        setTotalCount(filteredData.length);
        setCurrentPage(page);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜尋失敗';
      setError(errorMessage);
      setPetRegistrations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(searchKeyword, selectedCity, page);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedCity('all');
    setCurrentPage(1);
    handleSearch('', 'all', 1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-blue-600" />
          臺北市寵物登記站（動物醫院）
        </h1>
        <p className="text-lg text-gray-600">
          查詢提供寵物登記服務的動物醫院資訊，包含地址、電話、負責人等詳細資料
        </p>
        <div className="mt-4 text-sm text-gray-500">
          共找到 {totalCount} 家動物醫院
        </div>
      </div>

      {/* 搜尋介面 */}
      <Card className="mb-8 shadow-lg border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-xl text-blue-800 flex items-center">
            <Search className="mr-2 h-5 w-5" />
            搜尋條件
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* 關鍵字搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                關鍵字
              </label>
              <Input
                placeholder="搜尋醫院名稱、地址或負責人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
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

            {/* 搜尋按鈕 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 invisible">
                操作
              </label>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleSearch()}
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

      {/* 載入狀態 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">搜尋中...</span>
        </div>
      )}

      {/* 搜尋結果 */}
      {!loading && (
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
            {petRegistrations.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {petRegistrations.map((station) => (
                    <Card key={station._id} className="hover:shadow-lg transition-shadow duration-200 border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-start justify-between">
                          <span className="text-blue-700 leading-tight">
                            {station.動物醫院名稱}
                          </span>
                          <div className="ml-2 flex flex-col gap-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Hash className="h-3 w-3 mr-1" />
                              負責人: {station.負責人}
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {station.縣市}
                            </div>
                            <div className="text-sm text-gray-600">
                              {station.地址}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {station.電話 || '未提供'}
                          </span>
                        </div>

                        {/* 導航按鈕 */}
                        <div className="pt-3 border-t border-gray-100">
                          <Button
                            onClick={() => {
                              const destination = encodeURIComponent(`${station.地址}, ${station.縣市}`);
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
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
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
              </>
            ) : (
              /* 無結果 */
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">找不到相關的動物醫院</h3>
                <p className="text-gray-500">請嘗試調整搜尋條件或重新搜尋</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map" className="space-y-4">
            <div className="h-96 md:h-[500px] lg:h-[600px]">
              <GoogleMapsComponent 
                hospitals={petRegistrations.map((station, index) => ({
                  _id: typeof station._id === 'string' ? parseInt(station._id) || index + 1 : station._id,
                  縣市: station.縣市,
                  動物醫院名稱: station.動物醫院名稱,
                  地址: station.地址,
                  電話: station.電話 || '',
                  負責人: station.負責人 || ''
                }))} 
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}