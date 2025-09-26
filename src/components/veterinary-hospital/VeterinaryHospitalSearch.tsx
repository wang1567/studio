'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, User, Building2, Loader2, AlertCircle, Map, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VeterinaryHospitalService } from '@/lib/veterinary-hospital-service';
import GoogleMapsComponent from './GoogleMapsComponent';
import type { VeterinaryHospital } from '@/types/veterinary-hospital';

export default function VeterinaryHospitalSearch() {
  const [hospitals, setHospitals] = useState<VeterinaryHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState('');

  // 台北市行政區列表
  const taipeiDistricts = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
  ];

  const pageSize = 20;

  // 搜尋動物醫院
  const searchHospitals = useCallback(async (keyword = '', area = '', page = 1) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (area && area !== '') {
        response = await VeterinaryHospitalService.searchByArea(area);
      } else if (keyword && keyword.trim() !== '') {
        response = await VeterinaryHospitalService.searchByKeyword(keyword.trim(), 200);
      } else {
        response = await VeterinaryHospitalService.getAllHospitals(page, pageSize);
      }

      if (response.error) {
        setError(response.error);
        setHospitals([]);
        setTotalCount(0);
      } else {
        // 如果有關鍵字，進行本地篩選
        let filteredData = response.data;
        if (keyword && keyword.trim() !== '') {
          const keywordLower = keyword.trim().toLowerCase();
          filteredData = response.data.filter(hospital =>
            hospital.動物醫院名稱.toLowerCase().includes(keywordLower) ||
            hospital.地址.toLowerCase().includes(keywordLower) ||
            hospital.負責人.toLowerCase().includes(keywordLower)
          );
        }

        // 分頁處理
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setHospitals(paginatedData);
        setTotalCount(filteredData.length);
        setCurrentPage(page);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜尋失敗';
      setError(errorMessage);
      setHospitals([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 載入初始資料
  useEffect(() => {
    searchHospitals();
  }, [searchHospitals]);

  // 處理搜尋
  const handleSearch = () => {
    setCurrentPage(1);
    searchHospitals(searchKeyword, selectedArea, 1);
  };

  // 處理重設
  const handleReset = () => {
    setSearchKeyword('');
    setSelectedArea('');
    setCurrentPage(1);
    searchHospitals('', '', 1);
  };

  // 處理分頁
  const handlePageChange = (page: number) => {
    searchHospitals(searchKeyword, selectedArea, page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-blue-600" />
          臺北市動物醫院資訊
        </h1>
        <p className="text-gray-600">查詢台北市合法登記的動物醫院資訊</p>
      </div>

      {/* 搜尋區域 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Search className="mr-2 h-5 w-5" />
            搜尋動物醫院
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 關鍵字搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                關鍵字搜尋
              </label>
              <Input
                type="text"
                placeholder="醫院名稱、地址或負責人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* 行政區篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                行政區
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                title="選擇行政區"
                aria-label="選擇行政區"
              >
                <option value="">全部區域</option>
                {taipeiDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
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

      {/* 視圖切換 Tabs */}
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

        <TabsContent value="list" className="mt-6">
          {/* 結果統計 */}
          <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? (
            '搜尋中...'
          ) : (
            `共找到 ${totalCount} 家動物醫院${currentPage > 1 ? `，第 ${currentPage} 頁` : ''}`
          )}
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 頁
          </div>
        )}
      </div>

      {/* 動物醫院列表 */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, index) => (
              <Card key={`${hospital._id}-${index}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-start justify-between">
                    <span className="text-blue-700 leading-tight">
                      {hospital.動物醫院名稱}
                    </span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {hospital.縣市}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {hospital.地址}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {hospital.電話 || '未提供'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      負責人：{hospital.負責人}
                    </span>
                  </div>
                  
                  {/* 導航按鈕 */}
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => {
                        const destination = encodeURIComponent(`${hospital.地址}, 台北市`);
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
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
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
          {!loading && hospitals.length === 0 && !error && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">沒有找到符合條件的動物醫院</p>
              <p className="text-sm text-gray-500 mt-2">請嘗試調整搜尋條件</p>
            </div>
          )}
        </>
      )}
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <GoogleMapsComponent hospitals={hospitals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}