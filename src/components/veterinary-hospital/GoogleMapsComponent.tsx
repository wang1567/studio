'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { VeterinaryHospital } from '@/types/veterinary-hospital';

interface GoogleMapsComponentProps {
  hospitals: VeterinaryHospital[];
  userLocation?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    showDirections: (hospitalName: string, hospitalAddress: string, travelMode?: string) => void;
    showInMapDirections: (hospitalName: string, hospitalAddress: string) => void;
    clearDirections: () => void;
    quickNavigation: (hospitalName: string, hospitalAddress: string) => void;
  }
}

export default function GoogleMapsComponent({ hospitals, userLocation }: GoogleMapsComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(userLocation || null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  // 檢查 API 是否已載入
  const checkApiLoaded = useCallback(() => {
    return !!(window.google && window.google.maps && window.google.maps.Map);
  }, []);

  // 載入 Google Maps API
  useEffect(() => {
    let mounted = true;

    const loadGoogleMapsAPI = async () => {
      // 檢查是否已經載入
      if (checkApiLoaded()) {
        if (mounted) {
          setIsApiLoaded(true);
          setIsLoading(false);
        }
        return;
      }

      // 檢查 API 金鑰
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        if (mounted) {
          setError('請設定有效的 Google Maps API 金鑰，詳細說明請參考 GOOGLE_MAPS_SETUP.md');
          setIsLoading(false);
        }
        return;
      }

      // 檢查是否已有載入中的腳本
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // 等待載入完成
        const checkInterval = setInterval(() => {
          if (checkApiLoaded()) {
            clearInterval(checkInterval);
            if (mounted) {
              setIsApiLoaded(true);
              setIsLoading(false);
            }
          }
        }, 100);

        // 10秒後超時
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!checkApiLoaded() && mounted) {
            setError('Google Maps API 載入超時');
            setIsLoading(false);
          }
        }, 10000);
        return;
      }

      // 載入新的腳本
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (mounted && checkApiLoaded()) {
            setIsApiLoaded(true);
            setIsLoading(false);
          }
        };
        
        script.onerror = () => {
          if (mounted) {
            setError('無法載入 Google Maps API');
            setIsLoading(false);
          }
        };

        document.head.appendChild(script);
      } catch (err) {
        if (mounted) {
          setError('載入 Google Maps API 時發生錯誤');
          setIsLoading(false);
        }
      }
    };

    loadGoogleMapsAPI();

    return () => {
      mounted = false;
    };
  }, [checkApiLoaded]);

  // 初始化地圖
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      // 台北市中心座標
      const defaultCenter = { lat: 25.0330, lng: 121.5654 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: userPos ? 14 : 11,
        center: userPos || defaultCenter,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = mapInstance;

      // 初始化路線服務
      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        panel: null
      });
      
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      directionsRendererInstance.setMap(mapInstance);

      // 添加醫院標記
      addHospitalMarkers(mapInstance);

      // 如果有用戶位置，添加用戶標記
      if (userPos) {
        addUserMarker(mapInstance, userPos);
      }

    } catch (err) {
      console.error('初始化地圖時發生錯誤:', err);
      setError('初始化地圖失敗');
    }
  }, [isApiLoaded, userPos, hospitals]);

  // 添加醫院標記
  const addHospitalMarkers = useCallback((mapInstance: any) => {
    if (!window.google || !hospitals.length) return;

    const geocoder = new window.google.maps.Geocoder();
    
    hospitals.forEach((hospital) => {
      const address = hospital.地址;
      
      geocoder.geocode(
        { address: `${address}, 台北市` },
        (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const marker = new window.google.maps.Marker({
              position: results[0].geometry.location,
              map: mapInstance,
              title: hospital.動物醫院名稱,
              icon: {
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="24" height="24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32)
              }
            });

            markersRef.current.push(marker);

            // 資訊視窗
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; max-width: 280px;">
                  <h3 style="margin: 0 0 8px 0; color: #1E40AF; font-size: 16px; font-weight: bold;">${hospital.動物醫院名稱}</h3>
                  <p style="margin: 4px 0; font-size: 13px; color: #666; display: flex; align-items: center;">
                    <span style="margin-right: 6px;">📍</span> ${hospital.地址}
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #666; display: flex; align-items: center;">
                    <span style="margin-right: 6px;">📞</span> ${hospital.電話}
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #666; display: flex; align-items: center;">
                    <span style="margin-right: 6px;">👨‍⚕️</span> ${hospital.負責人}
                  </p>
                  
                  <!-- 一鍵導航按鈕 (無需定位) -->
                  <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    <button onclick="window.quickNavigation('${hospital.動物醫院名稱}', '${address}')" 
                            style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      🧭 開啟 Google Maps 導航
                    </button>
                  </div>
                  
                  ${userPos ? `
                    <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                      <p style="margin: 0 0 8px 0; font-size: 12px; color: #374151; font-weight: 500;">更多導航選項：</p>
                      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <button onclick="window.showDirections('${hospital.動物醫院名稱}', '${address}', 'DRIVING')" 
                                style="background: #3B82F6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                          🚗 開車
                        </button>
                        <button onclick="window.showDirections('${hospital.動物醫院名稱}', '${address}', 'TRANSIT')" 
                                style="background: #10B981; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                          🚌 大眾運輸
                        </button>
                        <button onclick="window.showDirections('${hospital.動物醫院名稱}', '${address}', 'WALKING')" 
                                style="background: #F59E0B; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                          🚶 步行
                        </button>
                        <button onclick="window.showDirections('${hospital.動物醫院名稱}', '${address}', 'BICYCLING')" 
                                style="background: #8B5CF6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                          🚴 騎車
                        </button>
                      </div>
                      <button onclick="window.showInMapDirections('${hospital.動物醫院名稱}', '${address}')" 
                              style="background: #EF4444; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        �️ 在地圖上顯示路線
                      </button>
                    </div>
                  ` : '<p style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">請點擊「定位」按鈕以使用導航功能</p>'}
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstance, marker);
            });
          }
        }
      );
    });
  }, [hospitals, userPos]);

  // 添加用戶位置標記
  const addUserMarker = useCallback((mapInstance: any, position: { lat: number; lng: number }) => {
    if (!window.google) return;

    const userMarker = new window.google.maps.Marker({
      position,
      map: mapInstance,
      title: '您的位置',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#1E40AF'
      }
    });

    markersRef.current.push(userMarker);
  }, []);

  // 獲取用戶位置
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserPos(pos);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(pos);
          mapInstanceRef.current.setZoom(15);
          addUserMarker(mapInstanceRef.current, pos);
        }
        setIsLoading(false);
      },
      () => {
        setError('無法獲取您的位置');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [addUserMarker]);

  // 導航功能
  useEffect(() => {
    // 外部導航 (開啟 Google Maps)
    const showDirections = (hospitalName: string, hospitalAddress: string, travelMode: string = 'DRIVING') => {
      if (!userPos) {
        alert('請先允許定位以使用導航功能');
        return;
      }
      
      const origin = `${userPos.lat},${userPos.lng}`;
      const destination = encodeURIComponent(`${hospitalAddress}, 台北市`);
      const modeMap: { [key: string]: string } = {
        'DRIVING': 'driving',
        'TRANSIT': 'transit',
        'WALKING': 'walking',
        'BICYCLING': 'bicycling'
      };
      
      const mode = modeMap[travelMode] || 'driving';
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
      
      window.open(url, '_blank');
    };

    // 內建地圖路線顯示
    const showInMapDirections = (hospitalName: string, hospitalAddress: string) => {
      if (!userPos || !directionsService || !directionsRenderer) {
        alert('請先允許定位以使用導航功能');
        return;
      }

      const origin = new window.google.maps.LatLng(userPos.lat, userPos.lng);
      const destination = `${hospitalAddress}, 台北市`;

      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          setCurrentRoute(result);
          setShowDirectionsPanel(true);
          
          // 調整地圖視角以顯示整條路線
          if (mapInstanceRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            const route = result.routes[0];
            const legs = route.legs;
            
            legs.forEach((leg: any) => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            
            mapInstanceRef.current.fitBounds(bounds);
          }
          
          // 顯示路線資訊
          const route = result.routes[0];
          const leg = route.legs[0];
          const duration = leg.duration.text;
          const distance = leg.distance.text;
          
          alert(`路線規劃完成！\n🏥 目的地：${hospitalName}\n📏 距離：${distance}\n⏱️ 預估時間：${duration}`);
        } else {
          alert('路線規劃失敗：' + status);
        }
      });
    };

    // 清除路線
    const clearDirections = () => {
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
        setCurrentRoute(null);
        setShowDirectionsPanel(false);
      }
    };

    // 快速導航 (無需定位)
    const quickNavigation = (hospitalName: string, hospitalAddress: string) => {
      const destination = encodeURIComponent(`${hospitalAddress}, 台北市`);
      
      // 偵測設備類型
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 行動設備：嘗試開啟 Google Maps App，若無則開啟網頁版
        const googleMapsApp = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
        const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        
        // 建立一個隱藏的連結嘗試開啟 App
        const appLink = document.createElement('a');
        appLink.href = googleMapsApp;
        appLink.style.display = 'none';
        document.body.appendChild(appLink);
        
        // 嘗試開啟 App
        appLink.click();
        
        // 如果 App 未開啟，2秒後開啟網頁版
        setTimeout(() => {
          window.open(googleMapsWeb, '_blank');
          document.body.removeChild(appLink);
        }, 2000);
        
        // 顯示提示
        alert(`正在開啟 Google Maps 導航到：\n🏥 ${hospitalName}\n📍 ${hospitalAddress}\n\n如果沒有自動開啟，請手動點擊瀏覽器中開啟的新分頁。`);
      } else {
        // 桌面設備：直接開啟網頁版 Google Maps
        const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        window.open(googleMapsWeb, '_blank');
        
        // 顯示提示
        alert(`已開啟 Google Maps 導航到：\n🏥 ${hospitalName}\n📍 ${hospitalAddress}\n\n請在新開的分頁中查看路線並開始導航。`);
      }
    };

    window.showDirections = showDirections;
    window.showInMapDirections = showInMapDirections;
    window.clearDirections = clearDirections;
    window.quickNavigation = quickNavigation;

    return () => {
      (window as any).showDirections = undefined;
      (window as any).showInMapDirections = undefined;
      (window as any).clearDirections = undefined;
      (window as any).quickNavigation = undefined;
    };
  }, [userPos]);

  // 清理函數
  useEffect(() => {
    return () => {
      // 清理標記
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // 清理地圖實例
      if (mapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              請按照以下步驟設定 Google Maps API 金鑰：
            </p>
            <ol className="mt-1 text-sm list-decimal list-inside space-y-1">
              <li>前往 <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
              <li>建立專案並啟用 Maps JavaScript API</li>
              <li>建立 API 金鑰並複製</li>
              <li>在 .env.local 檔案中設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
              <li>重新啟動開發伺服器</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            動物醫院地圖
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={getUserLocation}
              disabled={isLoading || !isApiLoaded}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              定位
            </Button>
            {currentRoute && (
              <Button
                onClick={() => window.clearDirections?.()}
                variant="outline"
                size="sm"
              >
                清除路線
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef}
          className="w-full h-96 bg-gray-100 rounded-lg relative overflow-hidden"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">載入地圖中...</p>
              </div>
            </div>
          )}
        </div>
        {/* 路線資訊面板 */}
        {showDirectionsPanel && currentRoute && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              🗺️ 路線資訊
            </h4>
            {currentRoute.routes[0] && (
              <div className="text-sm space-y-1">
                <p className="text-blue-800">
                  📏 <strong>距離：</strong>{currentRoute.routes[0].legs[0].distance.text}
                </p>
                <p className="text-blue-800">
                  ⏱️ <strong>預估時間：</strong>{currentRoute.routes[0].legs[0].duration.text}
                </p>
                <p className="text-blue-700 text-xs mt-2">
                  💡 路線已顯示在地圖上，點擊「清除路線」可移除路線顯示
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>📍 點擊醫院標記查看詳細資訊和導航選項</p>
          {userPos && <p>🧭 支援多種導航方式：開車、大眾運輸、步行、騎車</p>}
          {!userPos && <p>🎯 點擊「定位」按鈕以啟用導航功能</p>}
          {!isApiLoaded && !error && <p>🔄 正在載入 Google Maps...</p>}
        </div>
      </CardContent>
    </Card>
  );
}