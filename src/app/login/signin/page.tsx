"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/hooks/useToast";
import { InputField } from "@/src/components/InputField";
import BackButton from "@/src/components/BackButton";
import { login } from "@/src/lib/auth";
import { useAuthStore } from "@/src/store/authStore";

export default function Page() {
  const { addToast } = useToast();
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);

  // 1. 입력값 상태 관리
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canLogin =
    formData.email.trim() !== "" && formData.password.trim() !== "";

  const handleLogin = async () => {
    if (!canLogin) return;
    try {
      const data = await login(formData.email, formData.password);
      setToken(data.accessToken);
      router.push("/main");
    } catch (e) {
      addToast(
        { message: e instanceof Error ? e.message : '로그인에 실패했습니다.', type: 'error' }
      )
    }
  };

  const OAuth = (index: number) => () => {
    switch (index) {
      case 0:
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
        break;
      case 1:
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao`;
        break;
      case 2:
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/naver`;
        break;
      default:
        break;
    }
  };

  const enterLogin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canLogin) {
      handleLogin();
    }
  };

  return (
    <div className="flex justify-center items-center bg-zinc-100 h-full">
      <div className="flex fixed left-4 top-4 px-4 py-4">
        <BackButton />
      </div>
      <div className="w-200 h-150 rounded-3xl flex items-center mt-18.25 mb-18.25 shadow-lg">
        <div className="w-100 h-150 bg-linear-to-tr from-rose-500 to-indigo-500 rounded-l-3xl flex items-center justify-center"></div>
        <div className="w-100 h-150 bg-white rounded-r-3xl flex flex-col items-center justify-center">
          <Link href="/main">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={80}
              height={40}
              className="mb-15.25 bg-black"
            />
          </Link>

          {/* 인풋 필드 영역 */}
          <div className="mb-2.5">
            <InputField
              label="이메일 입력"
              placeholder="이메일을 입력해주세요"
              isEssential={true}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <InputField
              label="비밀번호 입력"
              placeholder="비밀번호를 입력해주세요"
              type="password"
              showIcon={true}
              isEssential={true}
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onKeyDown={enterLogin}
            />
          </div>

          {/* 로그인 버튼: 조건에 따라 스타일과 활성화 상태 변경 */}
          <button
            onClick={handleLogin}
            disabled={!canLogin}
            className={`w-75 h-10 rounded-lg text-lg font-bold transition-colors cursor-pointer
            ${
              canLogin
                ? "bg-main text-white hover:bg-main/90"
                : "bg-zinc-100 text-zinc-500 cursor-not-allowed"
            }`}
          >
            로그인
          </button>

          <div className="flex justify-between w-75 mt-2.5">
            <Link href="#" className="text-[10px] text-zinc-500 underline underline-offset-2  hover:text-main transition-colors duration-100">
              비밀번호를 잊으셨나요?
            </Link>
            <div className="flex gap-1 text-[10px] text-zinc-500">
              <span>계정이 없으신가요?</span>
              <Link href="/login/signup" className="underline underline-offset-2 hover:text-main transition-colors duration-100">
                회원가입
              </Link>
            </div>
          </div>

          {/* 소셜 로그인 */}
          <div className="flex gap-4 mt-5">
            {[
              { src: "/login/google.svg", alt: "Google" },
              { src: "/login/kakao.svg", alt: "KakaoTalk" },
              { src: "/login/naver.svg", alt: "Naver" },
            ].map((social, index) => (
              <button
                key={index}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-300 hover:border-main transition-colors"
                onClick={OAuth(index)}
              >
                <img
                  src={social.src}
                  alt={social.alt}
                  width={20}
                  height={20}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
