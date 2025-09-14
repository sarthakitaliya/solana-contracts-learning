import * as borsh from "borsh";

export class CounterAcc {
  count: number;

  constructor({ count }: { count: number }) {
    this.count = count;
  }
}
export const schema: borsh.Schema = {
  struct: {
    count: "u32",
  },
};
