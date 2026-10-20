"use client";

import { useState } from "react";
import { changePassword, setPassword } from "@/src/lib/member";
import { useToast } from "@/src/hooks/useToast";
import { useHandleError } from "@/src/hooks/useHandleError";
import { ApiError } from "@/src/lib/apiError";
import Modal, { ModalActions } from "@/src/components/ui/Modal";
import Button from "@/src/components/ui/Button";
import Field, { inputShellClass } from "@/src/components/ui/Field";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

// 회원가입(src/components/login/inputData.tsx)과 같은 규칙이어야 로그인 폼과 어긋나지 않는다
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,32}$/;

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  autoFocus?: boolean;
  invalid?: boolean;
  onEnter?: () => void;
}

// 입력칸마다 따로 보이기/숨기기를 토글한다. 아이콘은 로그인 화면(InputField)과 같은 것을 쓴다
function PasswordInput({ value, onChange, placeholder, autoComplete, autoFocus, invalid, onEnter }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`${inputShellClass} ${invalid ? "border-red-400" : ""}`}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onEnter ? (e) => { if (e.key === "Enter") onEnter(); } : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        className="shrink-0 text-lg text-zinc-400 hover:text-main transition-colors cursor-pointer"
      >
        {visible ? <IoMdEye /> : <IoMdEyeOff />}
      </button>
    </div>
  );
}

interface PasswordModalProps {
  /** set: 비밀번호가 없는 계정의 최초 설정, change: 기존 비밀번호로 확인 후 변경 */
  mode: "set" | "change";
  token: string;
  onClose: () => void;
  /** change 성공 시엔 서버가 토큰을 지우므로, 호출한 쪽이 재로그인 처리를 해야 한다 */
  onDone: () => void;
}

export default function PasswordModal({ mode, token, onClose, onDone }: PasswordModalProps) {
  const { addToast } = useToast();
  const handleError = useHandleError();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isChange = mode === "change";
  const isInvalid = newPassword.length > 0 && !PASSWORD_REGEX.test(newPassword);
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    (!isChange || currentPassword !== "") &&
    PASSWORD_REGEX.test(newPassword) &&
    newPassword === confirmPassword;

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      if (isChange) await changePassword(token, currentPassword, newPassword);
      else await setPassword(token, newPassword);
      addToast({ message: isChange ? "비밀번호를 변경했습니다. 다시 로그인해주세요." : "비밀번호를 설정했습니다.", type: "success" });
      onDone();
    } catch (e) {
      // 기존 비밀번호가 틀려도 401 INVALID_CREDENTIALS 가 와서, 공통 처리에 넘기면 토큰 만료로 오인해 "다시 시도해주세요"만 뜬다
      if (e instanceof ApiError && e.code === "INVALID_CREDENTIALS") {
        addToast({ message: "기존 비밀번호가 일치하지 않습니다.", type: "error" });
        return;
      }
      handleError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isChange ? "비밀번호 재설정" : "비밀번호 설정"} width="md" closeOnBackdrop={false} onClose={onClose}>
      {!isChange && (
        <p className="text-sm text-zinc-500">
          소셜 로그인으로 가입한 계정은 비밀번호가 없어요. 비밀번호를 설정하면 이메일과 비밀번호로도 로그인할 수 있어요.
        </p>
      )}

      {isChange && (
        <Field label="기존 비밀번호">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="기존 비밀번호를 입력해주세요"
            autoComplete="current-password"
            autoFocus
          />
        </Field>
      )}

      <Field label={isInvalid ? "새 비밀번호 · 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다" : "새 비밀번호"}>
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          placeholder="새 비밀번호를 입력해주세요"
          autoComplete="new-password"
          autoFocus={!isChange}
          invalid={isInvalid}
        />
      </Field>

      <Field label={isMismatch ? "새 비밀번호 확인 · 비밀번호가 일치하지 않습니다" : "새 비밀번호 확인"}>
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="새 비밀번호를 다시 입력해주세요"
          autoComplete="new-password"
          invalid={isMismatch}
          onEnter={handleSubmit}
        />
      </Field>

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
          {saving ? "처리 중..." : isChange ? "변경" : "설정"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
