// Simulated payout provider. In production this would call the payout partner's API.

export interface PayoutRequest {
  transferId: string;
  receiveAmountMinor: number;
  receiveCurrency: string;
  recipientName: string;
  accountNumber: string;
}

export interface PayoutProvider {
  submit(request: PayoutRequest): Promise<string>;
}

export class SimulatedPayoutProvider implements PayoutProvider {
  async submit(request: PayoutRequest): Promise<string> {
    // Simulate network latency to the provider
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (request.accountNumber.startsWith("000")) {
      throw new Error("Payout rejected: invalid account");
    }

    return `PAY-${request.transferId.slice(0, 8).toUpperCase()}`;
  }
}
