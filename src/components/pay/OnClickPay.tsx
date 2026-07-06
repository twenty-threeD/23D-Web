"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

interface OnClickPayProps {
  isAgree: boolean;
  price: number;
  orderName?: string;
  orderCustomerName?: string;
  postId?: number;
}

export const OnClickPay = ({ isAgree, price, orderName, orderCustomerName, postId }: OnClickPayProps) => {
  
  const handlePayment = async () => {
    if (!isAgree) return;
    
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert("결제 키가 설정되지 않았습니다.");
      return;
    }

    try {
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
        orderId: `order_${Date.now()}`,
        orderName: `잇다: ${orderName || "잇다 서비스 결제"}`,
        successUrl: `${window.location.origin}/pay/success${postId ? `?postId=${postId}` : ""}`,
        failUrl: `${window.location.origin}/pay/fail${postId ? `?postId=${postId}` : ""}`,
        customerName: orderCustomerName || "익명의 고객",
      });
    } catch (error) {
      console.error("결제 요청 중 오류 발생:", error);
      alert("결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
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