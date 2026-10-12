"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useAuthStore } from "@/src/store/authStore";
import { preparePayment } from "@/src/lib/payment";
import { ApiError } from "@/src/lib/apiError";
import { MIN_AMOUNT_MESSAGE, isAmountRejected, isBelowMinAmount } from "@/src/lib/amount";

interface OnClickPayProps {
  /** 수수료를 포함해 서버와 Toss 결제창에 전달할 금액 */
  amount: number;
  orderName?: string;
  orderCustomerName?: string;
  postId?: number;
  /** 결제 후 돌아갈 채팅방. 결제 완료 메시지를 보낼 대상이다 */
  roomId?: string | null;
  contractUrl?: string;
  /** 결제 근거. 서버가 이 계약의 금액과 price 를 대조한다 */
  contractId: number;
}

// 서버 제약: 6~64자
function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 10);
  return `order-${date}-${random}`;
}

// 결제 완료 후 돌아올 때 필요한 값들을 쿼리로 넘긴다
function buildReturnQuery(postId?: number, roomId?: string | null) {
  const query = new URLSearchParams();
  if (postId) query.set("postId", String(postId));
  if (roomId) query.set("roomId", roomId);
  const value = query.toString();
  return value ? `?${value}` : "";
}

// 서버 제약: 100자 이하
function buildOrderName(orderName?: string) {
  return `잇다: ${orderName || "잇다 서비스 결제"}`.slice(0, 100);
}

export const OnClickPay = ({ amount, orderName, orderCustomerName, postId, roomId, contractUrl, contractId }: OnClickPayProps) => {
  const token = useAuthStore((s) => s.accessToken);
  // 계약 금액에 수수료를 더한 최종액도 서버의 최소 결제 금액보다 작으면 결제창을 열지 않는다.
  const amountTooLow = isBelowMinAmount(amount);

  const handlePayment = async () => {
    if (amountTooLow) return;
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

    const numericRoomId = roomId ? Number(roomId) : NaN;
    const prepareBody = {
      amount,
      contractUrl,
      orderName: fullOrderName,
      ...(Number.isFinite(numericRoomId) ? { roomId: numericRoomId } : {}),
      contractId,
    };

    try {
      // 결제창에 넘길 orderId 를 먼저 확정하고 서버에 등록한다.
      // 이 값이 결제창, 승인 요청까지 동일하게 유지되어야 한다.
      let orderId = createOrderId();
      try {
        await preparePayment(token, { orderId, ...prepareBody });
      } catch (e) {
        // 주문번호가 중복된 경우에 한해 새 번호로 한 번만 재시도한다.
        if (e instanceof ApiError && e.code === "PAYMENT_ORDER_ID_DUPLICATED") {
          orderId = createOrderId();
          await preparePayment(token, { orderId, ...prepareBody });
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
          value: amount,
        },
        orderId,
        orderName: fullOrderName,
        successUrl: `${window.location.origin}/pay/success${buildReturnQuery(postId, roomId)}`,
        failUrl: `${window.location.origin}/pay/fail${buildReturnQuery(postId)}`,
        customerName: orderCustomerName || "익명의 고객",
      });
    } catch (error) {
      console.error("결제 요청 중 오류 발생:", error);
      // 사전 등록에 실패하면 결제창을 띄우지 않고 중단한다.
      alert(
        isAmountRejected(error, "amount")
          ? MIN_AMOUNT_MESSAGE
          : error instanceof ApiError
            ? error.message
            : "결제 요청 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={amountTooLow}
        className="h-11 w-full rounded-xl bg-main text-[16px] font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        결제하기
      </button>
      {amountTooLow && <p className="text-xs text-red-500">{MIN_AMOUNT_MESSAGE}</p>}
    </div>
  );
};
