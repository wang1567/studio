import { Metadata } from 'next';
import { ShelterAnimalSearch } from '@/components/shelter-animals/ShelterAnimalSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Home } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '收容所動物 - PawsConnect',
  description: '瀏覽台北、新北、基隆地區收容所的可領養動物，找到您的毛孩夥伴',
  keywords: ['收容所', '動物領養', '台北', '新北', '基隆', '狗', '貓', 'PawsConnect'],
};

export default function ShelterAnimalsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 頁面標題區域 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-2xl">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                收容所動物
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              探索台北、新北、基隆地區收容所的可愛動物們，每一隻都在等待一個溫暖的家
            </p>
            
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-blue-600">2,337</div>
                  <div className="text-sm text-muted-foreground">隻動物等待領養</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600">11</div>
                  <div className="text-sm text-muted-foreground">個收容所</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-muted-foreground">個城市</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-6">
        {/* 主要搜尋區域 */}
        <ShelterAnimalSearch 
          showFilters={true}
          maxResults={24}
        />

        {/* 領養資訊提示 */}
        <Card className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-orange-100 p-2">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">準備領養動物了嗎？</h3>
                <p className="text-orange-800 mb-4">
                  領養前請確認您已準備好承擔照顧動物的責任，包括提供適當的居住環境、定期醫療保健、充足的運動和陪伴。
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    身分證明文件
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    居住證明
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    家人同意書
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    經濟能力證明
                  </Badge>
                </div>
                <div className="mt-4">
                  <Link href="/adoption-info">
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      了解更多領養資訊
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}