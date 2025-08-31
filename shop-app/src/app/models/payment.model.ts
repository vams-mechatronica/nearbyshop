export interface InitiatePayment {
    order_id: string,
    amount: number,
    currency: string,
    razorpay_key: string,
}

export interface InitiatePaymentOrder {
    order_id: string;
    amount: number;
    currency: string;
    razorpay_key: string;
    razorpay_order_id: string;
}
