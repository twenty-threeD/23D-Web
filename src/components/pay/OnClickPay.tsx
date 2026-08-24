"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useAuthStore } from "@/src/store/authStore";
import { preparePayment } from "@/src/lib/payment";
import { ApiError } from "@/src/lib/apiError";

interface OnClickPayProps {
  isAgree: boolean;
  price: number;
  orderName?: string;
  orderCustomerName?: string;
  postId?: number;
  contractUrl?: string;
  estimateId?: number;
}

// 서버 제약: 6~64자
function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 10);
  return `order-${date}-${random}`;
}

// 결제 완료 후 돌아올 때 필요한 값들을 쿼리로 넘긴다
function buildReturnQuery(postId?: number, estimateId?: number) {
  const query = new URLSearchParams();
  if (postId) query.set("postId", String(postId));
  if (estimateId) query.set("estimateId", String(estimateId));
  const value = query.toString();
  return value ? `?${value}` : "";
}

// 서버 제약: 100자 이하
function buildOrderName(orderName?: string) {
  return `잇다: ${orderName || "잇다 서비스 결제"}`.slice(0, 100);
}

export const OnClickPay = ({ isAgree, price, orderName, orderCustomerName, postId, contractUrl, estimateId }: OnClickPayProps) => {
  const token = useAuthStore((s) => s.accessToken);

  const handlePayment = async () => {
    if (!isAgree) return;

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert("결제 키가 설정되지 않았습니다.");
      return;
    }
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!contractUrl) {
      alert("계약서 정보를 찾을 수 없습니다. 채팅방의 결제하기 버튼으로 다시 시도해주세요.");
      return;
    }

    const fullOrderName = buildOrderName(orderName);

    try {
      // 결제창에 넘길 orderId 를 먼저 확정하고 서버에 등록한다.
      // 이 값이 결제창, 승인 요청까지 동일하게 유지되어야 한다.
      let orderId = createOrderId();
      try {
        await preparePayment(token, { orderId, amount: price, contractUrl, orderName: fullOrderName });
      } catch (e) {
        // 주문번호가 중복된 경우에 한해 새 번호로 한 번만 재시도한다.
        if (e instanceof ApiError && e.code === "PAYMENT_ORDER_ID_DUPLICATED") {
          orderId = createOrderId();
          await preparePayment(token, { orderId, amount: price, contractUrl, orderName: fullOrderName });
        } else {
          throw e;
        }
      }

      const tossPayments = await loadTossPayments(clientKey);

      const payment = tossPayments.payment({
        customerKey: "ANONYMOUS",
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: price,
        },
        orderId,
        orderName: fullOrderName,
        successUrl: `${window.location.origin}/pay/success${buildReturnQuery(postId, estimateId)}`,
        failUrl: `${window.location.origin}/pay/fail${buildReturnQuery(postId)}`,
        customerName: orderCustomerName || "익명의 고객",
      });
    } catch (error) {
      console.error("결제 요청 중 오류 발생:", error);
      // 사전 등록에 실패하면 결제창을 띄우지 않고 중단한다.
      alert(
        error instanceof ApiError
          ? error.message
          : "결제 요청 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={!isAgree}
        className={`w-87.5 mt-5 py-3 rounded-lg text-lg font-bold transition-colors
          ${isAgree
            ? "bg-main text-white hover:bg-main/90 cursor-pointer"
            : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
          }`}
      >
        결제하기
      </button>
    </div>
  );
};