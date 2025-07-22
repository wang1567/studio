
# PawsConnect by Firebase Studio

This is a Next.js starter project for PawsConnect, an innovative platform designed to connect shelter dogs with loving homes through a fun, intuitive swipe-based interface.

## System Architecture

The PawsConnect application is built on a modern, decoupled architecture that leverages best-in-class third-party services to ensure scalability, reliability, and a focus on user experience.

```
                       ┌─────────────────────────┐
                       │      使用者 (用戶瀏覽器)     │
                       │   (手機或電腦上的 Chrome 等)  │
                       └───────────┬─────────────┘
                                   │ HTTPS (網頁請求)
                                   ▼
                       ┌─────────────────────────┐
                       │   Firebase App Hosting  │
                       │ (託管您的 Next.js 應用) │
                       └───────────┬─────────────┘
                                   │
                                   │ 1. 載入 Next.js (React) 前端應用
                                   ▼
┌──────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────┐
│   前端應用 (在瀏覽器中運行)   │   │     Supabase (後端即服務)     │   │     RTSP.me (影像串流服務)   │
│──────────────────────│   └─────────────────────────┘   └──────────────────────────┘
│ - UI: ShadCN, Tailwind     │           ▲                         ▲
│ - 框架: Next.js/React    │           │ 2. API 請求             │ 3. 嵌入(iframe)影像
│ - 狀態管理: Context API  │           │ (讀取/寫入資料)           │   (直接從用戶端載入)
│ - 功能: 滑動卡片, 個人資料 │           │                         │
│       登入/註冊, 配對列表  │───────────┘                         │
│       狗狗詳細資料         │                                     │
│       (包含影像播放器)   ├─────────────────────────────────────┘
└──────────────────────┘

-------------------------------------- 獨立的影像來源流程 ------------------------------------

┌──────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────┐
│ 您的 IP 攝影機          │   │      您的路由器            │   │     RTSP.me 的伺服器       │
│ (在 192.168.x.x)     │   │ (您家裡或辦公室的網路閘道)  │   │ (位於新加坡、東京等)     │
└──────────────────────┘   └─────────────────────────┘   └──────────────────────────┘
          ▲                         ▲                         ▲
          │ RTSP 串流               │                         │
          └─────────────────────────┤ 4. 通訊埠轉發 (Port Forwarding) │
                                    │ (將公開 IP 的 554 port      │
                                    │  轉發到攝影機的內部 IP)    │
                                    └─────────────────────────┤
                                                              │ 5. RTSP.me 連線並拉取串流
                                                              │
                                                              └─────────────────────────
```

---

### 架構說明

1.  **使用者與前端應用 (Client-Side)**
    *   **使用者**: 透過手機或電腦上的瀏覽器與 PawsConnect 互動。
    *   **Firebase App Hosting**: 這是您的網頁伺服器，負責託管、建置並將您的 Next.js 前端應用程式傳送給使用者。
    *   **前端應用**: 這是在使用者瀏覽器中實際運行的 React 應用程式。它包含了所有使用者介面 (UI)，例如滑動卡片、個人資料頁面等。它是使用 **Next.js** 框架、**ShadCN UI** 元件庫和 **Tailwind CSS** 進行建構的。

2.  **後端與資料庫 (Backend & Database)**
    *   **Supabase**: 這是我們的核心後端。PawsConnect 並沒有自己撰寫的傳統後端伺服器，而是採用「後端即服務 (Backend as a Service, BaaS)」的模式。Supabase 提供了：
        *   **資料庫**: 一個 PostgreSQL 資料庫，用來儲存所有資料，如使用者資訊 (`profiles`)、狗狗的資料 (`pets`)、按讚記錄 (`user_dog_likes`) 等。
        *   **身份驗證**: 處理使用者的註冊、登入、登出和密碼管理。
        *   **API**: 自動產生安全的 API，讓前端應用程式可以直接、安全地查詢和修改資料庫中的內容。

3.  **即時影像串流 (Live Video Streaming)**
    *   **您的 IP 攝影機**: 這是影像的原始來源，它會產生一個 RTSP 格式的影像串流，但這個串流通常只能在您的內部網路（例如 `192.168.88.106`）中存取。
    *   **您的路由器**: 這是您內部網路與網際網路之間的閘道。您需要在這裡設定「**通訊埠轉發 (Port Forwarding)**」，告訴路由器：「任何從網際網路訪問我公開 IP 位址的 `554` 連接埠的請求，都請轉發給我內部網路中攝影機的 `554` 連接埠。」
    *   **RTSP.me**: 這是一個第三方專業影像串流服務。它的伺服器會連線到您設定好的「公開 IP 位址 + 通訊埠」，拉取您的 RTSP 串流，然後將其轉碼成現代瀏覽器可以直接播放的格式（例如 HLS 或嵌入式 `<iframe>`）。
    *   **前端播放**: 前端應用程式的「狗狗詳細資料」彈窗會直接嵌入 (embed) 由 RTSP.me 提供的公開播放網址。影像串流是**從使用者的瀏覽器直接連到 RTSP.me 的伺服器**，完全不經過我們的 Next.js 伺服器。

### 總結流程

1.  使用者打開 PawsConnect 網站。
2.  前端應用程式向 **Supabase** 請求狗狗的資料和使用者的登入狀態。
3.  當使用者點開某隻狗狗的詳細資料，並切換到「即時影像」分頁時...
4.  前端應用程式會讀取該狗狗儲存在 **Supabase** 中的 `liveStreamUrl` 欄位。
5.  前端應用程式在頁面中建立一個 `<iframe>`，其來源 (src) 就是那個 `liveStreamUrl`。
6.  使用者的瀏覽器直接向 **RTSP.me** 的伺服器請求影像，並將其顯示在 `<iframe>` 中。

這個架構的優點是**關注點分離 (Separation of Concerns)**：Next.js 專注於提供優質的使用者介面，Supabase 專注於處理資料和使用者驗證，而 RTSP.me 則專注於處理最複雜的影像串流任務。
