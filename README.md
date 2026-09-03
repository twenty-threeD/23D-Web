# 23D-Web

> **사람과 사람을 잇다.**
> 커리어를 투명하게 증명하고, 신뢰할 수 있는 파트너를 만나는 서비스 **잇다(ITDA)**의 Web Client입니다.

## 🔗 About ITDA

**잇다**는 사용자의 커리어와 활동을 기반으로 신뢰할 수 있는 파트너를 연결하는 매칭 플랫폼입니다.

블록체인을 활용한 신뢰성 있는 커리어 검증을 기반으로
사용자들이 보다 안전하게 서로를 찾고 소통할 수 있는 환경을 목표로 합니다.

## ✨ Features

* 👤 회원가입 및 로그인
* 🪪 사용자 프로필 / 커리어 관리
* 🔍 파트너 및 사용자 탐색
* 💬 실시간 채팅
* 📝 게시글 및 커뮤니티
* 📁 파일 업로드
* 💳 Toss Payments 결제
* 🔐 인증 기반 API 통신

## 🛠 Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react\&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss\&logoColor=white)

### Libraries

* **Zustand** — Global State Management
* **Toss Payments SDK** — Payment
* **React Icons** — Icons
* **React Markdown Editor** — Markdown Editor
* **Sonner** — Toast Notification

## 📁 Project Structure

```text
23D-Web/
├── public/
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/
│   │   ├── chat/
│   │   ├── community/
│   │   ├── detail/
│   │   ├── item/
│   │   ├── login/
│   │   ├── main/
│   │   ├── pay/
│   │   ├── posts/
│   │   ├── profile/
│   │   └── upload/
│   │
│   ├── components/      # Reusable UI Components
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # API / Utility Functions
│   ├── store/           # Zustand Stores
│   ├── types/           # TypeScript Types
│   └── middleware.ts
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/twenty-threeD/23D-Web.git
cd 23D-Web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_API_URL=YOUR_API_URL
NEXT_PUBLIC_TOSS_CLIENT_KEY=YOUR_TOSS_CLIENT_KEY
```

> 실제 API 주소와 Toss Payments Client Key를 입력해주세요.

### 4. Run Development Server

```bash
npm run dev
```

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:3000
```

## 📦 Build

Production Build:

```bash
npm run build
```

Production Server:

```bash
npm run start
```

## 🧹 Lint

```bash
npm run lint
```

## 👥 Team

**23D**

Repository maintained by **twenty-threeD**.

## 📄 Repository

https://github.com/twenty-threeD/23D-Web