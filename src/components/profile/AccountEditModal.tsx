"use client";

import { useState } from "react";
import { sendEmailChangeCode, sendPhoneVerifyCode, checkPhoneVerifyCode, verifyPassword } from "@/src/lib/auth";
import { changeEmail, changePhone } from "@/src/lib/member";
import { useToast } from "@/src/hooks/useToast";
import { useHandleError } from "@/src/hooks/useHandleError";

type Field = "email" | "phone";

interface AccountEditModalProps {
  field: Field;
  token: string;
  /** 번호 변경 없이 기존 번호를 인증만 할 때 사용한다 */
  verifyOnlyPhone?: string;
  onClose: () => void;
  onDone: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function AccountEditModal({ field, token, verifyOnlyPhone, onClose, onDone }: AccountEditModalProps) {
  const { addToast } = useToast();
  const handleError = useHandleError();

  const isEmail = field === "email";
  const isVerifyOnly = !!verifyOnlyPhone;
  const label = isEmail ? "이메일" : "전화번호";

  // 인증만 하는 경우엔 비밀번호 단계를 건너뛴다
  const [step, setStep] = useState<"password" | "verify">(isVerifyOnly ? "verify" : "password");
  const [password, setPassword] = useState("");
  const [value, setValue] = useState(verifyOnlyPhone ?? "");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValueValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : /^010-\d{4}-\d{4}$/.test(value);
  const canSubmit = isVerifyOnly
    ? codeSent && code.trim() !== ""
    : isValueValid && codeSent && code.trim() !== "";

  async function handleCheckPassword() {
    if (password === "" || checkingPassword) return;
    setCheckingPassword(true);
    try {
      if (!(await verifyPassword(token, password))) {
        addToast({ message: "비밀번호가 일치하지 않습니다.", type: "error" });
        return;
      }
      setStep("verify");
    } catch (e) {
      handleError(e);
    } finally {
      setCheckingPassword(false);
    }
  }

  async function handleSendCode() {
    if (!isValueValid) return;
    setSending(true);
    try {
      if (isEmail) await sendEmailChangeCode(value);
      else await sendPhoneVerifyCode(value.replace(/-/g, ""));
      setCodeSent(true);
      addToast({ message: "인증번호를 발송했습니다.", type: "success" });
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      if (isVerifyOnly) {
        await checkPhoneVerifyCode(value.replace(/-/g, ""), code.trim());
        addToast({ message: "전화번호 인증이 완료되었습니다.", type: "success" });
      } else if (isEmail) {
        await changeEmail(token, { password, newEmail: value, verifyCode: code.trim() });
        addToast({ message: "이메일을 변경했습니다.", type: "success" });
      } else {
        await changePhone(token, { password, newPhone: value.replace(/-/g, ""), code: code.trim() });
        addToast({ message: "전화번호를 변경했습니다.", type: "success" });
      }
      onDone();
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  }

  const title = isVerifyOnly ? "전화번호 인증" : `${label} 변경`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-100 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">{title}</h2>

        {step === "password" ? (
          <>
            <p className="text-sm text-zinc-500">
              본인 확인을 위해 현재 비밀번호를 입력해주세요.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCheckPassword(); }}
              placeholder="현재 비밀번호"
              autoFocus
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleCheckPassword}
                disabled={password === "" || checkingPassword}
                className="px-4 py-2 rounded-lg bg-main text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {checkingPassword ? "확인 중..." : "다음"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-500">
                {isVerifyOnly ? "전화번호" : `새 ${label}`}
              </label>
              <div className="flex gap-2">
                <input
                  type={isEmail ? "email" : "tel"}
                  value={value}
                  onChange={(e) => setValue(isEmail ? e.target.value : formatPhone(e.target.value))}
                  placeholder={isEmail ? "new@example.com" : "010-0000-0000"}
                  disabled={isVerifyOnly}
                  className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main disabled:bg-zinc-100 disabled:text-zinc-500"
                />
                <button
                  onClick={handleSendCode}
                  disabled={!isValueValid || sending}
                  className="px-3 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-600 hover:border-main hover:text-main transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {sending ? "발송 중..." : codeSent ? "재발송" : "인증번호"}
                </button>
              </div>
            </div>

            {codeSent && (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-zinc-500">인증번호</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="인증번호를 입력해주세요"
                  autoFocus
                  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={isVerifyOnly ? onClose : () => setStep("password")}
                className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                {isVerifyOnly ? "취소" : "이전"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                className="px-4 py-2 rounded-lg bg-main text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "처리 중..." : isVerifyOnly ? "인증" : "변경"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
