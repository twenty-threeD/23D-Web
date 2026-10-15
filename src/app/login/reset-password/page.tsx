"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import BackButton from "@/src/components/BackButton";
import Field, { inputClass, inputShellClass } from "@/src/components/ui/Field";
import { sendVerifyCode } from "@/src/lib/auth";
import { resetPasswordWithoutAuth } from "@/src/lib/member";
import { useToast } from "@/src/hooks/useToast";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,32}$/;

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid?: boolean;
}

function PasswordInput({ value, onChange, placeholder, invalid }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${inputShellClass} ${invalid ? "border-red-400" : ""}`}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        className="shrink-0 text-lg text-zinc-400 hover:text-main transition-colors cursor-pointer"
      >
        {visible ? <IoMdEye /> : <IoMdEyeOff />}
      </button>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState<"identity" | "reset">("identity");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canSendCode =
    username.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isInvalidPassword = newPassword.length > 0 && !PASSWORD_REGEX.test(newPassword);
  const isPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canResetPassword =
    verifyCode.trim() !== "" &&
    PASSWORD_REGEX.test(newPassword) &&
    newPassword === confirmPassword;

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSendCode || busy) return;

    setBusy(true);
    try {
      await sendVerifyCode(email.trim());
      setVerifyCode("");
      setStep("reset");
      addToast({ message: "인증번호를 이메일로 보냈습니다.", type: "success" });
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    if (busy) return;

    setBusy(true);
    try {
      await sendVerifyCode(email.trim());
      setVerifyCode("");
      addToast({ message: "새 인증번호를 이메일로 보냈습니다.", type: "success" });
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canResetPassword || busy) return;

    setBusy(true);
    try {
      await resetPasswordWithoutAuth({
        username: username.trim(),
        email: email.trim(),
        verifyCode: verifyCode.trim(),
        newPassword,
      });
      addToast({ message: "비밀번호를 변경했습니다. 다시 로그인해주세요.", type: "success" });
      router.replace("/login/signin");
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function editIdentity() {
    setStep("identity");
    setVerifyCode("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex justify-center items-center bg-zinc-100 flex-1 px-4 py-18.25">
      <div className="flex fixed left-4 top-4 px-4 py-4">
        <BackButton />
      </div>
      <main className="w-full max-w-100 rounded-3xl bg-white shadow-lg px-8 py-10 flex flex-col gap-6 items-center">
        <Link href="/main" aria-label="잇다 홈">
          <Image src="/icon.png" alt="잇다" width={80} height={40} priority />
        </Link>

        <div className="flex flex-col gap-2 items-center text-center">
          <h1 className="text-xl font-bold text-ink">비밀번호 재설정</h1>
          <p className="text-sm text-ink-sub">
            {step === "identity"
              ? "가입한 아이디와 이메일을 입력해주세요."
              : "이메일 인증번호와 새 비밀번호를 입력해주세요."}
          </p>
        </div>

        {step === "identity" ? (
          <form onSubmit={handleSendCode} className="w-full flex flex-col gap-4">
            <Field label="아이디">
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="가입한 아이디를 입력해주세요"
                autoComplete="username"
                className={`${inputClass} w-full`}
              />
            </Field>
            <Field label="이메일">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="가입한 이메일을 입력해주세요"
                autoComplete="email"
                className={`${inputClass} w-full`}
              />
            </Field>
            <button
              type="submit"
              disabled={!canSendCode || busy}
              className={`w-full h-10 rounded-lg text-base font-bold transition-colors cursor-pointer ${
                canSendCode && !busy
                  ? "bg-main text-white hover:bg-orange-600"
                  : "bg-zinc-100 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {busy ? "전송 중..." : "인증번호 발송"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-ink-sub">
              <span className="break-all">{username} · {email}</span>
              <button
                type="button"
                onClick={editIdentity}
                className="shrink-0 underline underline-offset-2 hover:text-main"
              >
                수정
              </button>
            </div>
            <Field label="이메일 인증번호">
              <input
                type="text"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                placeholder="이메일로 받은 인증번호를 입력해주세요"
                autoComplete="one-time-code"
                className={`${inputClass} w-full`}
              />
            </Field>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={busy}
              className="self-start text-xs text-zinc-500 underline underline-offset-2 hover:text-main disabled:opacity-50"
            >
              인증번호 다시 보내기
            </button>
            <Field label={isInvalidPassword ? "새 비밀번호 · 8자 이상, 대소문자, 숫자, 특수문자를 포함해주세요" : "새 비밀번호"}>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="새 비밀번호를 입력해주세요"
                invalid={isInvalidPassword}
              />
            </Field>
            <Field label={isPasswordMismatch ? "새 비밀번호 확인 · 비밀번호가 일치하지 않습니다" : "새 비밀번호 확인"}>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="새 비밀번호를 다시 입력해주세요"
                invalid={isPasswordMismatch}
              />
            </Field>
            <p className="text-xs text-ink-hint">
              인증번호는 비밀번호를 저장할 때 계정 이메일과 함께 확인됩니다.
            </p>
            <button
              type="submit"
              disabled={!canResetPassword || busy}
              className={`w-full h-10 rounded-lg text-base font-bold transition-colors cursor-pointer ${
                canResetPassword && !busy
                  ? "bg-main text-white hover:bg-orange-600"
                  : "bg-zinc-100 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {busy ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}

        <Link
          href="/login/signin"
          className="text-xs text-zinc-500 underline underline-offset-2 hover:text-main transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </main>
    </div>
  );
}
