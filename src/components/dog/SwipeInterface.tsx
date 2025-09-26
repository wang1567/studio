
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Dog } from '@/types';
import { DogCard } from './DogCard';
import { DogDetailsModal } from './DogDetailsModal';
import { PawPrint } from 'lucide-react';
import { usePawsConnect } from '@/context/PawsConnectContext';
import styles from './SwipeInterface.module.css';

export const SwipeInterface = () => {
  const { 
    dogsToSwipe, 
    likedDogs, 
    seenDogIds,
    likeDog, 
    passDog, 
    isLoadingDogs,
    loadDogsWhenNeeded,
    breedFilter,
    setBreedFilter,
    getFilteredDogs
  } = usePawsConnect();
  
  const [selectedDogDetails, setSelectedDogDetails] = useState<Dog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  
  // 滑動手勢狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 根據篩選條件獲取要顯示的狗狗
  const filteredDogs = getFilteredDogs();
  
  // 從篩選後的狗狗中找出還沒滑過的（包括按讚和按不喜歡的）
  const availableDogsToSwipe = filteredDogs.filter(dog => 
    !likedDogs.some(liked => liked.id === dog.id) && !seenDogIds.has(dog.id)
  );

  // 當前顯示的狗狗
  const currentDisplayDog = availableDogsToSwipe[0];
  const nextDisplayDog = availableDogsToSwipe[1];

  // 確保在 SwipeInterface 載入時觸發狗狗資料載入
  useEffect(() => {
    console.log('🐕 [SwipeInterface] 組件載入，觸發狗狗資料載入');
    loadDogsWhenNeeded();
  }, [loadDogsWhenNeeded]);

  const handleLike = (dogId: string) => {
    if (animationDirection) return; // Prevent multiple swipes while one is animating
    setAnimationDirection('right');
    setTimeout(() => {
      likeDog(dogId);
      setAnimationDirection(null);
    }, 500); // Match animation duration
  };

  const handlePass = (dogId: string) => {
    if (animationDirection) return; // Prevent multiple swipes while one is animating
    setAnimationDirection('left');
    setTimeout(() => {
      passDog(dogId);
      setAnimationDirection(null);
    }, 500); // Match animation duration
  };

  const handleShowDetails = (dog: Dog) => {
    setSelectedDogDetails(dog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDogDetails(null);
  };

  // 滑動手勢處理函數
  const handleTouchStart = (e: React.TouchEvent) => {
    if (animationDirection || !currentDisplayDog) return;
    
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !currentDisplayDog) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    
    // 只允許水平滑動，限制垂直移動
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setDragOffset({ x: deltaX, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !currentDisplayDog) return;
    
    setIsDragging(false);
    
    const threshold = 100; // 滑動閾值 (px)
    const { x } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        // 向右滑動 - 喜歡
        handleLike(currentDisplayDog.id);
      } else {
        // 向左滑動 - 略過
        handlePass(currentDisplayDog.id);
      }
    }
    
    // 重置拖拽狀態
    setDragOffset({ x: 0, y: 0 });
  };

  // 滑鼠事件處理（用於桌面版）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (animationDirection || !currentDisplayDog) return;
    
    setStartPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !currentDisplayDog) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    // 只允許水平滑動
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset({ x: deltaX, y: 0 });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !currentDisplayDog) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    const { x } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        handleLike(currentDisplayDog.id);
      } else {
        handlePass(currentDisplayDog.id);
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentDisplayDog || animationDirection) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePass(currentDisplayDog.id);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleLike(currentDisplayDog.id);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDisplayDog, animationDirection]);

  // 滑鼠事件監聽器
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentDisplayDog) return;
      
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setDragOffset({ x: deltaX, y: 0 });
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startPos, currentDisplayDog]);

  if (isLoadingDogs) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <PawPrint className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-headline">正在尋找毛夥伴...</h2>
        <p className="text-muted-foreground">請稍候片刻。</p>
      </div>
    );
  }
  
  if (availableDogsToSwipe.length === 0) {
    const hasFilters = breedFilter.animalType !== 'all' || breedFilter.selectedBreeds.length > 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <h2 className="text-2xl font-headline mb-4">
          {hasFilters ? '沒有符合篩選條件的動物' : '目前沒有更多動物了！'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {hasFilters 
            ? '請調整您的篩選條件或稍後再來看看有沒有新的毛孩朋友！' 
            : '您已看過所有可配對的動物。請稍後再來看看有沒有新的毛孩朋友！'
          }
        </p>
        <p className="text-muted-foreground mt-4">
          您的配對清單中有 <span className="font-bold text-primary">{likedDogs.length}</span> 個毛孩。
        </p>
      </div>
    );
  }

  const getAnimationClass = () => {
    if (animationDirection === 'left') return 'animate-card-swipe-out-left';
    if (animationDirection === 'right') return 'animate-card-swipe-out-right';
    return 'animate-card-fade-in'; 
  };

  // 計算卡片CSS類名（包含滑動效果）
  const getCardClasses = () => {
    return `${styles.swipeCard} ${isDragging ? styles.dragging : ''}`;
  };

  // 計算卡片變換樣式
  const getCardTransform = () => {
    const { x } = dragOffset;
    const rotation = x * 0.1;
    const opacity = 1 - Math.abs(x) / 300;
    
    return {
      '--transform-x': `${x}px`,
      '--rotation': `${rotation}deg`,
      '--opacity': Math.max(opacity, 0.3),
    } as React.CSSProperties;
  };

  // 獲取滑動指示器
  const getSwipeIndicator = () => {
    const { x } = dragOffset;
    
    if (Math.abs(x) < 50) return null;
    
    if (x > 0) {
      return (
        <div className={`${styles.swipeIndicator} ${styles.like}`}>
          💚 喜歡
        </div>
      );
    } else {
      return (
        <div className={`${styles.swipeIndicator} ${styles.pass}`}>
          ❌ 略過
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
      {/* 滑動提示 */}
      <div className={styles.swipeHint}>
        💡 左右滑動或使用按鈕進行配對
      </div>
      
      <div className="relative w-full max-w-sm h-[calc(100%-80px)] min-h-[420px] flex items-center justify-center">
        {nextDisplayDog && (
           <DogCard
            key={nextDisplayDog.id + "-next"}
            dog={nextDisplayDog}
            onLike={() => {}}
            onPass={() => {}}
            onDetails={handleShowDetails}
            isTopCard={false}
          />
        )}
        {currentDisplayDog && (
          <div
            ref={cardRef}
            className={`${styles.touchArea} ${getCardClasses()}`}
            style={getCardTransform()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
          >
            {/* 滑動指示器 */}
            {getSwipeIndicator()}
            
            <DogCard
              key={currentDisplayDog.id}
              dog={currentDisplayDog}
              onLike={handleLike}
              onPass={handlePass}
              onDetails={handleShowDetails}
              isTopCard={true}
              animationClass={getAnimationClass()}
            />
          </div>
        )}
      </div>

      {/* 鍵盤快捷鍵提示 */}
      <div className={styles.keyboardHint}>
        <p>⌨️ 快捷鍵：← 略過 | → 喜歡</p>
      </div>

      <DogDetailsModal dog={selectedDogDetails} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};
