import Image from "next/image";
import Link from "next/link";

import LogoImg from "@/src/img/Logo.svg";
import GoogleIMG from "@/src/img/logIn/Google.svg";
import KakaoTalkIMG from "@/src/img/logIn/kakaoTalk.svg";
import NaverIMG from "@/src/img/logIn/naver.svg";

import { InputField } from "@/components/inputField";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Page = () => {
    return (
        <div className = "bg-[#F4F4F4]">
            <Header />
            <div className="w-200 h-150  m-auto rounded-3xl flex items-left mt-18.25 mb-18.25">
                <div className="w-100 h-150 bg-linear-to-tr from-[#FF4D4D] to-[#824DFF] rounded-l-3xl flex items-center justify-center"></div>
                    <div className="w-100 h-150 bg-[#FFFFFF] rounded-r-3xl flex flex-col items-center justify-center">                    
                        <Image src={LogoImg} alt="Logo" width={80} height={40} className="mb-15.25" />

                        {/* 인풋 필드 */}
                        <div className="mb-2.5">
                            <InputField label="아이디 입력" placeholder="아이디를 입력해주세요" type="text" />
                            <InputField label="비밀번호 입력" placeholder="비밀번호를 입력해주세요" type="password" showIcon={true} />
                        </div>

                        {/* 로그인 버튼과 링크 */}
                        <button className="w-75 h-10
                        bg-[#FE6A4C] text-white rounded-lg text-lg font-bold hover:bg-[#FE6A4C]/90 transition-colors">
                            로그인
                        </button>
                        <div className="flex justify-between w-75 mt-2.5">
                            <Link href="#" className="text-[10px] text-[#666666] underline">
                                비밀번호를 잊으셨나요?
                            </Link>

                            <div className="flex gap-1 text-[10px] text-[#666666]">
                                <span>계정이 없으신가요?</span>
                                <Link href="/logIn/signup" className="underline">
                                    회원가입
                                </Link>
                            </div>
                        </div>

                        {/* 소셜 로그인 */}
                        <div className="flex gap-4 mt-5">
                            <button className="w-10 h-10 bg-[#FFFFFF] rounded-full flex items-center justify-center border 
                            border-[#D9D9D9] hover:border-[#FE6A4C] transition-colors">
                                <Image src={GoogleIMG} alt="Google" width={20} height={20} />
                            </button>
                            <button className="w-10 h-10 bg-[#FFFFFF] rounded-full flex items-center justify-center border 
                            border-[#D9D9D9] hover:border-[#FE6A4C] transition-colors">
                                <Image src={KakaoTalkIMG} alt="KakaoTalk" width={20} height={20} />
                            </button>
                            <button className="w-10 h-10 bg-[#FFFFFF] rounded-full flex items-center justify-center border 
                            border-[#D9D9D9] hover:border-[#FE6A4C] transition-colors">
                                <Image src={NaverIMG} alt="Naver" width={20} height={20} />
                            </button>
                        </div>
                    </div>
            </div>
            <Footer />
        </div>
    )
};

export default Page;