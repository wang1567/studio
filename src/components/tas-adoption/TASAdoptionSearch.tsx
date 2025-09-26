'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TASAdoptionService } from '@/lib/tas-adoption-service';
import GoogleMapsComponent from '@/components/veterinary-hospital/GoogleMapsComponent';
import type {
  TASAdoptionCenter,
  TASAdoptionCenterSearchParams
} from '@/types/tas-adoption';
import { MapPin, Phone, Building2, Search, Map, Navigation } from 'lucide-react';

interface TASAdoptionSearchProps {
  onCenterSelect?: (center: TASAdoptionCenter) => void;
  showFilters?: boolean;
  maxResults?: number;
}

export function TASAdoptionSearch({ 
  onCenterSelect, 
  showFilters = true,
  maxResults = 50 
}: TASAdoptionSearchProps) {
  const [centers, setCenters] = useState<TASAdoptionCenter[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TASAdoptionCenterSearchParams>({});
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12; // 每頁顯示12個認養中心

  // 建立搜尋結果區域的 ref
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // 追蹤是否為分頁切換
  const [shouldScrollOnLoad, setShouldScrollOnLoad] = useState(false);

  // 處理認養中心選擇邏輯
  const handleCenterSelect = (center: TASAdoptionCenter) => {
    if (onCenterSelect) {
      onCenterSelect(center);
    } else {
      console.log('選擇的認養中心:', center);
    }
  };

  // 搜尋認養中心
  const searchCenters = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const { data } = await TASAdoptionService.searchTASCenters({
        ...filters,
        limit: itemsPerPage,
        offset: offset
      });
      setCenters(data.data);
      setTotalCount(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('搜尋認養中心失敗:', error);
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
    searchCenters(1); // 篩選器改變時重置到第一頁
  }, [filters]);

  // 載入可用區域
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const { data } = await TASAdoptionService.getAvailableAreas();
        setAreas(data);
      } catch (error) {
        console.error('載入區域列表失敗:', error);
      }
    };
    
    loadAreas();
  }, []);

  const handleSearch = () => {
    searchCenters(1); // 手動搜尋時重置到第一頁
  };

  // 分頁處理函數
  const handlePageChange = (page: number) => {
    setShouldScrollOnLoad(true); // 標記需要滾動
    searchCenters(page);
  };

  // 重置篩選器
  const resetFilters = () => {
    setFilters({});
    setCurrentPage(1); // 重置到第一頁
  };

  // 總頁數
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* 標題區域 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TAS浪愛滿屋推廣動物認養計畫</h1>
        <p className="text-muted-foreground">臺北市委託民間設置認養中心</p>
      </div>

      {/* 篩選器 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              搜尋認養中心
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 區域篩選 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">區域</label>
                <Select
                  value={filters.區域 || "ALL"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, 區域: value === "ALL" ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇區域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部區域</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 機構名稱搜尋 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">機構名稱</label>
                <Input
                  placeholder="搜尋機構名稱..."
                  value={filters.合作機構名稱 || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, 合作機構名稱: e.target.value || undefined }))}
                />
              </div>

              {/* 搜尋按鈕 */}
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  搜尋
                </Button>
                <Button variant="outline" onClick={resetFilters}>
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
            搜尋結果 (第 {currentPage} 頁，共 {totalPages} 頁，總計 {totalCount} 個認養中心)
          </h3>
        </div>

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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">載入中...</p>
              </div>
            ) : centers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">沒有找到符合條件的認養中心</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {centers.map((center) => (
                  <Card 
                    key={center.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCenterSelect(center)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{center.合作機構名稱}</CardTitle>
                      <Badge variant="secondary" className="w-fit">
                        {center.區域}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{center.地址}</span>
                      </div>
                      
                      {center.電話 && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{center.電話}</span>
                        </div>
                      )}
                      
                      {center.行動電話 && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{center.行動電話}</span>
                        </div>
                      )}

                      {/* 導航按鈕 */}
                      <div className="pt-3 border-t border-gray-100">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation(); // 防止觸發卡片點擊事件
                            const destination = encodeURIComponent(`${center.地址}, 台北市`);
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
            )}

            {/* 分頁控制 */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  上一頁
                </Button>

                <div className="flex items-center space-x-1">
                  {/* 顯示頁碼按鈕 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum === 1 && currentPage > 3 && totalPages > 5) {
                      return (
                        <React.Fragment key="first">
                          <Button
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                          >
                            1
                          </Button>
                          <span className="px-2">...</span>
                        </React.Fragment>
                      );
                    }

                    if (pageNum === totalPages && currentPage < totalPages - 2 && totalPages > 5) {
                      return (
                        <React.Fragment key="last">
                          <span className="px-2">...</span>
                          <Button
                            variant={totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </React.Fragment>
                      );
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  下一頁
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map" className="space-y-4">
            <div className="h-96 md:h-[500px] lg:h-[600px]">
              <GoogleMapsComponent 
                hospitals={centers.map(center => ({
                  _id: parseInt(center.id.toString()),
                  縣市: center.區域,
                  動物醫院名稱: center.合作機構名稱,
                  地址: center.地址,
                  電話: center.電話 || center.行動電話 || '',
                  負責人: center.區域 // 使用區域作為負責人欄位
                }))} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default TASAdoptionSearch;